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
    
    // Elementos QR
    const scanQRBtn = document.getElementById("scanQRBtn");
    const shareQRBtn = document.getElementById("shareQRBtn");
    const qrScannerModal = document.getElementById("qrScannerModal");
    const shareQRModal = document.getElementById("shareQRModal");
    
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
    
    // QR Scanner variables
    let qrScanner = null;
    let currentStream = null;
    let facingMode = 'environment';
    let flashEnabled = false;
    let isScanning = false;
    
    // Inicialização
    init();
    
    function init() {
        try {
            carregarUsuarios();
            setupEventListeners();
            updateStats();
            applyFiltersAndSort();
            mostrarUsuarios();
            updatePagination();
            loadPreferences();
            checkForImportData();
            
            // Adicionar animações de entrada com delay
            setTimeout(() => {
                document.body.classList.add('loaded');
            }, 100);
            
            // Adicionar suporte a PWA
            setupPWA();
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
            showToast('Erro', 'Erro ao inicializar o sistema. Recarregue a página.', 'error');
        }
    }
    
    function setupPWA() {
        // Service Worker registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.log('Service Worker registration failed:', err);
            });
        }
        
        // Add to home screen prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            // Show install button if needed
        });
    }
    
    function setupEventListeners() {
        try {
            // Formulário principal
            userForm?.addEventListener("submit", handleFormSubmit);
            document.getElementById("clearForm")?.addEventListener("click", clearForm);
            
            // Busca e filtros
            searchInput?.addEventListener("input", debounce(handleSearch, 300));
            clearSearchBtn?.addEventListener("click", clearSearch);
            cargoFilter?.addEventListener("change", handleFilter);
            sortBy?.addEventListener("change", handleSort);
            
            // Visualização
            gridViewBtn?.addEventListener("click", () => setView('grid'));
            listViewBtn?.addEventListener("click", () => setView('list'));
            
            // Paginação
            firstPageBtn?.addEventListener("click", () => goToPage(1));
            prevPageBtn?.addEventListener("click", () => goToPage(currentPage - 1));
            nextPageBtn?.addEventListener("click", () => goToPage(currentPage + 1));
            lastPageBtn?.addEventListener("click", () => goToPage(getTotalPages()));
            itemsPerPageSelect?.addEventListener("change", handleItemsPerPageChange);
            
            // Export
            exportBtn?.addEventListener("click", exportData);
            
            // QR Code functionality
            scanQRBtn?.addEventListener("click", openQRScanner);
            shareQRBtn?.addEventListener("click", openShareQR);
            
            // Preview de arquivo
            fotoInput?.addEventListener("change", handleFilePreview);
            
            // Modal events
            setupModalEvents();
            setupQRModalEvents();
            
            // Validação em tempo real
            setupRealTimeValidation();
            
            // Eventos de toque para iOS
            setupTouchEvents();
            
            // Keyboard shortcuts
            setupKeyboardShortcuts();
            
            // Window events
            window.addEventListener('resize', debounce(handleResize, 250));
            window.addEventListener('orientationchange', handleOrientationChange);
            
        } catch (error) {
            console.error('Erro ao configurar event listeners:', error);
        }
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function handleResize() {
        // Ajustar layout em mudanças de tamanho
        if (qrScanner && qrScannerModal.classList.contains('show')) {
            // Reajustar scanner se necessário
            qrScanner.stop();
            setTimeout(() => {
                if (qrScanner) qrScanner.start();
            }, 100);
        }
    }
    
    function handleOrientationChange() {
        // Aguardar a mudança de orientação completar
        setTimeout(() => {
            handleResize();
        }, 500);
    }
    
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K para focar na busca
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput?.focus();
            }
            
            // Ctrl/Cmd + N para novo usuário
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                document.getElementById('nome')?.focus();
            }
            
            // Ctrl/Cmd + E para exportar
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                exportData();
            }
            
            // Ctrl/Cmd + S para scanner QR
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                openQRScanner();
            }
            
            // Ctrl/Cmd + Shift + S para compartilhar QR
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                openShareQR();
            }
            
            // ESC para fechar modais
            if (e.key === 'Escape') {
                closeAllModals();
            }
        });
    }
    
    function closeAllModals() {
        closeConfirmModal();
        closeEditModal();
        closeQRScanner();
        closeShareQR();
    }
    
    function setupQRModalEvents() {
        try {
            // QR Scanner Modal
            document.getElementById("qrScannerClose")?.addEventListener("click", closeQRScanner);
            document.getElementById("toggleFlashBtn")?.addEventListener("click", toggleFlash);
            document.getElementById("switchCameraBtn")?.addEventListener("click", switchCamera);
            
            // Share QR Modal
            document.getElementById("shareQRClose")?.addEventListener("click", closeShareQR);
            document.getElementById("shareAllBtn")?.addEventListener("click", () => generateQRCode('all'));
            document.getElementById("shareFilteredBtn")?.addEventListener("click", () => generateQRCode('filtered'));
            document.getElementById("shareSelectedBtn")?.addEventListener("click", () => generateQRCode('selected'));
            document.getElementById("downloadQRBtn")?.addEventListener("click", downloadQRCode);
            document.getElementById("copyQRBtn")?.addEventListener("click", copyQRLink);
            
            // Close modals on backdrop click
            qrScannerModal?.addEventListener("click", (e) => {
                if (e.target === qrScannerModal) closeQRScanner();
            });
            
            shareQRModal?.addEventListener("click", (e) => {
                if (e.target === shareQRModal) closeShareQR();
            });
            
        } catch (error) {
            console.error('Erro ao configurar eventos QR:', error);
        }
    }
    
    async function openQRScanner() {
        try {
            // Check if camera is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showToast('Erro', 'Câmera não disponível neste dispositivo.', 'error');
                return;
            }
            
            // Check permissions
            try {
                const permission = await navigator.permissions.query({ name: 'camera' });
                if (permission.state === 'denied') {
                    showToast('Erro', 'Permissão de câmera negada. Verifique as configurações do navegador.', 'error');
                    return;
                }
            } catch (permError) {
                console.log('Permission API not supported');
            }
            
            qrScannerModal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
            
            // Show loading state
            const video = document.getElementById('qrVideo');
            const overlay = document.querySelector('.qr-overlay');
            overlay.innerHTML = `
                <div style="color: white; text-align: center;">
                    <div class="loading" style="width: 40px; height: 40px; margin: 0 auto 16px;"></div>
                    <p>Iniciando câmera...</p>
                </div>
            `;
            
            // Import QR Scanner dynamically with error handling
            let QrScanner;
            try {
                const module = await import('https://cdn.skypack.dev/qr-scanner@1.4.2');
                QrScanner = module.default;
            } catch (importError) {
                console.error('Erro ao carregar QR Scanner:', importError);
                showToast('Erro', 'Erro ao carregar o scanner. Verifique sua conexão.', 'error');
                closeQRScanner();
                return;
            }
            
            // Initialize QR Scanner with better error handling
            qrScanner = new QrScanner(video, result => {
                if (!isScanning) return;
                handleQRResult(result.data || result);
            }, {
                highlightScanRegion: true,
                highlightCodeOutline: true,
                preferredCamera: facingMode,
                maxScansPerSecond: 5,
                returnDetailedScanResult: true,
            });
            
            isScanning = true;
            await qrScanner.start();
            
            // Restore overlay after successful start
            overlay.innerHTML = `
                <div class="qr-frame">
                    <div class="qr-corner qr-corner-tl"></div>
                    <div class="qr-corner qr-corner-tr"></div>
                    <div class="qr-corner qr-corner-bl"></div>
                    <div class="qr-corner qr-corner-br"></div>
                </div>
                <div class="qr-instructions">
                    <iconify-icon icon="mdi:qrcode"></iconify-icon>
                    <p>Posicione o QR Code dentro da moldura</p>
                </div>
            `;
            
            // Update flash button visibility
            try {
                const hasFlash = await qrScanner.hasFlash();
                const flashBtn = document.getElementById('toggleFlashBtn');
                if (flashBtn) {
                    flashBtn.style.display = hasFlash ? 'flex' : 'none';
                }
            } catch (flashError) {
                console.log('Flash not available');
            }
            
            showToast('Sucesso', 'Scanner QR iniciado. Posicione o código na moldura.', 'success');
            
        } catch (error) {
            console.error('Erro ao iniciar scanner QR:', error);
            isScanning = false;
            
            let errorMessage = 'Erro ao acessar a câmera.';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Permissão de câmera negada. Permita o acesso à câmera.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Câmera está sendo usada por outro aplicativo.';
            }
            
            showToast('Erro', errorMessage, 'error');
            closeQRScanner();
        }
    }
    
    function closeQRScanner() {
        try {
            isScanning = false;
            
            if (qrScanner) {
                qrScanner.stop();
                qrScanner.destroy();
                qrScanner = null;
            }
            
            qrScannerModal.classList.remove('show');
            document.body.style.overflow = ''; // Restore scroll
            flashEnabled = false;
            
            const flashBtn = document.getElementById('toggleFlashBtn');
            if (flashBtn) {
                flashBtn.classList.remove('active');
            }
            
        } catch (error) {
            console.error('Erro ao fechar scanner:', error);
        }
    }
    
    async function toggleFlash() {
        if (!qrScanner) return;
        
        try {
            const flashBtn = document.getElementById('toggleFlashBtn');
            
            if (flashEnabled) {
                await qrScanner.turnFlashOff();
                flashEnabled = false;
                flashBtn?.classList.remove('active');
                showToast('Info', 'Flash desligado', 'info');
            } else {
                await qrScanner.turnFlashOn();
                flashEnabled = true;
                flashBtn?.classList.add('active');
                showToast('Info', 'Flash ligado', 'info');
            }
        } catch (error) {
            console.error('Erro ao controlar flash:', error);
            showToast('Erro', 'Erro ao controlar o flash.', 'error');
        }
    }
    
    async function switchCamera() {
        if (!qrScanner) return;
        
        try {
            facingMode = facingMode === 'environment' ? 'user' : 'environment';
            await qrScanner.setCamera(facingMode);
            
            const cameraName = facingMode === 'environment' ? 'traseira' : 'frontal';
            showToast('Info', `Câmera ${cameraName} ativada`, 'info');
        } catch (error) {
            console.error('Erro ao trocar câmera:', error);
            showToast('Erro', 'Erro ao trocar câmera.', 'error');
        }
    }
    
    function handleQRResult(data) {
        try {
            if (!isScanning) return;
            
            // Parse QR code data
            const qrData = JSON.parse(data);
            
            if (qrData.type === 'usuarios' && Array.isArray(qrData.data)) {
                importUsers(qrData.data);
                closeQRScanner();
            } else {
                showToast('Erro', 'QR Code não contém dados de usuários válidos.', 'error');
            }
        } catch (error) {
            console.error('Erro ao processar QR:', error);
            showToast('Erro', 'QR Code inválido ou corrompido.', 'error');
        }
    }
    
    function importUsers(importedUsers) {
        try {
            let importedCount = 0;
            let duplicateCount = 0;
            
            importedUsers.forEach(user => {
                // Check if user already exists (by email)
                const existingUser = usuarios.find(u => 
                    u.email.toLowerCase() === user.email.toLowerCase()
                );
                
                if (!existingUser) {
                    // Generate new ID and add user
                    const newUser = {
                        ...user,
                        id: Date.now() + Math.random(),
                        dataCadastro: new Date().toISOString()
                    };
                    usuarios.unshift(newUser);
                    importedCount++;
                } else {
                    duplicateCount++;
                }
            });
            
            if (importedCount > 0) {
                salvarUsuarios();
                applyFiltersAndSort();
                mostrarUsuarios();
                updatePagination();
                goToPage(1);
            }
            
            // Show result message
            let message = '';
            if (importedCount > 0) {
                message += `${importedCount} usuário(s) importado(s) com sucesso!`;
            }
            if (duplicateCount > 0) {
                message += ` ${duplicateCount} usuário(s) já existente(s) foram ignorados.`;
            }
            
            showToast('Importação', message || 'Nenhum usuário novo foi importado.', importedCount > 0 ? 'success' : 'warning');
            
        } catch (error) {
            console.error('Erro ao importar usuários:', error);
            showToast('Erro', 'Erro ao importar usuários.', 'error');
        }
    }
    
    function openShareQR() {
        try {
            shareQRModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Update button states
            const shareSelectedBtn = document.getElementById('shareSelectedBtn');
            if (shareSelectedBtn) {
                shareSelectedBtn.disabled = true; // For now, selection feature not implemented
            }
            
            // Hide QR code container initially
            const qrContainer = document.getElementById('qrCodeContainer');
            if (qrContainer) {
                qrContainer.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Erro ao abrir modal de compartilhamento:', error);
        }
    }
    
    function closeShareQR() {
        try {
            shareQRModal.classList.remove('show');
            document.body.style.overflow = '';
            
            const qrContainer = document.getElementById('qrCodeContainer');
            if (qrContainer) {
                qrContainer.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Erro ao fechar modal de compartilhamento:', error);
        }
    }
    
    async function generateQRCode(type) {
        try {
            let dataToShare = [];
            let title = '';
            
            switch (type) {
                case 'all':
                    dataToShare = usuarios;
                    title = 'Todos os Usuários';
                    break;
                case 'filtered':
                    dataToShare = filteredUsuarios;
                    title = 'Usuários Filtrados';
                    break;
                case 'selected':
                    // TODO: Implement selection functionality
                    dataToShare = [];
                    title = 'Usuários Selecionados';
                    break;
            }
            
            if (dataToShare.length === 0) {
                showToast('Aviso', 'Nenhum usuário para compartilhar.', 'warning');
                return;
            }
            
            // Show loading
            const qrContainer = document.getElementById('qrCodeContainer');
            if (qrContainer) {
                qrContainer.style.display = 'block';
                qrContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <div class="loading" style="width: 40px; height: 40px; margin: 0 auto 16px;"></div>
                        <p>Gerando QR Code...</p>
                    </div>
                `;
            }
            
            // Prepare data for QR code
            const qrData = {
                type: 'usuarios',
                title: title,
                timestamp: new Date().toISOString(),
                data: dataToShare.map(user => ({
                    nome: user.nome,
                    email: user.email,
                    telefone: user.telefone,
                    cargo: user.cargo,
                    foto: user.foto
                }))
            };
            
            // Import QRCode library dynamically
            let QRCode;
            try {
                const module = await import('https://cdn.skypack.dev/qrcode@1.5.3');
                QRCode = module.default;
            } catch (importError) {
                console.error('Erro ao carregar QRCode:', importError);
                showToast('Erro', 'Erro ao carregar gerador de QR Code.', 'error');
                return;
            }
            
            const qrString = JSON.stringify(qrData);
            
            // Create canvas element
            const canvas = document.createElement('canvas');
            canvas.id = 'qrCanvas';
            
            // Generate QR code
            await QRCode.toCanvas(canvas, qrString, {
                width: Math.min(300, window.innerWidth - 100),
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });
            
            // Update container with QR code
            if (qrContainer) {
                qrContainer.innerHTML = `
                    <div style="text-align: center;">
                        <h4 style="margin-bottom: 16px; color: var(--text-primary);">${title}</h4>
                    </div>
                    <div class="qr-actions">
                        <button id="downloadQRBtn" class="btn-primary">
                            <iconify-icon icon="mdi:download"></iconify-icon> Baixar QR Code
                        </button>
                        <button id="copyQRBtn" class="btn-secondary">
                            <iconify-icon icon="mdi:content-copy"></iconify-icon> Copiar Link
                        </button>
                    </div>
                `;
                
                // Insert canvas
                qrContainer.insertBefore(canvas, qrContainer.querySelector('.qr-actions'));
                
                // Store data for download/copy
                canvas.dataset.qrData = qrString;
                canvas.dataset.title = title;
                
                // Re-attach event listeners
                document.getElementById("downloadQRBtn")?.addEventListener("click", downloadQRCode);
                document.getElementById("copyQRBtn")?.addEventListener("click", copyQRLink);
            }
            
            showToast('Sucesso', `QR Code gerado para ${title.toLowerCase()}!`, 'success');
            
        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            showToast('Erro', 'Erro ao gerar QR Code. Tente novamente.', 'error');
        }
    }
    
    function downloadQRCode() {
        try {
            const canvas = document.getElementById('qrCanvas');
            if (!canvas) {
                showToast('Erro', 'QR Code não encontrado.', 'error');
                return;
            }
            
            const title = canvas.dataset.title || 'usuarios';
            
            // Create download link
            const link = document.createElement('a');
            link.download = `qr-code-${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Sucesso', 'QR Code baixado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao baixar QR Code:', error);
            showToast('Erro', 'Erro ao baixar QR Code.', 'error');
        }
    }
    
    async function copyQRLink() {
        try {
            const canvas = document.getElementById('qrCanvas');
            if (!canvas) {
                showToast('Erro', 'QR Code não encontrado.', 'error');
                return;
            }
            
            const qrData = canvas.dataset.qrData;
            if (!qrData) {
                showToast('Erro', 'Dados do QR Code não encontrados.', 'error');
                return;
            }
            
            // Create a shareable link (in a real app, you'd upload to a server)
            const encodedData = btoa(encodeURIComponent(qrData));
            const shareableLink = `${window.location.origin}${window.location.pathname}?import=${encodedData}`;
            
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareableLink);
            } else {
                // Fallback for older browsers or non-HTTPS
                const textArea = document.createElement('textarea');
                textArea.value = shareableLink;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            showToast('Sucesso', 'Link copiado para a área de transferência!', 'success');
            
        } catch (error) {
            console.error('Erro ao copiar link:', error);
            showToast('Erro', 'Erro ao copiar link.', 'error');
        }
    }
    
    // Check for import parameter on page load
    function checkForImportData() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const importData = urlParams.get('import');
            
            if (importData) {
                try {
                    const decodedData = decodeURIComponent(atob(importData));
                    const qrData = JSON.parse(decodedData);
                    
                    if (qrData.type === 'usuarios' && Array.isArray(qrData.data)) {
                        // Ask user if they want to import
                        if (confirm(`Deseja importar ${qrData.data.length} usuário(s) compartilhado(s)?`)) {
                            importUsers(qrData.data);
                        }
                    }
                    
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (parseError) {
                    console.error('Erro ao processar dados de importação:', parseError);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar dados de importação:', error);
        }
    }
    
    function setupTouchEvents() {
        // Adicionar feedback tátil para botões em dispositivos iOS
        const buttons = document.querySelectorAll('button, .btn-primary, .btn-secondary, .btn-danger, .btn-export, .btn-scan, .btn-share');
        
        buttons.forEach(button => {
            button.addEventListener('touchstart', function(e) {
                this.style.transform = 'scale(0.95)';
                
                // Haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            }, { passive: true });
            
            button.addEventListener('touchend', function(e) {
                setTimeout(() => {
                    this.style.transform = '';
                }, 100);
            }, { passive: true });
            
            button.addEventListener('touchcancel', function(e) {
                this.style.transform = '';
            }, { passive: true });
        });
        
        // Adicionar suporte a swipe para cards de usuário
        let startX, startY, currentX, currentY;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
            
            const diffX = startX - currentX;
            const diffY = startY - currentY;
            
            // Prevenir scroll horizontal desnecessário
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    function setupModalEvents() {
        try {
            // Confirm Modal
            document.getElementById("modalClose")?.addEventListener("click", closeConfirmModal);
            document.getElementById("modalCancel")?.addEventListener("click", closeConfirmModal);
            document.getElementById("modalConfirm")?.addEventListener("click", handleConfirmAction);
            
            // Edit Modal
            document.getElementById("editModalClose")?.addEventListener("click", closeEditModal);
            document.getElementById("editModalCancel")?.addEventListener("click", closeEditModal);
            document.getElementById("editModalSave")?.addEventListener("click", handleEditSave);
            
            // Close modal on backdrop click
            confirmModal?.addEventListener("click", (e) => {
                if (e.target === confirmModal) closeConfirmModal();
            });
            
            editModal?.addEventListener("click", (e) => {
                if (e.target === editModal) closeEditModal();
            });
            
        } catch (error) {
            console.error('Erro ao configurar eventos de modal:', error);
        }
    }
    
    function setupRealTimeValidation() {
        try {
            const inputs = [
                { id: 'nome', validator: validateNome },
                { id: 'email', validator: validateEmail },
                { id: 'telefone', validator: validateTelefone },
                { id: 'cargo', validator: validateCargo }
            ];
            
            inputs.forEach(({ id, validator }) => {
                const input = document.getElementById(id);
                const errorEl = document.getElementById(`${id}Error`);
                
                if (!input || !errorEl) return;
                
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
        } catch (error) {
            console.error('Erro ao configurar validação:', error);
        }
    }
    
    function showFieldError(errorEl, error) {
        if (!errorEl) return;
        
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
        try {
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
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            usuarios = [];
        }
    }
    
    function salvarUsuarios() {
        try {
            localStorage.setItem("usuarios", JSON.stringify(usuarios));
            updateStats();
        } catch (error) {
            console.error('Erro ao salvar usuários:', error);
            showToast('Erro', 'Erro ao salvar dados. Verifique o espaço de armazenamento.', 'error');
        }
    }
    
    function updateStats() {
        try {
            const today = new Date().toDateString();
            const newToday = usuarios.filter(u => 
                new Date(u.dataCadastro).toDateString() === today
            ).length;
            
            // Animação de contagem para os números
            animateNumber(totalUsersEl, usuarios.length);
            animateNumber(newUsersTodayEl, newToday);
            animateNumber(filteredUsersEl, filteredUsuarios.length);
        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
        }
    }
    
    function animateNumber(element, targetValue) {
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 500;
        const steps = Math.abs(targetValue - currentValue);
        
        if (steps === 0) return;
        
        const stepDuration = Math.max(duration / steps, 50);
        
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
        try {
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
        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
        }
    }
    
    function mostrarUsuarios() {
        try {
            if (!usuariosContainer) return;
            
            usuariosContainer.innerHTML = "";
            usuariosContainer.className = currentView === 'grid' ? 'usuarios-grid' : 'usuarios-list';
            
            if (filteredUsuarios.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                return;
            }
            
            if (emptyState) emptyState.style.display = 'none';
            
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginatedUsers = filteredUsuarios.slice(startIndex, startIndex + itemsPerPage);
            
            paginatedUsers.forEach((usuario, index) => {
                const div = document.createElement("div");
                div.className = `usuario-card ${currentView === 'list' ? 'list-view' : ''}`;
                div.style.animationDelay = `${index * 0.1}s`;
                
                const dataFormatada = new Date(usuario.dataCadastro).toLocaleDateString('pt-BR');
                
                div.innerHTML = `
                    <img src="${usuario.foto}" alt="Foto de ${usuario.nome}" 
                         onerror="this.src='https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'"
                         loading="lazy">
                    <div class="usuario-info">
                        <h3>${usuario.nome}</h3>
                        <p><iconify-icon icon="mdi:email"></iconify-icon> ${usuario.email}</p>
                        <p><iconify-icon icon="mdi:phone"></iconify-icon> ${usuario.telefone}</p>
                        <p><iconify-icon icon="mdi:calendar"></iconify-icon> Cadastrado em ${dataFormatada}</p>
                        <span class="cargo">${usuario.cargo}</span>
                    </div>
                    <div class="usuario-actions">
                        <button class="action-btn edit-btn" data-user-id="${usuario.id}" aria-label="Editar ${usuario.nome}">
                            <iconify-icon icon="mdi:pencil"></iconify-icon> Editar
                        </button>
                        <button class="action-btn remove-btn" data-user-id="${usuario.id}" aria-label="Remover ${usuario.nome}">
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
        } catch (error) {
            console.error('Erro ao mostrar usuários:', error);
        }
    }
    
    function updatePagination() {
        try {
            const totalPages = getTotalPages();
            
            // Atualizar botões de navegação
            if (firstPageBtn) firstPageBtn.disabled = currentPage === 1;
            if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
            if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
            if (lastPageBtn) lastPageBtn.disabled = currentPage === totalPages || totalPages === 0;
            
            // Atualizar números das páginas
            if (pageNumbers) {
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
            }
            
            // Atualizar informações da página
            if (pageInfo) {
                pageInfo.textContent = totalPages > 0 
                    ? `Página ${currentPage} de ${totalPages}` 
                    : 'Nenhum resultado';
            }
        } catch (error) {
            console.error('Erro ao atualizar paginação:', error);
        }
    }
    
    function createPageButton(pageNum) {
        if (!pageNumbers) return;
        
        const btn = document.createElement('button');
        btn.textContent = pageNum;
        btn.className = currentPage === pageNum ? 'active' : '';
        btn.setAttribute('aria-label', `Ir para página ${pageNum}`);
        btn.addEventListener('click', () => goToPage(pageNum));
        pageNumbers.appendChild(btn);
    }
    
    function createEllipsis() {
        if (!pageNumbers) return;
        
        const span = document.createElement('span');
        span.textContent = '...';
        span.style.padding = '8px';
        span.style.color = 'var(--text-secondary)';
        span.setAttribute('aria-hidden', 'true');
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
            
            // Scroll to top on mobile
            if (window.innerWidth <= 768) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = {
                nome: document.getElementById("nome")?.value.trim() || '',
                email: document.getElementById("email")?.value.trim() || '',
                telefone: document.getElementById("telefone")?.value.trim() || '',
                cargo: document.getElementById("cargo")?.value || '',
                foto: fotoInput?.files?.[0]
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
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<div class="loading" style="width: 20px; height: 20px; margin: 0 auto;"></div>';
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
        } catch (error) {
            console.error('Erro ao processar formulário:', error);
            showToast('Erro', 'Erro ao processar formulário.', 'error');
        }
    }
    
    function saveUser(userData) {
        try {
            const novoUsuario = {
                id: Date.now() + Math.random(),
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
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            showToast('Erro', 'Erro ao salvar usuário.', 'error');
        }
    }
    
    function clearForm() {
        try {
            userForm?.reset();
            
            // Limpar preview da foto
            if (filePreview) {
                filePreview.innerHTML = `
                    <iconify-icon icon="mdi:camera-plus"></iconify-icon>
                    <span>Clique para adicionar foto</span>
                `;
                filePreview.classList.remove('has-image');
            }
            
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
        } catch (error) {
            console.error('Erro ao limpar formulário:', error);
        }
    }
    
    function handleFilePreview(e) {
        try {
            const file = e.target.files[0];
            if (!file) return;
            
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
            if (filePreview) {
                filePreview.innerHTML = `
                    <div class="loading" style="width: 40px; height: 40px; margin: 0 auto 16px;"></div>
                    <span>Carregando imagem...</span>
                `;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                if (filePreview) {
                    filePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                    filePreview.classList.add('has-image');
                    
                    // Adicionar animação de sucesso
                    filePreview.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        filePreview.style.transform = '';
                    }, 200);
                }
            };
            
            reader.onerror = function() {
                showToast('Erro', 'Erro ao carregar a imagem. Tente novamente.', 'error');
                if (filePreview) {
                    filePreview.innerHTML = `
                        <iconify-icon icon="mdi:camera-plus"></iconify-icon>
                        <span>Clique para adicionar foto</span>
                    `;
                    filePreview.classList.remove('has-image');
                }
                e.target.value = '';
            };
            
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            showToast('Erro', 'Erro ao processar arquivo.', 'error');
        }
    }
    
    function handleSearch(e) {
        try {
            currentSearch = e.target.value.trim();
            if (clearSearchBtn) {
                clearSearchBtn.classList.toggle('show', currentSearch.length > 0);
            }
            currentPage = 1;
            applyFiltersAndSort();
            mostrarUsuarios();
            updatePagination();
        } catch (error) {
            console.error('Erro na busca:', error);
        }
    }
    
    function clearSearch() {
        try {
            if (searchInput) searchInput.value = '';
            currentSearch = '';
            if (clearSearchBtn) clearSearchBtn.classList.remove('show');
            currentPage = 1;
            applyFiltersAndSort();
            mostrarUsuarios();
            updatePagination();
            
            // Foco no input após limpar
            searchInput?.focus();
        } catch (error) {
            console.error('Erro ao limpar busca:', error);
        }
    }
    
    function handleFilter(e) {
        try {
            currentFilter = e.target.value;
            currentPage = 1;
            applyFiltersAndSort();
            mostrarUsuarios();
            updatePagination();
        } catch (error) {
            console.error('Erro no filtro:', error);
        }
    }
    
    function handleSort(e) {
        try {
            currentSort = e.target.value;
            applyFiltersAndSort();
            mostrarUsuarios();
            updatePagination();
        } catch (error) {
            console.error('Erro na ordenação:', error);
        }
    }
    
    function setView(view) {
        try {
            currentView = view;
            if (gridViewBtn) gridViewBtn.classList.toggle('active', view === 'grid');
            if (listViewBtn) listViewBtn.classList.toggle('active', view === 'list');
            mostrarUsuarios();
            
            // Salvar preferência
            localStorage.setItem('viewPreference', view);
        } catch (error) {
            console.error('Erro ao alterar visualização:', error);
        }
    }
    
    function handleItemsPerPageChange(e) {
        try {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            mostrarUsuarios();
            updatePagination();
            
            // Salvar preferência
            localStorage.setItem('itemsPerPagePreference', itemsPerPage);
        } catch (error) {
            console.error('Erro ao alterar itens por página:', error);
        }
    }
    
    function confirmRemoveUser(userId) {
        try {
            const usuario = usuarios.find(u => u.id === userId);
            if (!usuario) return;
            
            const modalTitle = document.getElementById('modalTitle');
            const modalMessage = document.getElementById('modalMessage');
            
            if (modalTitle) modalTitle.textContent = 'Confirmar Remoção';
            if (modalMessage) {
                modalMessage.textContent = `Tem certeza que deseja remover "${usuario.nome}"? Esta ação não pode ser desfeita.`;
            }
            
            if (confirmModal) {
                confirmModal.classList.add('show');
                document.body.style.overflow = 'hidden';
                
                // Armazenar o ID do usuário para remoção
                confirmModal.dataset.userId = userId;
                confirmModal.dataset.action = 'remove';
            }
        } catch (error) {
            console.error('Erro ao confirmar remoção:', error);
        }
    }
    
    function handleConfirmAction() {
        try {
            if (!confirmModal) return;
            
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
        } catch (error) {
            console.error('Erro ao executar ação:', error);
        }
    }
    
    function closeConfirmModal() {
        try {
            if (confirmModal) {
                confirmModal.classList.remove('show');
                document.body.style.overflow = '';
                delete confirmModal.dataset.userId;
                delete confirmModal.dataset.action;
            }
        } catch (error) {
            console.error('Erro ao fechar modal de confirmação:', error);
        }
    }
    
    function editUser(userId) {
        try {
            const usuario = usuarios.find(u => u.id === userId);
            if (!usuario) return;
            
            // Preencher o formulário de edição
            const editUserId = document.getElementById('editUserId');
            const editNome = document.getElementById('editNome');
            const editEmail = document.getElementById('editEmail');
            const editTelefone = document.getElementById('editTelefone');
            const editCargo = document.getElementById('editCargo');
            
            if (editUserId) editUserId.value = usuario.id;
            if (editNome) editNome.value = usuario.nome;
            if (editEmail) editEmail.value = usuario.email;
            if (editTelefone) editTelefone.value = usuario.telefone;
            if (editCargo) editCargo.value = usuario.cargo;
            
            if (editModal) {
                editModal.classList.add('show');
                document.body.style.overflow = 'hidden';
                
                // Foco no primeiro campo
                setTimeout(() => {
                    editNome?.focus();
                }, 300);
            }
        } catch (error) {
            console.error('Erro ao editar usuário:', error);
        }
    }
    
    function handleEditSave() {
        try {
            const editUserId = document.getElementById('editUserId');
            const editNome = document.getElementById('editNome');
            const editEmail = document.getElementById('editEmail');
            const editTelefone = document.getElementById('editTelefone');
            const editCargo = document.getElementById('editCargo');
            
            if (!editUserId || !editNome || !editEmail || !editTelefone || !editCargo) return;
            
            const userId = parseInt(editUserId.value);
            const formData = {
                nome: editNome.value.trim(),
                email: editEmail.value.trim(),
                telefone: editTelefone.value.trim(),
                cargo: editCargo.value
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
            if (saveBtn) {
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<div class="loading" style="width: 20px; height: 20px; margin: 0 auto;"></div>';
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
        } catch (error) {
            console.error('Erro ao salvar edição:', error);
            showToast('Erro', 'Erro ao salvar alterações.', 'error');
        }
    }
    
    function closeEditModal() {
        try {
            if (editModal) {
                editModal.classList.remove('show');
                document.body.style.overflow = '';
            }
        } catch (error) {
            console.error('Erro ao fechar modal de edição:', error);
        }
    }
    
    function exportData() {
        try {
            if (filteredUsuarios.length === 0) {
                showToast('Aviso', 'Não há dados para exportar.', 'warning');
                return;
            }
            
            // Mostrar loading
            if (exportBtn) {
                const originalText = exportBtn.innerHTML;
                exportBtn.innerHTML = '<div class="loading" style="width: 20px; height: 20px; margin: 0 auto;"></div>';
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
                    
                    URL.revokeObjectURL(url);
                    
                    showToast('Sucesso', 'Dados exportados com sucesso!', 'success');
                } catch (error) {
                    showToast('Erro', 'Erro ao exportar dados. Tente novamente.', 'error');
                } finally {
                    // Restaurar botão
                    exportBtn.innerHTML = originalText;
                    exportBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Erro na exportação:', error);
            showToast('Erro', 'Erro ao exportar dados.', 'error');
        }
    }
    
    function showToast(title, message, type = 'info') {
        try {
            const toastContainer = document.getElementById('toastContainer');
            if (!toastContainer) return;
            
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
                <button class="toast-close" aria-label="Fechar notificação">
                    <iconify-icon icon="mdi:close"></iconify-icon>
                </button>
            `;
            
            // Event listener para fechar
            const closeBtn = toast.querySelector('.toast-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    removeToast(toast);
                });
            }
            
            toastContainer.appendChild(toast);
            
            // Auto remove após 5 segundos
            setTimeout(() => {
                removeToast(toast);
            }, 5000);
            
            // Adicionar feedback háptico no iOS
            if (navigator.vibrate) {
                navigator.vibrate(type === 'error' ? [100, 50, 100] : 50);
            }
            
        } catch (error) {
            console.error('Erro ao mostrar toast:', error);
        }
    }
    
    function removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }
    
    // Carregar preferências salvas
    function loadPreferences() {
        try {
            const savedView = localStorage.getItem('viewPreference');
            if (savedView) {
                setView(savedView);
            }
            
            const savedItemsPerPage = localStorage.getItem('itemsPerPagePreference');
            if (savedItemsPerPage && itemsPerPageSelect) {
                itemsPerPage = parseInt(savedItemsPerPage);
                itemsPerPageSelect.value = itemsPerPage;
            }
        } catch (error) {
            console.error('Erro ao carregar preferências:', error);
        }
    }
    
    // Adicionar classe CSS para animação de loading
    const style = document.createElement('style');
    style.textContent = `
        .loading {
            border: 2px solid var(--border-color);
            border-top: 2px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            display: inline-block;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .animate-spin {
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
});