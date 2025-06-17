document.addEventListener("DOMContentLoaded", () => {
    // Elementos do DOM
    const userForm = document.getElementById("userForm");
    const usuariosContainer = document.getElementById("usuariosContainer");
    const searchInput = document.getElementById("searchInput");
    const clearSearchBtn = document.getElementById("clearSearch");
    const cargoFilter = document.getElementById("cargoFilter");
    const sortBy = document.getElementById("sortBy");
    const exportBtn = document.getElementById("exportData");
    const gridViewBtn = document.getElementById("gridView");
    const listViewBtn = document.getElementById("listView");
    const itemsPerPageSelect = document.getElementById("itemsPerPageSelect");
    
    // Elementos de paginação
    const firstPageBtn = document.getElementById("firstPage");
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");
    const lastPageBtn = document.getElementById("lastPage");
    const pageNumbers = document.getElementById("pageNumbers");
    const pageInfo = document.getElementById("pageInfo");
    
    // Elementos de estatísticas
    const totalUsersEl = document.getElementById("totalUsers");
    const newUsersTodayEl = document.getElementById("newUsersToday");
    const filteredUsersEl = document.getElementById("filteredUsers");
    
    // Elementos do modal
    const confirmModal = document.getElementById("confirmModal");
    const editModal = document.getElementById("editModal");
    const emptyState = document.getElementById("emptyState");
    
    // Elementos de preview de arquivo
    const fotoInput = document.getElementById("foto");
    const filePreview = document.getElementById("filePreview");
    
    // Estado da aplicação
    let usuarios = [];
    let filteredUsuarios = [];
    let currentPage = 1;
    let itemsPerPage = 4;
    let currentView = 'grid';
    let currentSort = 'nome';
    let currentFilter = '';
    let currentSearch = '';
    
    // Inicialização
    init();
    
    function init() {
        carregarUsuarios();
        setupEventListeners();
        updateStats();
        applyFiltersAndSort();
        mostrarUsuarios();
        updatePagination();
        
        // Adicionar animações de entrada com delay
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
    }
    
    function setupEventListeners() {
        // Formulário principal
        userForm.addEventListener("submit", handleFormSubmit);
        document.getElementById("clearForm").addEventListener("click", clearForm);
        
        // Busca e filtros
        searchInput.addEventListener("input", handleSearch);
        clearSearchBtn.addEventListener("click", clearSearch);
        cargoFilter.addEventListener("change", handleFilter);
        sortBy.addEventListener("change", handleSort);
        
        // Visualização
        gridViewBtn.addEventListener("click", () => setView('grid'));
        listViewBtn.addEventListener("click", () => setView('list'));
        
        // Paginação
        firstPageBtn.addEventListener("click", () => goToPage(1));
        prevPageBtn.addEventListener("click", () => goToPage(currentPage - 1));
        nextPageBtn.addEventListener("click", () => goToPage(currentPage + 1));
        lastPageBtn.addEventListener("click", () => goToPage(getTotalPages()));
        itemsPerPageSelect.addEventListener("change", handleItemsPerPageChange);
        
        // Export
        exportBtn.addEventListener("click", exportData);
        
        // Preview de arquivo
        fotoInput.addEventListener("change", handleFilePreview);
        
        // Modal events
        setupModalEvents();
        
        // Validação em tempo real
        setupRealTimeValidation();
        
        // Eventos de toque para iOS
        setupTouchEvents();
    }
    
    function setupTouchEvents() {
        // Adicionar feedback tátil para botões em dispositivos iOS
        const buttons = document.querySelectorAll('button, .btn-primary, .btn-secondary, .btn-danger, .btn-export');
        
        buttons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.style.transform = '';
                }, 100);
            });
        });
        
        // Adicionar suporte a swipe para cards de usuário
        let startX, startY, currentX, currentY;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
            
            const diffX = startX - currentX;
            const diffY = startY - currentY;
            
            // Prevenir scroll horizontal desnecessário
            if (Math.abs(diffX) > Math.abs(diffY)) {
                e.preventDefault();
            }
        });
    }
    
    function setupModalEvents() {
        // Confirm Modal
        document.getElementById("modalClose").addEventListener("click", closeConfirmModal);
        document.getElementById("modalCancel").addEventListener("click", closeConfirmModal);
        document.getElementById("modalConfirm").addEventListener("click", handleConfirmAction);
        
        // Edit Modal
        document.getElementById("editModalClose").addEventListener("click", closeEditModal);
        document.getElementById("editModalCancel").addEventListener("click", closeEditModal);
        document.getElementById("editModalSave").addEventListener("click", handleEditSave);
        
        // Close modal on backdrop click
        confirmModal.addEventListener("click", (e) => {
            if (e.target === confirmModal) closeConfirmModal();
        });
        
        editModal.addEventListener("click", (e) => {
            if (e.target === editModal) closeEditModal();
        });
        
        // Suporte a ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeConfirmModal();
                closeEditModal();
            }
        });
    }
    
    function setupRealTimeValidation() {
        const inputs = [
            { id: 'nome', validator: validateNome },
            { id: 'email', validator: validateEmail },
            { id: 'telefone', validator: validateTelefone },
            { id: 'cargo', validator: validateCargo }
        ];
        
        inputs.forEach(({ id, validator }) => {
            const input = document.getElementById(id);
            const errorEl = document.getElementById(`${id}Error`);
            
            input.addEventListener('blur', () => {
                const error = validator(input.value.trim());
                showFieldError(errorEl, error);
                
                // Adicionar feedback visual iOS
                if (error) {
                    input.style.borderColor = 'var(--danger-color)';
                    input.style.boxShadow = '0 0 0 4px rgba(255, 59, 48, 0.1)';
                } else if (input.value.trim()) {
                    input.style.borderColor = 'var(--success-color)';
                    input.style.boxShadow = '0 0 0 4px rgba(52, 199, 89, 0.1)';
                }
            });
            
            input.addEventListener('input', () => {
                if (errorEl.textContent) {
                    const error = validator(input.value.trim());
                    showFieldError(errorEl, error);
                }
            });
            
            input.addEventListener('focus', () => {
                input.style.borderColor = 'var(--primary-color)';
                input.style.boxShadow = '0 0 0 4px var(--primary-light)';
            });
        });
    }
    
    function showFieldError(errorEl, error) {
        errorEl.textContent = error || '';
        
        if (error) {
            errorEl.style.opacity = '1';
            errorEl.style.transform = 'translateY(0)';
        } else {
            errorEl.style.opacity = '0';
            errorEl.style.transform = 'translateY(-10px)';
        }
    }
    
    // Validadores
    function validateNome(nome) {
        if (!nome) return 'Nome é obrigatório';
        if (nome.length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        if (nome.length > 100) return 'Nome deve ter no máximo 100 caracteres';
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(nome)) return 'Nome deve conter apenas letras e espaços';
        return '';
    }
    
    function validateEmail(email) {
        if (!email) return 'Email é obrigatório';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Email inválido';
        if (email.length > 255) return 'Email muito longo';
        
        // Verificar se email já existe (exceto na edição)
        const existingUser = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
        const editingUserId = document.getElementById("editUserId")?.value;
        if (existingUser && existingUser.id != editingUserId) {
            return 'Este email já está cadastrado';
        }
        
        return '';
    }
    
    function validateTelefone(telefone) {
        if (!telefone) return 'Telefone é obrigatório';
        const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
        if (!phoneRegex.test(telefone)) return 'Formato inválido. Use: (11) 99999-9999';
        return '';
    }
    
    function validateCargo(cargo) {
        if (!cargo) return 'Cargo é obrigatório';
        return '';
    }
    
    function carregarUsuarios() {
        const stored = localStorage.getItem("usuarios");
        if (stored) {
            usuarios = JSON.parse(stored);
        } else {
            // Dados iniciais mais realistas
            usuarios = [
                {
                    id: 1,
                    nome: "Ana Silva Santos",
                    email: "ana.santos@empresa.com",
                    telefone: "(11) 98765-4321",
                    cargo: "Desenvolvedor",
                    foto: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
                    dataCadastro: new Date().toISOString()
                },
                {
                    id: 2,
                    nome: "Carlos Eduardo Lima",
                    email: "carlos.lima@empresa.com",
                    telefone: "(21) 99876-5432",
                    cargo: "Designer",
                    foto: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
                    dataCadastro: new Date().toISOString()
                },
                {
                    id: 3,
                    nome: "Mariana Costa Oliveira",
                    email: "mariana.oliveira@empresa.com",
                    telefone: "(31) 97654-3210",
                    cargo: "Gerente",
                    foto: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
                    dataCadastro: new Date().toISOString()
                }
            ];
            salvarUsuarios();
        }
    }
    
    function salvarUsuarios() {
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        updateStats();
    }
    
    function updateStats() {
        const today = new Date().toDateString();
        const newToday = usuarios.filter(u => 
            new Date(u.dataCadastro).toDateString() === today
        ).length;
        
        // Animação de contagem para os números
        animateNumber(totalUsersEl, usuarios.length);
        animateNumber(newUsersTodayEl, newToday);
        animateNumber(filteredUsersEl, filteredUsuarios.length);
    }
    
    function animateNumber(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 500;
        const steps = Math.abs(targetValue - currentValue);
        const stepDuration = duration / steps;
        
        if (steps === 0) return;
        
        let current = currentValue;
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            if (current === targetValue) {
                clearInterval(timer);
            }
        }, stepDuration);
    }
    
    function applyFiltersAndSort() {
        let result = [...usuarios];
        
        // Aplicar busca
        if (currentSearch) {
            result = result.filter(u =>
                u.nome.toLowerCase().includes(currentSearch.toLowerCase()) ||
                u.email.toLowerCase().includes(currentSearch.toLowerCase()) ||
                u.cargo.toLowerCase().includes(currentSearch.toLowerCase())
            );
        }
        
        // Aplicar filtro de cargo
        if (currentFilter) {
            result = result.filter(u => u.cargo === currentFilter);
        }
        
        // Aplicar ordenação
        result.sort((a, b) => {
            switch (currentSort) {
                case 'nome':
                    return a.nome.localeCompare(b.nome);
                case 'email':
                    return a.email.localeCompare(b.email);
                case 'cargo':
                    return a.cargo.localeCompare(b.cargo);
                case 'data':
                    return new Date(b.dataCadastro) - new Date(a.dataCadastro);
                default:
                    return 0;
            }
        });
        
        filteredUsuarios = result;
        updateStats();
        
        // Ajustar página atual se necessário
        const totalPages = getTotalPages();
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        } else if (currentPage < 1) {
            currentPage = 1;
        }
    }
    
    function mostrarUsuarios() {
        usuariosContainer.innerHTML = "";
        usuariosContainer.className = currentView === 'grid' ? 'usuarios-grid' : 'usuarios-list';
        
        if (filteredUsuarios.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedUsers = filteredUsuarios.slice(startIndex, startIndex + itemsPerPage);
        
        paginatedUsers.forEach((usuario, index) => {
            const div = document.createElement("div");
            div.className = `usuario-card ${currentView === 'list' ? 'list-view' : ''}`;
            div.style.animationDelay = `${index * 0.1}s`;
            
            const dataFormatada = new Date(usuario.dataCadastro).toLocaleDateString('pt-BR');
            
            div.innerHTML = `
                <img src="${usuario.foto}" alt="Foto de ${usuario.nome}" 
                     onerror="this.src='https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'">
                <div class="usuario-info">
                    <h3>${usuario.nome}</h3>
                    <p><iconify-icon icon="mdi:email"></iconify-icon> ${usuario.email}</p>
                    <p><iconify-icon icon="mdi:phone"></iconify-icon> ${usuario.telefone}</p>
                    <p><iconify-icon icon="mdi:calendar"></iconify-icon> Cadastrado em ${dataFormatada}</p>
                    <span class="cargo">${usuario.cargo}</span>
                </div>
                <div class="usuario-actions">
                    <button class="action-btn edit-btn" data-user-id="${usuario.id}">
                        <iconify-icon icon="mdi:pencil"></iconify-icon> Editar
                    </button>
                    <button class="action-btn remove-btn" data-user-id="${usuario.id}">
                        <iconify-icon icon="mdi:delete"></iconify-icon> Remover
                    </button>
                </div>
            `;
            
            usuariosContainer.appendChild(div);
        });
        
        // Adicionar event listeners para os botões
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.currentTarget.dataset.userId);
                editUser(userId);
            });
        });
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.currentTarget.dataset.userId);
                confirmRemoveUser(userId);
            });
        });
    }
    
    function updatePagination() {
        const totalPages = getTotalPages();
        
        // Atualizar botões de navegação
        firstPageBtn.disabled = currentPage === 1;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        lastPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        
        // Atualizar números das páginas
        pageNumbers.innerHTML = '';
        
        if (totalPages <= 7) {
            // Mostrar todas as páginas
            for (let i = 1; i <= totalPages; i++) {
                createPageButton(i);
            }
        } else {
            // Mostrar páginas com ellipsis
            createPageButton(1);
            
            if (currentPage > 4) {
                createEllipsis();
            }
            
            const start = Math.max(2, currentPage - 2);
            const end = Math.min(totalPages - 1, currentPage + 2);
            
            for (let i = start; i <= end; i++) {
                createPageButton(i);
            }
            
            if (currentPage < totalPages - 3) {
                createEllipsis();
            }
            
            if (totalPages > 1) {
                createPageButton(totalPages);
            }
        }
        
        // Atualizar informações da página
        pageInfo.textContent = totalPages > 0 
            ? `Página ${currentPage} de ${totalPages}` 
            : 'Nenhum resultado';
    }
    
    function createPageButton(pageNum) {
        const btn = document.createElement('button');
        btn.textContent = pageNum;
        btn.className = currentPage === pageNum ? 'active' : '';
        btn.addEventListener('click', () => goToPage(pageNum));
        pageNumbers.appendChild(btn);
    }
    
    function createEllipsis() {
        const span = document.createElement('span');
        span.textContent = '...';
        span.style.padding = '8px';
        span.style.color = 'var(--text-secondary)';
        pageNumbers.appendChild(span);
    }
    
    function getTotalPages() {
        return Math.ceil(filteredUsuarios.length / itemsPerPage);
    }
    
    function goToPage(page) {
        const totalPages = getTotalPages();
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            mostrarUsuarios();
            updatePagination();
        }
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            nome: document.getElementById("nome").value.trim(),
            email: document.getElementById("email").value.trim(),
            telefone: document.getElementById("telefone").value.trim(),
            cargo: document.getElementById("cargo").value,
            foto: fotoInput.files?.[0]
        };
        
        // Validar todos os campos
        const errors = {
            nome: validateNome(formData.nome),
            email: validateEmail(formData.email),
            telefone: validateTelefone(formData.telefone),
            cargo: validateCargo(formData.cargo)
        };
        
        // Mostrar erros
        Object.keys(errors).forEach(field => {
            const errorEl = document.getElementById(`${field}Error`);
            showFieldError(errorEl, errors[field]);
        });
        
        // Se há erros, não prosseguir
        if (Object.values(errors).some(error => error)) {
            showToast('Erro', 'Por favor, corrija os erros no formulário.', 'error');
            return;
        }
        
        // Mostrar loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<iconify-icon icon="mdi:loading" class="animate-spin"></iconify-icon> Salvando...';
        submitBtn.disabled = true;
        
        // Processar foto
        if (formData.foto) {
            const reader = new FileReader();
            reader.onload = function(event) {
                saveUser({
                    ...formData,
                    foto: event.target.result
                });
                
                // Restaurar botão
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            };
            reader.onerror = function() {
                showToast('Erro', 'Erro ao processar a imagem. Tente novamente.', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            };
            reader.readAsDataURL(formData.foto);
        } else {
            saveUser({
                ...formData,
                foto: "https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
            });
            
            // Restaurar botão
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    function saveUser(userData) {
        const novoUsuario = {
            id: Date.now(),
            ...userData,
            dataCadastro: new Date().toISOString()
        };
        
        usuarios.unshift(novoUsuario);
        salvarUsuarios();
        applyFiltersAndSort();
        mostrarUsuarios();
        updatePagination();
        clearForm();
        
        showToast('Sucesso', 'Usuário cadastrado com sucesso!', 'success');
        
        // Ir para a primeira página para mostrar o novo usuário
        goToPage(1);
    }
    
    function clearForm() {
        userForm.reset();
        
        // Limpar preview da foto
        filePreview.innerHTML = `
            <iconify-icon icon="mdi:camera-plus"></iconify-icon>
            <span>Clique para adicionar foto</span>
        `;
        filePreview.classList.remove('has-image');
        
        // Limpar erros
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.opacity = '0';
            el.style.transform = 'translateY(-10px)';
        });
        
        // Resetar estilos dos campos
        document.querySelectorAll('input, select').forEach(el => {
            el.style.borderColor = '';
            el.style.boxShadow = '';
        });
    }
    
    function handleFilePreview(e) {
        const file = e.target.files[0];
        if (file) {
            // Validações de arquivo
            if (file.size > 5 * 1024 * 1024) { // 5MB
                showToast('Erro', 'Arquivo muito grande. Máximo 5MB.', 'error');
                e.target.value = '';
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                showToast('Erro', 'Por favor, selecione apenas imagens.', 'error');
                e.target.value = '';
                return;
            }
            
            // Mostrar loading
            filePreview.innerHTML = `
                <iconify-icon icon="mdi:loading" class="animate-spin"></iconify-icon>
                <span>Carregando imagem...</span>
            `;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                filePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                filePreview.classList.add('has-image');
                
                // Adicionar animação de sucesso
                filePreview.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    filePreview.style.transform = '';
                }, 200);
            };
            
            reader.onerror = function() {
                showToast('Erro', 'Erro ao carregar a imagem. Tente novamente.', 'error');
                filePreview.innerHTML = `
                    <iconify-icon icon="mdi:camera-plus"></iconify-icon>
                    <span>Clique para adicionar foto</span>
                `;
                filePreview.classList.remove('has-image');
                e.target.value = '';
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    function handleSearch(e) {
        currentSearch = e.target.value.trim();
        clearSearchBtn.classList.toggle('show', currentSearch.length > 0);
        currentPage = 1;
        applyFiltersAndSort();
        mostrarUsuarios();
        updatePagination();
    }
    
    function clearSearch() {
        searchInput.value = '';
        currentSearch = '';
        clearSearchBtn.classList.remove('show');
        currentPage = 1;
        applyFiltersAndSort();
        mostrarUsuarios();
        updatePagination();
        
        // Foco no input após limpar
        searchInput.focus();
    }
    
    function handleFilter(e) {
        currentFilter = e.target.value;
        currentPage = 1;
        applyFiltersAndSort();
        mostrarUsuarios();
        updatePagination();
    }
    
    function handleSort(e) {
        currentSort = e.target.value;
        applyFiltersAndSort();
        mostrarUsuarios();
        updatePagination();
    }
    
    function setView(view) {
        currentView = view;
        gridViewBtn.classList.toggle('active', view === 'grid');
        listViewBtn.classList.toggle('active', view === 'list');
        mostrarUsuarios();
        
        // Salvar preferência
        localStorage.setItem('viewPreference', view);
    }
    
    function handleItemsPerPageChange(e) {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        mostrarUsuarios();
        updatePagination();
        
        // Salvar preferência
        localStorage.setItem('itemsPerPagePreference', itemsPerPage);
    }
    
    function confirmRemoveUser(userId) {
        const usuario = usuarios.find(u => u.id === userId);
        if (!usuario) return;
        
        document.getElementById('modalTitle').textContent = 'Confirmar Remoção';
        document.getElementById('modalMessage').textContent = 
            `Tem certeza que deseja remover "${usuario.nome}"? Esta ação não pode ser desfeita.`;
        
        confirmModal.classList.add('show');
        
        // Armazenar o ID do usuário para remoção
        confirmModal.dataset.userId = userId;
        confirmModal.dataset.action = 'remove';
    }
    
    function handleConfirmAction() {
        const action = confirmModal.dataset.action;
        const userId = parseInt(confirmModal.dataset.userId);
        
        if (action === 'remove') {
            usuarios = usuarios.filter(u => u.id !== userId);
            salvarUsuarios();
            applyFiltersAndSort();
            mostrarUsuarios();
            updatePagination();
            
            showToast('Sucesso', 'Usuário removido com sucesso!', 'success');
        }
        
        closeConfirmModal();
    }
    
    function closeConfirmModal() {
        confirmModal.classList.remove('show');
        delete confirmModal.dataset.userId;
        delete confirmModal.dataset.action;
    }
    
    function editUser(userId) {
        const usuario = usuarios.find(u => u.id === userId);
        if (!usuario) return;
        
        // Preencher o formulário de edição
        document.getElementById('editUserId').value = usuario.id;
        document.getElementById('editNome').value = usuario.nome;
        document.getElementById('editEmail').value = usuario.email;
        document.getElementById('editTelefone').value = usuario.telefone;
        document.getElementById('editCargo').value = usuario.cargo;
        
        editModal.classList.add('show');
        
        // Foco no primeiro campo
        setTimeout(() => {
            document.getElementById('editNome').focus();
        }, 300);
    }
    
    function handleEditSave() {
        const userId = parseInt(document.getElementById('editUserId').value);
        const formData = {
            nome: document.getElementById('editNome').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            telefone: document.getElementById('editTelefone').value.trim(),
            cargo: document.getElementById('editCargo').value
        };
        
        // Validar campos
        const errors = {
            nome: validateNome(formData.nome),
            email: validateEmail(formData.email),
            telefone: validateTelefone(formData.telefone),
            cargo: validateCargo(formData.cargo)
        };
        
        if (Object.values(errors).some(error => error)) {
            showToast('Erro', 'Por favor, corrija os erros no formulário.', 'error');
            return;
        }
        
        // Mostrar loading
        const saveBtn = document.getElementById('editModalSave');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<iconify-icon icon="mdi:loading" class="animate-spin"></iconify-icon> Salvando...';
        saveBtn.disabled = true;
        
        // Atualizar usuário
        const userIndex = usuarios.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            usuarios[userIndex] = {
                ...usuarios[userIndex],
                ...formData
            };
            
            salvarUsuarios();
            applyFiltersAndSort();
            mostrarUsuarios();
            updatePagination();
            
            showToast('Sucesso', 'Usuário atualizado com sucesso!', 'success');
            closeEditModal();
        }
        
        // Restaurar botão
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
    
    function closeEditModal() {
        editModal.classList.remove('show');
    }
    
    function exportData() {
        if (filteredUsuarios.length === 0) {
            showToast('Aviso', 'Não há dados para exportar.', 'warning');
            return;
        }
        
        // Mostrar loading
        const exportBtn = document.getElementById('exportData');
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<iconify-icon icon="mdi:loading" class="animate-spin"></iconify-icon> Exportando...';
        exportBtn.disabled = true;
        
        try {
            const csvContent = [
                ['Nome', 'Email', 'Telefone', 'Cargo', 'Data de Cadastro'],
                ...filteredUsuarios.map(u => [
                    u.nome,
                    u.email,
                    u.telefone,
                    u.cargo,
                    new Date(u.dataCadastro).toLocaleDateString('pt-BR')
                ])
            ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Sucesso', 'Dados exportados com sucesso!', 'success');
        } catch (error) {
            showToast('Erro', 'Erro ao exportar dados. Tente novamente.', 'error');
        } finally {
            // Restaurar botão
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
        }
    }
    
    function showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'mdi:check-circle',
            error: 'mdi:alert-circle',
            warning: 'mdi:alert',
            info: 'mdi:information'
        };
        
        toast.innerHTML = `
            <iconify-icon icon="${icons[type] || icons.info}"></iconify-icon>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <iconify-icon icon="mdi:close"></iconify-icon>
            </button>
        `;
        
        // Event listener para fechar
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        });
        
        toastContainer.appendChild(toast);
        
        // Auto remove após 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.transform = 'translateX(100%)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        // Adicionar feedback háptico no iOS
        if (navigator.vibrate) {
            navigator.vibrate(type === 'error' ? [100, 50, 100] : 50);
        }
    }
    
    // Carregar preferências salvas
    function loadPreferences() {
        const savedView = localStorage.getItem('viewPreference');
        if (savedView) {
            setView(savedView);
        }
        
        const savedItemsPerPage = localStorage.getItem('itemsPerPagePreference');
        if (savedItemsPerPage) {
            itemsPerPage = parseInt(savedItemsPerPage);
            itemsPerPageSelect.value = itemsPerPage;
        }
    }
    
    // Carregar preferências na inicialização
    loadPreferences();
    
    // Adicionar suporte a atalhos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K para focar na busca
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Ctrl/Cmd + N para novo usuário
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            document.getElementById('nome').focus();
        }
        
        // Ctrl/Cmd + E para exportar
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportData();
        }
    });
    
    // Adicionar classe CSS para animação de loading
    const style = document.createElement('style');
    style.textContent = `
        .animate-spin {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});