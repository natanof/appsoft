document.addEventListener("DOMContentLoaded", () => {
    const userForm = document.getElementById("userForm");
    const usuariosContainer = document.getElementById("usuariosContainer");
    const searchInput = document.getElementById("searchInput");
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");
    const pageInfo = document.getElementById("pageInfo");
  
    let usuarios = [];
    let currentPage = 1;
    const itemsPerPage = 4;
  
    // Carregar usuários
    function carregarUsuarios() {
      const stored = localStorage.getItem("usuarios");
      if (stored) {
        usuarios = JSON.parse(stored);
      } else {
        // Dados iniciais
        usuarios = [
          { id: 1, nome: "João Silva", email: "joao@example.com", telefone: "(11) 98765-4321", foto: "https://i.pravatar.cc/150?img=1" },
          { id: 2, nome: "Maria Oliveira", email: "maria@example.com", telefone: "(21) 99876-5432", foto: "https://i.pravatar.cc/150?img=2" }
        ];
        salvarUsuarios();
      }
    }
  
    function salvarUsuarios() {
      localStorage.setItem("usuarios", JSON.stringify(usuarios));
    }
  
    function mostrarUsuarios(lista, page = 1) {
      usuariosContainer.innerHTML = "";
      const startIndex = (page - 1) * itemsPerPage;
      const paginatedUsers = lista.slice(startIndex, startIndex + itemsPerPage);
  
      paginatedUsers.forEach(usuario => {
        const div = document.createElement("div");
        div.className = "usuario-card";
        div.innerHTML = `
          <img src="${usuario.foto}" alt="Foto de ${usuario.nome}" onerror="this.src='https://via.placeholder.com/150?text=Sem+Foto'">
          <div class="usuario-info">
            <h3>${usuario.nome}</h3>
            <p>Email: ${usuario.email}</p>
            <p>Telefone: ${usuario.telefone}</p>
            <button class="remove-button" data-user-id="${usuario.id}"><iconify-icon icon="mdi:delete"></iconify-icon> Remover</button>
          </div>
        `;
        usuariosContainer.appendChild(div);
      });
  
      updatePaginationButtons(lista.length, page);
    }
  
    function updatePaginationButtons(totalItems, page) {
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      prevPageBtn.disabled = page === 1;
      nextPageBtn.disabled = page === totalPages;
      pageInfo.textContent = `Página ${page} de ${totalPages}`;
    }
  
    function filtrarUsuarios(termo) {
      return usuarios.filter(u =>
        u.nome.toLowerCase().includes(termo.toLowerCase())
      );
    }
  
    // Função para validar e-mail
    function isValidEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).toLowerCase());
    }
  
    // Função para validar telefone
    function isValidPhone(phone) {
      return /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(phone);
    }
  
    // Evento do formulário
    userForm.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const nome = document.getElementById("nome").value.trim();
      const email = document.getElementById("email").value.trim();
      const telefone = document.getElementById("telefone").value.trim();
      const fotoInput = document.getElementById("foto");
      const file = fotoInput.files?.[0];
  
      if (!nome || !email || !telefone) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
      }
  
      if (!isValidEmail(email)) {
        alert("Por favor, insira um e-mail válido.");
        return;
      }
  
      if (!isValidPhone(telefone)) {
        alert("Por favor, insira um telefone válido. Ex: (11) 98765-4321");
        return;
      }
  
      const reader = new FileReader();
      reader.onload = function (event) {
        const novoUsuario = {
          id: Date.now(),
          nome,
          email,
          telefone,
          foto: event.target.result
        };
  
        usuarios.unshift(novoUsuario);
        salvarUsuarios();
        mostrarUsuarios(usuarios, 1);
        currentPage = 1;
        userForm.reset();
      };
  
      if (file) {
        reader.readAsDataURL(file);
      } else {
        const novoUsuario = {
          id: Date.now(),
          nome,
          email,
          telefone,
          foto: "https://via.placeholder.com/150?text=Sem+Foto"
        };
        usuarios.unshift(novoUsuario);
        salvarUsuarios();
        mostrarUsuarios(usuarios, 1);
        currentPage = 1;
        userForm.reset();
      }
    });
  
    // Busca
    searchInput.addEventListener("input", () => {
      const termo = searchInput.value;
      const filtrados = filtrarUsuarios(termo);
      mostrarUsuarios(filtrados, 1);
    });
  
    // Paginação
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        mostrarUsuarios(usuarios, currentPage);
      }
    });
  
    nextPageBtn.addEventListener("click", () => {
      const totalPages = Math.ceil(usuarios.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        mostrarUsuarios(usuarios, currentPage);
      }
    });
  
    // Remover usuário
    usuariosContainer.addEventListener("click", (e) => {
      if (e.target.closest(".remove-button")) {
        const userId = parseInt(e.target.closest(".remove-button").dataset.userId);
        const usuario = usuarios.find(u => u.id === userId);
        if (confirm(`Tem certeza que deseja remover "${usuario.nome}"?`)) {
          usuarios = usuarios.filter(u => u.id !== userId);
          salvarUsuarios();
          mostrarUsuarios(usuarios, currentPage);
        }
      }
    });
  
    // Inicializar
    carregarUsuarios();
    mostrarUsuarios(usuarios, currentPage);
  });

(function cadastrarUsuariosFake() {
  const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
  
  for (let i = 1; i <= 50; i++) {
    const novoUsuario = {
      id: Date.now() + i,
      nome: `Usuário ${i}`,
      email: `usuario${i}@teste.com`,
      telefone: `(11) 90000-00${i.toString().padStart(2, "0")}`,
      foto: `https://i.pravatar.cc/150?img=${(i % 70) + 1}` // Usa até 70 imagens diferentes
    };
    usuarios.unshift(novoUsuario);
  }

  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  alert("✅ 50 usuários cadastrados!");
  location.reload(); // Recarrega a página para exibir os novos usuários
})();
