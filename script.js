document.addEventListener('DOMContentLoaded', () => {

  // ==========================
  // === Navegação entre Seções ===
  // ==========================
  const links = document.querySelectorAll('nav ul li a');
  const conteudos = document.querySelectorAll('.conteudo');

  window.mostrarSecao = (targetId) => {
    conteudos.forEach(c => c.style.display = c.id === targetId ? 'block' : 'none');
  };

  mostrarSecao('inicio');

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      mostrarSecao(link.getAttribute('data-target'));
    });
  });

  ['linkCadastro', 'linkLogin'].forEach(id => {
    const link = document.getElementById(id);
    if (link) {
      link.addEventListener('click', e => {
        e.preventDefault();
        mostrarSecao(id.replace('link', '').toLowerCase());
      });
    }
  });

  // ==========================
  // === Utilitários Comuns ===
  // ==========================
  const criarBotaoRemover = (onClick) => {
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.type = 'button';
    btn.className = 'btn-remover-item';
    btn.style.cssText = `
      background: linear-gradient(135deg, #ff4757, #ff3838);
      color: white; border: none; border-radius: 50%;
      width: 28px; height: 28px; cursor: pointer;
      font-size: 18px; font-weight: bold;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(255,71,87,0.3);
    `;
    btn.addEventListener('click', onClick);
    return btn;
  };

  const criarContainer = (conteudo, btnRemover) => {
    const container = document.createElement('div');
    container.style.cssText = `
      border: 1px solid #444; padding: 12px 35px 12px 12px;
      margin-bottom: 10px; border-radius: 8px;
      background: linear-gradient(135deg, #2a2a2a, #1e1e1e);
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
    `;
    container.appendChild(conteudo);
    container.appendChild(btnRemover);
    return container;
  };

  // ==========================
  // === Storage por Utilizador ===
  // ==========================

  function chaveUsuario(tipo) {
    const logado = getUsuarioLogado();
    if (!logado) return null;
    return `euphoria_${tipo}_${logado.email}`;
  }

  function carregarDoUsuario(tipo) {
    const chave = chaveUsuario(tipo);
    if (!chave) return [];
    return JSON.parse(localStorage.getItem(chave) || '[]');
  }

  function salvarDoUsuario(tipo, dados) {
    const chave = chaveUsuario(tipo);
    if (!chave) return;
    localStorage.setItem(chave, JSON.stringify(dados));
  }

  // ==========================
  // === Lógica de Campanhas ===
  // ==========================

  let campanhas = [];
  let editandoIndex = null;

  const formCampanha = document.getElementById("formCampanha");
  const campanhasContainer = document.getElementById("campanhasContainer");
  const templateCampanha = document.getElementById("templateCampanha");
  const secaoEditar = document.getElementById("editarCampanha");
  const formEditar = document.getElementById("formEditarCampanha");
  const cancelarEditar = document.getElementById("cancelarEditar");

  function lerImagem(file) {
    return new Promise((resolve) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  function renderizarCampanhas() {
    campanhasContainer.innerHTML = "";

    campanhas.forEach((campanha, index) => {
      const clone = templateCampanha.content.cloneNode(true);

      const img = clone.querySelector("img");
      img.src = campanha.imagem || "https://placehold.co/600x300?text=Sem+Imagem";
      img.alt = campanha.nome;

      clone.querySelector(".nome-sobre-imagem").textContent = campanha.nome;
      clone.querySelector(".descricao-campanha").textContent = campanha.descricao;

      clone.querySelector(".btn-remover").addEventListener("click", () => removerCampanha(index));
      clone.querySelector(".btn-editar").addEventListener("click", () => abrirEditar(index));
      clone.querySelector(".btn-visualizar").addEventListener("click", () => visualizarCampanha(index));

      campanhasContainer.appendChild(clone);
    });
  }

  function carregarCampanhas() {
    campanhas = carregarDoUsuario('campanhas');
    renderizarCampanhas();
  }

  formCampanha.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const imagemFile = document.getElementById("imagem").files[0];
    const imagem = await lerImagem(imagemFile);

    campanhas.push({ nome, descricao, imagem });
    salvarDoUsuario('campanhas', campanhas);
    renderizarCampanhas();
    formCampanha.reset();
  });

  function removerCampanha(index) {
    campanhas.splice(index, 1);
    salvarDoUsuario('campanhas', campanhas);
    renderizarCampanhas();
  }

  function abrirEditar(index) {
    editandoIndex = index;
    const campanha = campanhas[index];

    document.getElementById("editNome").value = campanha.nome;
    document.getElementById("editDescricao").value = campanha.descricao;

    const preview = document.getElementById("editImagemPreview");
    preview.src = campanha.imagem || "";
    preview.style.display = campanha.imagem ? "block" : "none";

    secaoEditar.style.display = "block";
    secaoEditar.scrollIntoView({ behavior: "smooth" });
  }

  formEditar.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("editNome").value.trim();
    const descricao = document.getElementById("editDescricao").value.trim();
    const imagemFile = document.getElementById("editImagem").files[0];
    const novaImagem = await lerImagem(imagemFile);

    campanhas[editandoIndex] = {
      nome,
      descricao,
      imagem: novaImagem || campanhas[editandoIndex].imagem,
    };

    salvarDoUsuario('campanhas', campanhas);
    renderizarCampanhas();
    fecharEditar();
  });

  cancelarEditar.addEventListener("click", fecharEditar);

  function fecharEditar() {
    editandoIndex = null;
    secaoEditar.style.display = "none";
    formEditar.reset();
    document.getElementById("editImagemPreview").src = "";
  }

  function visualizarCampanha(index) {
    const campanha = campanhas[index];

    const modalExistente = document.getElementById('modal-campanha');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-campanha';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1e1e1e, #2a2a2a);
        border: 1px solid #444; border-radius: 16px;
        max-width: 600px; width: 90%; padding: 24px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        position: relative;
      ">
        <button id="fecharModalCampanha" style="
          position: absolute; top: 12px; right: 16px;
          background: none; border: none; color: #aaa;
          font-size: 24px; cursor: pointer;
        ">×</button>
        <img src="${campanha.imagem || 'https://placehold.co/600x300?text=Sem+Imagem'}"
          style="width:100%; border-radius: 10px; margin-bottom: 16px; max-height: 280px; object-fit: cover;" />
        <h2 style="color: #fff; margin-bottom: 10px;">${campanha.nome}</h2>
        <p style="color: #ccc; line-height: 1.6;">${campanha.descricao}</p>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('#fecharModalCampanha').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }

  document.getElementById("editImagem").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const src = await lerImagem(file);
    const preview = document.getElementById("editImagemPreview");
    if (src) {
      preview.src = src;
      preview.style.display = "block";
    }
  });

  // ==========================
  // === Sistema de Fichas ===
  // ==========================

  const formFicha = document.getElementById('formFicha');
  const listaFichas = document.getElementById('listaFichas');
  const arquivoFichaInput = document.getElementById('arquivoFicha');
  const previewFichaSelecionada = document.getElementById('previewFichaSelecionada');

  let fichas = [];

  arquivoFichaInput.addEventListener('change', () => {
    const file = arquivoFichaInput.files[0];
    previewFichaSelecionada.textContent = file ? `📎 ${file.name}` : '';
  });

  document.querySelector('label[for="arquivoFicha"]').addEventListener('click', () => {
    arquivoFichaInput.click();
  });

  formFicha.addEventListener('submit', (e) => {
    e.preventDefault();

    const nomeFicha = document.getElementById('nomeFicha').value.trim();
    const arquivo = arquivoFichaInput.files[0];

    if (!nomeFicha || !arquivo) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const ficha = {
        id: Date.now(),
        nome: nomeFicha,
        nomeArquivo: arquivo.name,
        tipo: arquivo.name.endsWith('.csv') ? 'csv' : 'xlsx',
        dataBase64: ev.target.result,
      };

      fichas.push(ficha);
      salvarDoUsuario('fichas', fichas);
      renderFichas();

      formFicha.reset();
      previewFichaSelecionada.textContent = '';
    };
    reader.readAsDataURL(arquivo);
  });

  function carregarFichas() {
    fichas = carregarDoUsuario('fichas');
    renderFichas();
  }

  function renderFichas() {
    listaFichas.innerHTML = '';

    if (fichas.length === 0) {
      listaFichas.innerHTML = '<p style="text-align:center; opacity:0.5;">Nenhuma ficha enviada ainda.</p>';
      return;
    }

    fichas.forEach((ficha) => {
      const card = document.createElement('div');
      card.className = 'card-ficha';
      card.innerHTML = `
        <div class="ficha-info">
          <h3 class="ficha-nome">${ficha.nome}</h3>
          <span class="ficha-arquivo">${ficha.nomeArquivo}</span>
        </div>
        <div class="ficha-botoes">
          <a class="btn-download" href="${ficha.dataBase64}" download="${ficha.nomeArquivo}">⬇ Baixar</a>
          <button class="btn-remover-ficha" data-id="${ficha.id}">🗑 Remover</button>
        </div>
      `;
      listaFichas.appendChild(card);
    });

    document.querySelectorAll('.btn-remover-ficha').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        fichas = fichas.filter((f) => f.id !== id);
        salvarDoUsuario('fichas', fichas);
        renderFichas();
      });
    });
  }

  // ==========================
  // === Sistema de Login/Registo ===
  // ==========================

  function getUsuarios() {
    return JSON.parse(localStorage.getItem('euphoria_usuarios') || '[]');
  }

  function salvarUsuarios(usuarios) {
    localStorage.setItem('euphoria_usuarios', JSON.stringify(usuarios));
  }

  function getUsuarioLogado() {
    const dados = sessionStorage.getItem('euphoria_logado');
    return dados ? JSON.parse(dados) : null;
  }

  function setUsuarioLogado(usuario) {
    sessionStorage.setItem('euphoria_logado', JSON.stringify(usuario));
  }

  function deslogarUsuario() {
    sessionStorage.removeItem('euphoria_logado');
  }

  function exibirMensagem(formId, texto, tipo = 'erro') {
    const msgId = 'msg-' + formId;
    let msg = document.getElementById(msgId);

    if (!msg) {
      msg = document.createElement('p');
      msg.id = msgId;
      msg.style.cssText = `
        margin-top: 10px; padding: 10px 14px; border-radius: 8px;
        font-size: 0.9rem; font-weight: 500; text-align: center;
      `;
      const form = document.getElementById(formId);
      if (form) form.appendChild(msg);
    }

    msg.textContent = texto;
    msg.style.display = 'block';
    msg.style.background = tipo === 'erro' ? 'rgba(255,71,87,0.15)' : 'rgba(46,213,115,0.15)';
    msg.style.color = tipo === 'erro' ? '#ff4757' : '#2ed573';
    msg.style.border = tipo === 'erro' ? '1px solid rgba(255,71,87,0.3)' : '1px solid rgba(46,213,115,0.3)';

    setTimeout(() => { msg.style.display = 'none'; }, 4000);
  }

  function mostrarModalLogin() {
    const existente = document.getElementById('modal-auth');
    if (existente) existente.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-auth';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1e1e1e, #2a2a2a);
        border: 1px solid #ff4757; border-radius: 16px;
        max-width: 420px; width: 90%; padding: 36px 28px;
        box-shadow: 0 20px 60px rgba(255,71,87,0.2);
        text-align: center; position: relative;
      ">
        <button id="fecharModalAuth" style="
          position: absolute; top: 12px; right: 16px;
          background: none; border: none; color: #aaa;
          font-size: 24px; cursor: pointer;
        ">×</button>
        <div style="font-size: 48px; margin-bottom: 12px;">🔒</div>
        <h2 style="color: #ff4757; margin-bottom: 10px; font-size: 1.4rem;">Acesso Restrito</h2>
        <p style="color: #ccc; margin-bottom: 24px; line-height: 1.6;">
          Você precisa estar logado para realizar esta ação.<br>
          Faça login ou crie uma conta para continuar.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button id="modalBtnLogin" style="
            background: linear-gradient(135deg, #ff4757, #ff3838);
            color: white; border: none; border-radius: 20px;
            padding: 10px 28px; cursor: pointer; font-size: 0.95rem;
            font-weight: 600; box-shadow: 0 2px 8px rgba(255,71,87,0.4);
          ">Fazer Login</button>
          <button id="modalBtnCadastro" style="
            background: transparent; color: #ff4757;
            border: 1px solid #ff4757; border-radius: 20px;
            padding: 10px 28px; cursor: pointer; font-size: 0.95rem; font-weight: 600;
          ">Cadastrar-se</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#modalBtnLogin').addEventListener('click', () => { modal.remove(); mostrarSecao('login'); });
    modal.querySelector('#modalBtnCadastro').addEventListener('click', () => { modal.remove(); mostrarSecao('cadastro'); });
    modal.querySelector('#fecharModalAuth').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }

  function protegerFormulario(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      if (!getUsuarioLogado()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        mostrarModalLogin();
      }
    }, true);
  }

  protegerFormulario('formCampanha');
  protegerFormulario('formFicha');

  function atualizarUILogin() {
    const usuario = getUsuarioLogado();
    const navLogin = document.querySelector('a[data-target="login"]');
    const btnExistente = document.getElementById('btn-sair');
    if (btnExistente) btnExistente.remove();

    if (usuario) {
      if (navLogin) {
        navLogin.innerHTML = `
          <img src="imagens/amarelo.png" alt="Login" style="width: 30px; height: auto;">
          ${usuario.nome}
        `;
      }

      const nav = document.querySelector('nav ul');
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.id = 'btn-sair';
      btn.textContent = 'Sair';
      btn.style.cssText = `
        background: linear-gradient(135deg, #ff4757, #ff3838);
        color: white; border: none; border-radius: 20px;
        padding: 8px 20px; cursor: pointer; font-size: 0.85rem;
        font-weight: 600; width: 100%; margin-top: 8px;
        box-shadow: 0 2px 8px rgba(255,71,87,0.4);
        transition: opacity 0.2s ease;
      `;
      btn.addEventListener('mouseenter', () => btn.style.opacity = '0.85');
      btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
      btn.addEventListener('click', () => {
        deslogarUsuario();
        // Limpa a UI de campanhas e fichas ao sair
        campanhas = [];
        fichas = [];
        renderizarCampanhas();
        renderFichas();
        atualizarUILogin();
        mostrarSecao('inicio');
      });
      li.appendChild(btn);
      nav.appendChild(li);

      // Carrega os dados do utilizador que acabou de entrar
      carregarCampanhas();
      carregarFichas();

    } else {
      if (navLogin) {
        navLogin.innerHTML = `
          <img src="imagens/amarelo.png" alt="Login" style="width: 30px; height: auto;">
          Login
        `;
      }
      campanhas = [];
      fichas = [];
      renderizarCampanhas();
      renderFichas();
    }
  }

  // --- Login ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim().toLowerCase();
      const senha = document.getElementById('senha').value;

      if (!email || !senha) {
        exibirMensagem('loginForm', 'Preencha todos os campos.', 'erro');
        return;
      }

      const usuario = getUsuarios().find(u => u.email === email && u.senha === senha);

      if (!usuario) {
        exibirMensagem('loginForm', 'Email ou senha incorretos.', 'erro');
        return;
      }

      setUsuarioLogado({ nome: usuario.nome, email: usuario.email });
      exibirMensagem('loginForm', `Bem-vindo de volta, ${usuario.nome}! 🎲`, 'sucesso');

      setTimeout(() => {
        atualizarUILogin();
        loginForm.reset();
        mostrarSecao('inicio');
      }, 1200);
    });
  }

  // --- Cadastro ---
  const formCadastro = document.getElementById('formCadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', (e) => {
      e.preventDefault();

      const nome = document.getElementById('cadastroNome').value.trim();
      const email = document.getElementById('cadastroEmail').value.trim().toLowerCase();
      const senha = document.getElementById('cadastroSenha').value;

      if (!nome || !email || !senha) {
        exibirMensagem('formCadastro', 'Preencha todos os campos.', 'erro');
        return;
      }
      if (nome.length < 3) {
        exibirMensagem('formCadastro', 'Nome deve ter pelo menos 3 caracteres.', 'erro');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        exibirMensagem('formCadastro', 'Email inválido.', 'erro');
        return;
      }
      if (senha.length < 6) {
        exibirMensagem('formCadastro', 'A senha deve ter pelo menos 6 caracteres.', 'erro');
        return;
      }

      const usuarios = getUsuarios();
      if (usuarios.find(u => u.email === email)) {
        exibirMensagem('formCadastro', 'Este email já está cadastrado.', 'erro');
        return;
      }

      usuarios.push({ nome, email, senha });
      salvarUsuarios(usuarios);
      setUsuarioLogado({ nome, email });

      exibirMensagem('formCadastro', `Conta criada! Bem-vindo, ${nome}! 🎉`, 'sucesso');

      setTimeout(() => {
        atualizarUILogin();
        formCadastro.reset();
        mostrarSecao('inicio');
      }, 1500);
    });
  }

  // Inicializa ao carregar — se já havia sessão ativa, carrega os dados
  atualizarUILogin();

});