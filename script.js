// Sistema de Usuários - Versão Mobile Otimizada
document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const userForm = document.getElementById('userForm');
    const usuariosContainer = document.getElementById('usuariosContainer');
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const cargoFilter = document.getElementById('cargoFilter');
    const sortBy = document.getElementById('sortBy');
    const exportData = document.getElementById('exportData');
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');
    const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
    const scanQRBtn = document.getElementById('scanQRBtn');
    const shareQRBtn = document.getElementById('shareQRBtn');
    const qrScannerModal = document.getElementById('qrScannerModal');
    const shareQRModal = document.getElementById('shareQRModal');
    
    // Botões de paginação
    const firstPage = document.getElementById('firstPage');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const lastPage = document.getElementById('lastPage');
    const pageNumbers = document.getElementById('pageNumbers');
    const pageInfo = document.getElementById('pageInfo');
    
    // Estatísticas
    const totalUsers = document.getElementById('totalUsers');
    const newUsersToday = document.getElementById('newUsersToday');
    const filteredUsers = document.getElementById('filteredUsers');
    
    // Modais
    const confirmModal = document.getElementById('confirmModal');
    const editModal = document.getElementById('editModal');
    const emptyState = document.getElementById('emptyState');
    
    // Input de foto
    const fotoInput = document.getElementById('foto');
    const filePreview = document.getElementById('filePreview');
    
    // Variáveis globais
    let usuarios = [];
    let usuariosFiltrados = [];
    let paginaAtual = 1;
    let itensPorPagina = 4;
    let tipoVisualizacao = 'grid';
    let ordenacao = 'nome';
    let termoBusca = '';
    let filtrocargo = '';
    let qrScanner = null;
    let cameraMode = 'environment';
    let flashOn = false;
    let scannerActive = false;
    let usuariosSelecionados = new Set();
    let qrCodeCache = new Map();

    // Inicialização
    init();

    function init() {
        try {
            carregarUsuarios();
            configurarEventListeners();
            configurarValidacao();
            aplicarFiltros();
            mostrarUsuarios();
            atualizarPaginacao();
            configurarQREvents();
            atualizarEstatisticas();
            
            // Animação de entrada
            setTimeout(() => {
                document.body.classList.add('loaded');
            }, 100);
            
            // Service Worker
            registerServiceWorker();
        } catch (error) {
            console.error('Erro na inicialização:', error);
            showToast('Erro', 'Erro ao inicializar o sistema. Recarregue a página.', 'error');
        }
    }

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }

        // PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
        });
    }

    function configurarEventListeners() {
        try {
            // Formulário
            userForm?.addEventListener('submit', handleFormSubmit);
            document.getElementById('clearForm')?.addEventListener('click', limparFormulario);
            
            // Busca
            searchInput?.addEventListener('input', debounce(handleSearch, 300));
            clearSearch?.addEventListener('click', limparBusca);
            
            // Filtros
            cargoFilter?.addEventListener('change', handleCargoFilter);
            sortBy?.addEventListener('change', handleSort);
            
            // Visualização
            gridView?.addEventListener('click', () => alterarVisualizacao('grid'));
            listView?.addEventListener('click', () => alterarVisualizacao('list'));
            
            // Paginação
            firstPage?.addEventListener('click', () => irParaPagina(1));
            prevPage?.addEventListener('click', () => irParaPagina(paginaAtual - 1));
            nextPage?.addEventListener('click', () => irParaPagina(paginaAtual + 1));
            lastPage?.addEventListener('click', () => irParaPagina(getTotalPaginas()));
            itemsPerPageSelect?.addEventListener('change', handleItemsPerPageChange);
            
            // Exportar
            exportData?.addEventListener('click', exportarDados);
            
            // QR Code
            scanQRBtn?.addEventListener('click', abrirScannerQR);
            shareQRBtn?.addEventListener('click', abrirCompartilhamentoQR);
            
            // Foto
            fotoInput?.addEventListener('change', handleFileChange);
            
            // Eventos globais
            setupGlobalEvents();
            setupModalEvents();
            setupQREvents();
            setupKeyboardShortcuts();
            setupTouchEvents();
            
            // Responsividade
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
        if (qrScanner && qrScannerModal.classList.contains('show')) {
            qrScanner.stop();
            setTimeout(() => {
                if (qrScanner) qrScanner.start();
            }, 100);
        }
    }

    function handleOrientationChange() {
        setTimeout(() => {
            handleResize();
        }, 500);
    }

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K - Focar busca
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput?.focus();
            }
            
            // Ctrl/Cmd + N - Focar nome
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                document.getElementById('nome')?.focus();
            }
            
            // Ctrl/Cmd + E - Exportar
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                exportarDados();
            }
            
            // Ctrl/Cmd + S - Scanner QR
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                abrirScannerQR();
            }
            
            // Ctrl/Cmd + Shift + S - Compartilhar QR
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                abrirCompartilhamentoQR();
            }
            
            // ESC - Fechar modais
            if (e.key === 'Escape') {
                fecharTodosModais();
            }
        });
    }

    function fecharTodosModais() {
        fecharModalConfirmacao();
        fecharModalEdicao();
        fecharScannerQR();
        fecharCompartilhamentoQR();
    }

    function setupQREvents() {
        try {
            // Scanner QR
            document.getElementById('qrScannerClose')?.addEventListener('click', fecharScannerQR);
            document.getElementById('toggleFlashBtn')?.addEventListener('click', toggleFlash);
            document.getElementById('switchCameraBtn')?.addEventListener('click', switchCamera);
            
            // Compartilhamento QR
            document.getElementById('shareQRClose')?.addEventListener('click', fecharCompartilhamentoQR);
            document.getElementById('shareAllBtn')?.addEventListener('click', () => gerarQRCode('all'));
            document.getElementById('shareFilteredBtn')?.addEventListener('click', () => gerarQRCode('filtered'));
            document.getElementById('shareSelectedBtn')?.addEventListener('click', () => gerarQRCode('selected'));
            document.getElementById('downloadQRBtn')?.addEventListener('click', baixarQRCode);
            document.getElementById('copyQRBtn')?.addEventListener('click', copiarLinkQR);
            
            // Fechar modal clicando fora
            qrScannerModal?.addEventListener('click', (e) => {
                if (e.target === qrScannerModal) fecharScannerQR();
            });
            
            shareQRModal?.addEventListener('click', (e) => {
                if (e.target === shareQRModal) fecharCompartilhamentoQR();
            });
        } catch (error) {
            console.error('Erro ao configurar eventos QR:', error);
        }
    }

    // Scanner QR
    async function abrirScannerQR() {
        try {
            // Verificar suporte à câmera
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showToast('Erro', 'Câmera não disponível neste dispositivo.', 'error');
                return;
            }

            // Verificar permissões
            try {
                const permission = await navigator.permissions.query({ name: 'camera' });
                if (permission.state === 'denied') {
                    showToast('Erro', 'Permissão de câmera negada. Verifique as configurações do navegador.', 'error');
                    return;
                }
            } catch {
                console.log('Permission API not supported');
            }

            // Abrir modal
            qrScannerModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Posicionar modal no topo para mobile
            if (window.innerWidth <= 768) {
                qrScannerModal.style.alignItems = 'flex-start';
                qrScannerModal.style.paddingTop = '20px';
            }

            const video = document.getElementById('qrVideo');
            const overlay = document.querySelector('.qr-overlay');
            
            // Loading state
            overlay.innerHTML = `
                <div style="color: white; text-align: center;">
                    <div class="loading" style="width: 40px; height: 40px; margin: 0 auto 16px;"></div>
                    <p>Iniciando câmera...</p>
                </div>
            `;

            // Carregar QR Scanner dinamicamente
            let QrScanner;
            try {
                QrScanner = (await import('https://cdn.skypack.dev/qr-scanner@1.4.2')).default;
            } catch (error) {
                console.error('Erro ao carregar QR Scanner:', error);
                showToast('Erro', 'Erro ao carregar o scanner. Verifique sua conexão.', 'error');
                fecharScannerQR();
                return;
            }

            // Criar scanner
            qrScanner = new QrScanner(video, (result) => {
                if (scannerActive) {
                    processarQRCode(result.data || result);
                }
            }, {
                highlightScanRegion: true,
                highlightCodeOutline: true,
                preferredCamera: cameraMode,
                maxScansPerSecond: 5,
                returnDetailedScanResult: true
            });

            scannerActive = true;
            await qrScanner.start();

            // UI do scanner
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

            // Verificar flash
            try {
                const hasFlash = await qrScanner.hasFlash();
                const flashBtn = document.getElementById('toggleFlashBtn');
                if (flashBtn) {
                    flashBtn.style.display = hasFlash ? 'flex' : 'none';
                }
            } catch {
                console.log('Flash not available');
            }

            showToast('Sucesso', 'Scanner QR iniciado. Posicione o código na moldura.', 'success');

        } catch (error) {
            console.error('Erro ao iniciar scanner QR:', error);
            scannerActive = false;
            
            let message = 'Erro ao acessar a câmera.';
            if (error.name === 'NotAllowedError') {
                message = 'Permissão de câmera negada. Permita o acesso à câmera.';
            } else if (error.name === 'NotFoundError') {
                message = 'Nenhuma câmera encontrada no dispositivo.';
            } else if (error.name === 'NotReadableError') {
                message = 'Câmera está sendo usada por outro aplicativo.';
            }
            
            showToast('Erro', message, 'error');
            fecharScannerQR();
        }
    }

    function fecharScannerQR() {
        try {
            scannerActive = false;
            
            if (qrScanner) {
                qrScanner.stop();
                qrScanner.destroy();
                qrScanner = null;
            }
            
            qrScannerModal.classList.remove('show');
            document.body.style.overflow = '';
            qrScannerModal.style.alignItems = '';
            qrScannerModal.style.paddingTop = '';
            flashOn = false;
            
            const flashBtn = document.getElementById('toggleFlashBtn');
            if (flashBtn) flashBtn.classList.remove('active');
        } catch (error) {
            console.error('Erro ao fechar scanner:', error);
        }
    }

    async function toggleFlash() {
        if (!qrScanner) return;
        
        try {
            const flashBtn = document.getElementById('toggleFlashBtn');
            
            if (flashOn) {
                await qrScanner.turnFlashOff();
                flashOn = false;
                flashBtn?.classList.remove('active');
                showToast('Info', 'Flash desligado', 'info');
            } else {
                await qrScanner.turnFlashOn();
                flashOn = true;
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
            cameraMode = cameraMode === 'environment' ? 'user' : 'environment';
            await qrScanner.setCamera(cameraMode);
            showToast('Info', `Câmera ${cameraMode === 'environment' ? 'traseira' : 'frontal'} ativada`, 'info');
        } catch (error) {
            console.error('Erro ao trocar câmera:', error);
            showToast('Erro', 'Erro ao trocar câmera.', 'error');
        }
    }

    function processarQRCode(data) {
        try {
            if (!scannerActive) return;
            
            const qrData = JSON.parse(data);
            if (qrData.type === 'usuarios' && Array.isArray(qrData.data)) {
                importarUsuarios(qrData.data);
                fecharScannerQR();
            } else {
                showToast('Erro', 'QR Code não contém dados de usuários válidos.', 'error');
            }
        } catch (error) {
            console.error('Erro ao processar QR:', error);
            showToast('Erro', 'QR Code inválido ou corrompido.', 'error');
        }
    }

    function importarUsuarios(dadosUsuarios) {
        try {
            let novosUsuarios = 0;
            let usuariosExistentes = 0;
            
            dadosUsuarios.forEach(userData => {
                const usuarioExistente = usuarios.find(u => 
                    u.email.toLowerCase() === userData.email.toLowerCase()
                );
                
                if (usuarioExistente) {
                    usuariosExistentes++;
                } else {
                    const novoUsuario = {
                        ...userData,
                        id: Date.now() + Math.random(),
                        dataCadastro: new Date().toISOString()
                    };
                    usuarios.unshift(novoUsuario);
                    novosUsuarios++;
                }
            });
            
            if (novosUsuarios > 0) {
                salvarUsuarios();
                aplicarFiltros();
                mostrarUsuarios();
                atualizarPaginacao();
                irParaPagina(1);
            }
            
            let message = '';
            if (novosUsuarios > 0) {
                message += `${novosUsuarios} usuário(s) importado(s) com sucesso!`;
            }
            if (usuariosExistentes > 0) {
                message += ` ${usuariosExistentes} usuário(s) já existente(s) foram ignorados.`;
            }
            
            showToast('Importação', message || 'Nenhum usuário novo foi importado.', 
                     novosUsuarios > 0 ? 'success' : 'warning');
        } catch (error) {
            console.error('Erro ao importar usuários:', error);
            showToast('Erro', 'Erro ao importar usuários.', 'error');
        }
    }

    // Compartilhamento QR
    function abrirCompartilhamentoQR() {
        try {
            shareQRModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Posicionar modal no topo para mobile
            if (window.innerWidth <= 768) {
                shareQRModal.style.alignItems = 'flex-start';
                shareQRModal.style.paddingTop = '20px';
            }
            
            // Atualizar botão de selecionados
            const shareSelectedBtn = document.getElementById('shareSelectedBtn');
            if (shareSelectedBtn) {
                shareSelectedBtn.disabled = usuariosSelecionados.size === 0;
            }
            
            // Limpar QR anterior
            const qrContainer = document.getElementById('qrCodeContainer');
            if (qrContainer) {
                qrContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao abrir modal de compartilhamento:', error);
        }
    }

    function fecharCompartilhamentoQR() {
        try {
            shareQRModal.classList.remove('show');
            document.body.style.overflow = '';
            shareQRModal.style.alignItems = '';
            shareQRModal.style.paddingTop = '';
            
            // Limpar QR
            const qrContainer = document.getElementById('qrCodeContainer');
            if (qrContainer) {
                qrContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao fechar modal de compartilhamento:', error);
        }
    }

    async function gerarQRCode(tipo) {
        try {
            let dadosParaCompartilhar = [];
            let titulo = '';
            
            switch (tipo) {
                case 'all':
                    dadosParaCompartilhar = usuarios;
                    titulo = 'Todos os Usuários';
                    break;
                case 'filtered':
                    dadosParaCompartilhar = usuariosFiltrados;
                    titulo = 'Usuários Filtrados';
                    break;
                case 'selected':
                    dadosParaCompartilhar = usuarios.filter(u => usuariosSelecionados.has(u.id));
                    titulo = 'Usuários Selecionados';
                    break;
            }
            
            if (dadosParaCompartilhar.length === 0) {
                showToast('Aviso', 'Nenhum usuário para compartilhar.', 'warning');
                return;
            }
            
            const qrContainer = document.getElementById('qrCodeContainer');
            if (!qrContainer) return;
            
            qrContainer.style.display = 'block';
            
            // Verificar cache
            const cacheKey = `${tipo}-${dadosParaCompartilhar.length}-${Date.now()}`;
            
            // Loading state
            qrContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div class="loading" style="width: 40px; height: 40px; margin: 0 auto 16px;"></div>
                    <p>Gerando QR Code...</p>
                </div>
            `;
            
            const qrData = {
                type: 'usuarios',
                title: titulo,
                timestamp: new Date().toISOString(),
                data: dadosParaCompartilhar.map(user => ({
                    nome: user.nome,
                    email: user.email,
                    telefone: user.telefone,
                    cargo: user.cargo,
                    foto: user.foto
                }))
            };
            
            // Carregar QRCode dinamicamente
            let QRCode;
            try {
                QRCode = (await import('https://cdn.skypack.dev/qrcode@1.5.3')).default;
            } catch (error) {
                console.error('Erro ao carregar QRCode:', error);
                showToast('Erro', 'Erro ao carregar gerador de QR Code.', 'error');
                return;
            }
            
            const qrString = JSON.stringify(qrData);
            const canvas = document.createElement('canvas');
            canvas.id = 'qrCanvas';
            
            await QRCode.toCanvas(canvas, qrString, {
                width: Math.min(300, window.innerWidth - 100),
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });
            
            // Atualizar UI
            qrContainer.innerHTML = `
                <div style="text-align: center;">
                    <h4 style="margin-bottom: 16px; color: var(--text-primary);">${titulo}</h4>
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
            
            qrContainer.insertBefore(canvas, qrContainer.querySelector('.qr-actions'));
            
            // Armazenar dados no canvas
            canvas.dataset.qrData = qrString;
            canvas.dataset.title = titulo;
            
            // Reconfigurar eventos
            document.getElementById('downloadQRBtn')?.addEventListener('click', baixarQRCode);
            document.getElementById('copyQRBtn')?.addEventListener('click', copiarLinkQR);
            
            showToast('Sucesso', `QR Code gerado para ${titulo.toLowerCase()}!`, 'success');
            
        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            showToast('Erro', 'Erro ao gerar QR Code. Tente novamente.', 'error');
        }
    }

    function baixarQRCode() {
        try {
            const canvas = document.getElementById('qrCanvas');
            if (!canvas) {
                showToast('Erro', 'QR Code não encontrado.', 'error');
                return;
            }
            
            const titulo = canvas.dataset.title || 'usuarios';
            const link = document.createElement('a');
            link.download = `qr-code-${titulo.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Sucesso', 'QR Code baixado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao baixar QR Code:', error);
            showToast('Erro', 'Erro ao baixar QR Code.', 'error');
        }
    }

    async function copiarLinkQR() {
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
            
            const encodedData = btoa(encodeURIComponent(qrData));
            const shareUrl = `${window.location.origin}${window.location.pathname}?import=${encodedData}`;
            
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareUrl);
            } else {
                // Fallback para dispositivos sem clipboard API
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
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

    // Verificar dados de importação na URL
    function verificarDadosImportacao() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const importData = urlParams.get('import');
            
            if (importData) {
                try {
                    const decodedData = decodeURIComponent(atob(importData));
                    const qrData = JSON.parse(decodedData);
                    
                    if (qrData.type === 'usuarios' && Array.isArray(qrData.data)) {
                        if (confirm(`Deseja importar ${qrData.data.length} usuário(s) compartilhado(s)?`)) {
                            importarUsuarios(qrData.data);
                        }
                    }
                    
                    // Limpar URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (error) {
                    console.error('Erro ao processar dados de importação:', error);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar dados de importação:', error);
        }
    }

    // Seleção de usuários
    function toggleUsuarioSelecionado(userId) {
        if (usuariosSelecionados.has(userId)) {
            usuariosSelecionados.delete(userId);
        } else {
            usuariosSelecionados.add(userId);
        }
        
        // Atualizar UI
        atualizarBotaoSelecionados();
        atualizarVisualizacaoSelecao();
    }

    function atualizarBotaoSelecionados() {
        const shareSelectedBtn = document.getElementById('shareSelectedBtn');
        if (shareSelectedBtn) {
            shareSelectedBtn.disabled = usuariosSelecionados.size === 0;
            shareSelectedBtn.innerHTML = `
                <iconify-icon icon="mdi:check-circle"></iconify-icon>
                <span>Compartilhar Selecionados (${usuariosSelecionados.size})</span>
            `;
        }
    }

    function atualizarVisualizacaoSelecao() {
        document.querySelectorAll('.usuario-card').forEach(card => {
            const userId = parseInt(card.dataset.userId);
            if (usuariosSelecionados.has(userId)) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    function setupTouchEvents() {
        // Melhorar feedback tátil em dispositivos móveis
        document.querySelectorAll('button, .btn-primary, .btn-secondary, .btn-danger, .btn-export, .btn-scan, .btn-share').forEach(button => {
            button.addEventListener('touchstart', function(e) {
                this.style.transform = 'scale(0.95)';
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

        // Gestos de swipe
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
            
            // Prevenir scroll horizontal em swipes
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    function setupModalEvents() {
        try {
            // Modal de confirmação
            document.getElementById('modalClose')?.addEventListener('click', fecharModalConfirmacao);
            document.getElementById('modalCancel')?.addEventListener('click', fecharModalConfirmacao);
            document.getElementById('modalConfirm')?.addEventListener('click', confirmarAcao);
            
            // Modal de edição
            document.getElementById('editModalClose')?.addEventListener('click', fecharModalEdicao);
            document.getElementById('editModalCancel')?.addEventListener('click', fecharModalEdicao);
            document.getElementById('editModalSave')?.addEventListener('click', salvarEdicao);
            
            // Fechar modal clicando fora
            confirmModal?.addEventListener('click', (e) => {
                if (e.target === confirmModal) fecharModalConfirmacao();
            });
            
            editModal?.addEventListener('click', (e) => {
                if (e.target === editModal) fecharModalEdicao();
            });
        } catch (error) {
            console.error('Erro ao configurar eventos de modal:', error);
        }
    }

    function configurarValidacao() {
        try {
            const campos = [
                { id: 'nome', validator: validarNome },
                { id: 'email', validator: validarEmail },
                { id: 'telefone', validator: validarTelefone },
                { id: 'cargo', validator: validarCargo }
            ];

            campos.forEach(({ id, validator }) => {
                const input = document.getElementById(id);
                const errorElement = document.getElementById(`${id}Error`);
                
                if (!input || !errorElement) return;

                input.addEventListener('blur', () => {
                    const error = validator(input.value.trim());
                    mostrarErro(errorElement, error);
                    
                    if (error) {
                        input.style.borderColor = 'var(--danger-color)';
                        input.style.boxShadow = '0 0 0 4px rgba(255, 59, 48, 0.1)';
                    } else if (input.value.trim()) {
                        input.style.borderColor = 'var(--success-color)';
                        input.style.boxShadow = '0 0 0 4px rgba(52, 199, 89, 0.1)';
                    }
                });

                input.addEventListener('input', () => {
                    if (errorElement.textContent) {
                        const error = validator(input.value.trim());
                        mostrarErro(errorElement, error);
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

    function mostrarErro(element, message) {
        if (!element) return;
        
        element.textContent = message || '';
        
        if (message) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        } else {
            element.style.opacity = '0';
            element.style.transform = 'translateY(-10px)';
        }
    }

    function validarNome(nome) {
        if (!nome) return 'Nome é obrigatório';
        if (nome.length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        if (nome.length > 100) return 'Nome deve ter no máximo 100 caracteres';
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(nome)) return 'Nome deve conter apenas letras e espaços';
        return '';
    }

    function validarEmail(email) {
        if (!email) return 'Email é obrigatório';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido';
        if (email.length > 255) return 'Email muito longo';
        
        const usuarioExistente = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
        const editUserId = document.getElementById('editUserId')?.value;
        
        if (usuarioExistente && usuarioExistente.id != editUserId) {
            return 'Este email já está cadastrado';
        }
        
        return '';
    }

    function validarTelefone(telefone) {
        if (!telefone) return 'Telefone é obrigatório';
        if (!/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(telefone)) {
            return 'Formato inválido. Use: (11) 99999-9999';
        }
        return '';
    }

    function validarCargo(cargo) {
        if (!cargo) return 'Cargo é obrigatório';
        return '';
    }

    // Gerenciamento de usuários
    function carregarUsuarios() {
        try {
            const dadosSalvos = localStorage.getItem('usuarios');
            if (dadosSalvos) {
                usuarios = JSON.parse(dadosSalvos);
            } else {
                // Dados iniciais com 50 usuários
                usuarios = gerarUsuariosIniciais();
                salvarUsuarios();
            }
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            usuarios = [];
        }
    }

    function gerarUsuariosIniciais() {
        const nomes = [
            'Ana Silva Santos', 'Carlos Eduardo Lima', 'Mariana Costa Oliveira', 'João Pedro Almeida',
            'Fernanda Rodrigues', 'Rafael Santos Silva', 'Juliana Pereira Costa', 'Bruno Henrique Souza',
            'Camila Ferreira Lima', 'Diego Martins Rocha', 'Larissa Oliveira Santos', 'Thiago Alves Pereira',
            'Gabriela Costa Ferreira', 'Lucas Henrique Silva', 'Amanda Rodrigues Lima', 'Felipe Santos Oliveira',
            'Natália Pereira Costa', 'Rodrigo Lima Santos', 'Isabela Ferreira Alves', 'Gustavo Oliveira Silva',
            'Priscila Santos Lima', 'Matheus Costa Pereira', 'Vanessa Rodrigues Santos', 'André Silva Oliveira',
            'Carolina Pereira Lima', 'Daniel Santos Costa', 'Letícia Oliveira Ferreira', 'Ricardo Lima Silva',
            'Patrícia Costa Santos', 'Marcelo Pereira Oliveira', 'Renata Silva Lima', 'Fábio Santos Costa',
            'Tatiana Oliveira Pereira', 'Vinícius Lima Santos', 'Cristina Costa Silva', 'Eduardo Pereira Lima',
            'Mônica Santos Oliveira', 'Alexandre Lima Costa', 'Débora Silva Pereira', 'Leandro Santos Lima',
            'Adriana Costa Oliveira', 'Robson Pereira Santos', 'Simone Lima Silva', 'Márcio Santos Costa',
            'Eliane Oliveira Lima', 'Sérgio Costa Santos', 'Cláudia Pereira Silva', 'Antônio Lima Oliveira',
            'Rosana Santos Costa', 'Paulo Silva Lima', 'Márcia Oliveira Santos', 'José Costa Pereira'
        ];

        const cargos = ['Desenvolvedor', 'Designer', 'Gerente', 'Analista', 'Coordenador', 'Diretor', 'Estagiário'];
        const fotos = [
            'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            'https://images.pexels.com/photos/1758144/pexels-photo-1758144.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        ];

        return nomes.map((nome, index) => ({
            id: index + 1,
            nome,
            email: `${nome.toLowerCase().replace(/\s+/g, '.')}@empresa.com`,
            telefone: `(${10 + Math.floor(Math.random() * 90)}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
            cargo: cargos[Math.floor(Math.random() * cargos.length)],
            foto: fotos[Math.floor(Math.random() * fotos.length)],
            dataCadastro: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }));
    }

    function salvarUsuarios() {
        try {
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            atualizarEstatisticas();
        } catch (error) {
            console.error('Erro ao salvar usuários:', error);
            showToast('Erro', 'Erro ao salvar dados. Verifique o espaço de armazenamento.', 'error');
        }
    }

    function atualizarEstatisticas() {
        try {
            const hoje = new Date().toDateString();
            const novosHoje = usuarios.filter(u => 
                new Date(u.dataCadastro).toDateString() === hoje
            ).length;

            animarNumero(totalUsers, usuarios.length);
            animarNumero(newUsersToday, novosHoje);
            animarNumero(filteredUsers, usuariosFiltrados.length);
        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
        }
    }

    function animarNumero(element, targetValue) {
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 500;
        const steps = Math.abs(targetValue - currentValue);
        
        if (steps === 0) return;
        
        const stepTime = Math.max(duration / steps, 50);
        let current = currentValue;
        
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            if (current === targetValue) {
                clearInterval(timer);
            }
        }, stepTime);
    }

    function aplicarFiltros() {
        try {
            let usuariosFiltradosTemp = [...usuarios];

            // Filtro de busca
            if (termoBusca) {
                usuariosFiltradosTemp = usuariosFiltradosTemp.filter(usuario =>
                    usuario.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
                    usuario.email.toLowerCase().includes(termoBusca.toLowerCase()) ||
                    usuario.cargo.toLowerCase().includes(termoBusca.toLowerCase())
                );
            }

            // Filtro de cargo
            if (filtroargo) {
                usuariosFiltradosTemp = usuariosFiltradosTemp.filter(usuario =>
                    usuario.cargo === filtroargo
                );
            }

            // Ordenação
            usuariosFiltradosTemp.sort((a, b) => {
                switch (ordenacao) {
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

            usuariosFiltrados = usuariosFiltradosTemp;
            atualizarEstatisticas();

            // Ajustar página atual se necessário
            const totalPaginas = getTotalPaginas();
            if (paginaAtual > totalPaginas && totalPaginas > 0) {
                paginaAtual = totalPaginas;
            } else if (paginaAtual < 1) {
                paginaAtual = 1;
            }
        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
        }
    }

    function mostrarUsuarios() {
        try {
            if (!usuariosContainer) return;

            usuariosContainer.innerHTML = '';
            usuariosContainer.className = tipoVisualizacao === 'grid' ? 'usuarios-grid' : 'usuarios-list';

            if (usuariosFiltrados.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            if (emptyState) emptyState.style.display = 'none';

            const inicio = (paginaAtual - 1) * itensPorPagina;
            const usuariosPagina = usuariosFiltrados.slice(inicio, inicio + itensPorPagina);

            usuariosPagina.forEach((usuario, index) => {
                const usuarioCard = document.createElement('div');
                usuarioCard.className = `usuario-card ${tipoVisualizacao === 'list' ? 'list-view' : ''}`;
                usuarioCard.style.animationDelay = `${index * 0.1}s`;
                usuarioCard.dataset.userId = usuario.id;

                const dataCadastro = new Date(usuario.dataCadastro).toLocaleDateString('pt-BR');
                const isSelected = usuariosSelecionados.has(usuario.id);

                usuarioCard.innerHTML = `
                    <div class="usuario-checkbox">
                        <input type="checkbox" id="user-${usuario.id}" ${isSelected ? 'checked' : ''} 
                               onchange="toggleUsuarioSelecionado(${usuario.id})">
                        <label for="user-${usuario.id}"></label>
                    </div>
                    <img src="${usuario.foto}" alt="Foto de ${usuario.nome}" 
                         onerror="this.src='https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'"
                         loading="lazy">
                    <div class="usuario-info">
                        <h3>${usuario.nome}</h3>
                        <p><iconify-icon icon="mdi:email"></iconify-icon> ${usuario.email}</p>
                        <p><iconify-icon icon="mdi:phone"></iconify-icon> ${usuario.telefone}</p>
                        <p><iconify-icon icon="mdi:calendar"></iconify-icon> Cadastrado em ${dataCadastro}</p>
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

                if (isSelected) {
                    usuarioCard.classList.add('selected');
                }

                usuariosContainer.appendChild(usuarioCard);
            });

            // Configurar eventos dos botões
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = parseInt(e.currentTarget.dataset.userId);
                    editarUsuario(userId);
                });
            });

            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = parseInt(e.currentTarget.dataset.userId);
                    confirmarRemocao(userId);
                });
            });

            // Tornar função global para o checkbox
            window.toggleUsuarioSelecionado = toggleUsuarioSelecionado;

        } catch (error) {
            console.error('Erro ao mostrar usuários:', error);
        }
    }

    function atualizarPaginacao() {
        try {
            const totalPaginas = getTotalPaginas();

            // Atualizar estado dos botões
            if (firstPage) firstPage.disabled = paginaAtual === 1;
            if (prevPage) prevPage.disabled = paginaAtual === 1;
            if (nextPage) nextPage.disabled = paginaAtual === totalPaginas || totalPaginas === 0;
            if (lastPage) lastPage.disabled = paginaAtual === totalPaginas || totalPaginas === 0;

            // Atualizar números das páginas
            if (pageNumbers) {
                pageNumbers.innerHTML = '';

                if (totalPaginas <= 7) {
                    // Mostrar todas as páginas
                    for (let i = 1; i <= totalPaginas; i++) {
                        criarBotaoPagina(i);
                    }
                } else {
                    // Mostrar páginas com reticências
                    criarBotaoPagina(1);

                    if (paginaAtual > 4) {
                        criarReticencias();
                    }

                    const inicio = Math.max(2, paginaAtual - 2);
                    const fim = Math.min(totalPaginas - 1, paginaAtual + 2);

                    for (let i = inicio; i <= fim; i++) {
                        criarBotaoPagina(i);
                    }

                    if (paginaAtual < totalPaginas - 3) {
                        criarReticencias();
                    }

                    if (totalPaginas > 1) {
                        criarBotaoPagina(totalPaginas);
                    }
                }
            }

            // Atualizar informações da página
            if (pageInfo) {
                pageInfo.textContent = totalPaginas > 0 ? 
                    `Página ${paginaAtual} de ${totalPaginas}` : 
                    'Nenhum resultado';
            }
        } catch (error) {
            console.error('Erro ao atualizar paginação:', error);
        }
    }

    function criarBotaoPagina(numeroPagina) {
        if (!pageNumbers) return;

        const botao = document.createElement('button');
        botao.textContent = numeroPagina;
        botao.className = paginaAtual === numeroPagina ? 'active' : '';
        botao.setAttribute('aria-label', `Ir para página ${numeroPagina}`);
        botao.addEventListener('click', () => irParaPagina(numeroPagina));
        pageNumbers.appendChild(botao);
    }

    function criarReticencias() {
        if (!pageNumbers) return;

        const reticencias = document.createElement('span');
        reticencias.textContent = '...';
        reticencias.style.padding = '8px';
        reticencias.style.color = 'var(--text-secondary)';
        reticencias.setAttribute('aria-hidden', 'true');
        pageNumbers.appendChild(reticencias);
    }

    function getTotalPaginas() {
        return Math.ceil(usuariosFiltrados.length / itensPorPagina);
    }

    function irParaPagina(pagina) {
        const totalPaginas = getTotalPaginas();
        if (pagina >= 1 && pagina <= totalPaginas) {
            paginaAtual = pagina;
            mostrarUsuarios();
            atualizarPaginacao();
            
            // Scroll para o topo em mobile
            if (window.innerWidth <= 768) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }

    // Event Handlers
    function handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = {
                nome: document.getElementById('nome')?.value.trim() || '',
                email: document.getElementById('email')?.value.trim() || '',
                telefone: document.getElementById('telefone')?.value.trim() || '',
                cargo: document.getElementById('cargo')?.value || '',
                foto: fotoInput?.files?.[0]
            };

            // Validar dados
            const erros = {
                nome: validarNome(formData.nome),
                email: validarEmail(formData.email),
                telefone: validarTelefone(formData.telefone),
                cargo: validarCargo(formData.cargo)
            };

            // Mostrar erros
            Object.keys(erros).forEach(campo => {
                const errorElement = document.getElementById(`${campo}Error`);
                mostrarErro(errorElement, erros[campo]);
            });

            // Verificar se há erros
            if (Object.values(erros).some(erro => erro)) {
                showToast('Erro', 'Por favor, corrija os erros no formulário.', 'error');
                return;
            }

            // Processar formulário
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<div class="loading" style="width: 20px; height: 20px; margin: 0 auto;"></div>';
                submitBtn.disabled = true;

                if (formData.foto) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        salvarUsuario({ ...formData, foto: event.target.result });
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
                    salvarUsuario({ 
                        ...formData, 
                        foto: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop' 
                    });
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Erro ao processar formulário:', error);
            showToast('Erro', 'Erro ao processar formulário.', 'error');
        }
    }

    function salvarUsuario(dadosUsuario) {
        try {
            const novoUsuario = {
                id: Date.now() + Math.random(),
                ...dadosUsuario,
                dataCadastro: new Date().toISOString()
            };

            usuarios.unshift(novoUsuario);
            salvarUsuarios();
            aplicarFiltros();
            mostrarUsuarios();
            atualizarPaginacao();
            limparFormulario();
            
            showToast('Sucesso', 'Usuário cadastrado com sucesso!', 'success');
            irParaPagina(1);
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            showToast('Erro', 'Erro ao salvar usuário.', 'error');
        }
    }

    function limparFormulario() {
        try {
            userForm?.reset();
            
            if (filePreview) {
                filePreview.innerHTML = `
                    <iconify-icon icon="mdi:camera-plus"></iconify-icon>
                    <span>Clique para adicionar foto</span>
                `;
                filePreview.classList.remove('has-image');
            }

            // Limpar mensagens de erro
            document.querySelectorAll('.error-message').forEach(element => {
                element.textContent = '';
                element.style.opacity = '0';
                element.style.transform = 'translateY(-10px)';
            });

            // Resetar estilos dos inputs
            document.querySelectorAll('input, select').forEach(element => {
                element.style.borderColor = '';
                element.style.boxShadow = '';
            });
        } catch (error) {
            console.error('Erro ao limpar formulário:', error);
        }
    }

    function handleFileChange(e) {
        try {
            const file = e.target.files[0];
            if (!file) return;

            // Validar arquivo
            if (file.size > 5 * 1024 * 1024) {
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
                    
                    // Animação de sucesso
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
            termoBusca = e.target.value.trim();
            
            if (clearSearch) {
                clearSearch.classList.toggle('show', termoBusca.length > 0);
            }
            
            paginaAtual = 1;
            aplicarFiltros();
            mostrarUsuarios();
            atualizarPaginacao();
        } catch (error) {
            console.error('Erro na busca:', error);
        }
    }

    function limparBusca() {
        try {
            if (searchInput) searchInput.value = '';
            termoBusca = '';
            
            if (clearSearch) clearSearch.classList.remove('show');
            
            paginaAtual = 1;
            aplicarFiltros();
            mostrarUsuarios();
            atualizarPaginacao();
            
            searchInput?.focus();
        } catch (error) {
            console.error('Erro ao limpar busca:', error);
        }
    }

    function handleCargoFilter(e) {
        try {
            filtroargo = e.target.value;
            paginaAtual = 1;
            aplicarFiltros();
            mostrarUsuarios();
            atualizarPaginacao();
        } catch (error) {
            console.error('Erro no filtro:', error);
        }
    }

    function handleSort(e) {
        try {
            ordenacao = e.target.value;
            aplicarFiltros();
            mostrarUsuarios();
            atualizarPaginacao();
        } catch (error) {
            console.error('Erro na ordenação:', error);
        }
    }

    function alterarVisualizacao(tipo) {
        try {
            tipoVisualizacao = tipo;
            
            if (gridView) gridView.classList.toggle('active', tipo === 'grid');
            if (listView) listView.classList.toggle('active', tipo === 'list');
            
            mostrarUsuarios();
            localStorage.setItem('viewPreference', tipo);
        } catch (error) {
            console.error('Erro ao alterar visualização:', error);
        }
    }

    function handleItemsPerPageChange(e) {
        try {
            itensPorPagina = parseInt(e.target.value);
            paginaAtual = 1;
            mostrarUsuarios();
            atualizarPaginacao();
            localStorage.setItem('itemsPerPagePreference', itensPorPagina);
        } catch (error) {
            console.error('Erro ao alterar itens por página:', error);
        }
    }

    function confirmarRemocao(userId) {
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
                confirmModal.dataset.userId = userId;
                confirmModal.dataset.action = 'remove';
            }
        } catch (error) {
            console.error('Erro ao confirmar remoção:', error);
        }
    }

    function confirmarAcao() {
        try {
            if (!confirmModal) return;

            const action = confirmModal.dataset.action;
            const userId = parseInt(confirmModal.dataset.userId);

            if (action === 'remove') {
                usuarios = usuarios.filter(u => u.id !== userId);
                usuariosSelecionados.delete(userId);
                salvarUsuarios();
                aplicarFiltros();
                mostrarUsuarios();
                atualizarPaginacao();
                atualizarBotaoSelecionados();
                showToast('Sucesso', 'Usuário removido com sucesso!', 'success');
            }

            fecharModalConfirmacao();
        } catch (error) {
            console.error('Erro ao executar ação:', error);
        }
    }

    function fecharModalConfirmacao() {
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

    function editarUsuario(userId) {
        try {
            const usuario = usuarios.find(u => u.id === userId);
            if (!usuario) return;

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
                
                // Focar no nome após abrir
                setTimeout(() => {
                    editNome?.focus();
                }, 300);
            }
        } catch (error) {
            console.error('Erro ao editar usuário:', error);
        }
    }

    function salvarEdicao() {
        try {
            const editUserId = document.getElementById('editUserId');
            const editNome = document.getElementById('editNome');
            const editEmail = document.getElementById('editEmail');
            const editTelefone = document.getElementById('editTelefone');
            const editCargo = document.getElementById('editCargo');

            if (!editUserId || !editNome || !editEmail || !editTelefone || !editCargo) return;

            const userId = parseInt(editUserId.value);
            const dadosAtualizados = {
                nome: editNome.value.trim(),
                email: editEmail.value.trim(),
                telefone: editTelefone.value.trim(),
                cargo: editCargo.value
            };

            // Validar dados
            const erros = {
                nome: validarNome(dadosAtualizados.nome),
                email: validarEmail(dadosAtualizados.email),
                telefone: validarTelefone(dadosAtualizados.telefone),
                cargo: validarCargo(dadosAtualizados.cargo)
            };

            if (Object.values(erros).some(erro => erro)) {
                showToast('Erro', 'Por favor, corrija os erros no formulário.', 'error');
                return;
            }

            const saveBtn = document.getElementById('editModalSave');
            if (saveBtn) {
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<div class="loading" style="width: 20px; height: 20px; margin: 0 auto;"></div>';
                saveBtn.disabled = true;

                const usuarioIndex = usuarios.findIndex(u => u.id === userId);
                if (usuarioIndex !== -1) {
                    usuarios[usuarioIndex] = { ...usuarios[usuarioIndex], ...dadosAtualizados };
                    salvarUsuarios();
                    aplicarFiltros();
                    mostrarUsuarios();
                    atualizarPaginacao();
                    showToast('Sucesso', 'Usuário atualizado com sucesso!', 'success');
                    fecharModalEdicao();
                }

                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        } catch (error) {
            console.error('Erro ao salvar edição:', error);
            showToast('Erro', 'Erro ao salvar alterações.', 'error');
        }
    }

    function fecharModalEdicao() {
        try {
            if (editModal) {
                editModal.classList.remove('show');
                document.body.style.overflow = '';
            }
        } catch (error) {
            console.error('Erro ao fechar modal de edição:', error);
        }
    }

    function exportarDados() {
        try {
            if (usuariosFiltrados.length === 0) {
                showToast('Aviso', 'Não há dados para exportar.', 'warning');
                return;
            }

            if (exportData) {
                const originalText = exportData.innerHTML;
                exportData.innerHTML = '<div class="loading" style="width: 20px; height: 20px; margin: 0 auto;"></div>';
                exportData.disabled = true;

                try {
                    const csvContent = [
                        ['Nome', 'Email', 'Telefone', 'Cargo', 'Data de Cadastro'],
                        ...usuariosFiltrados.map(usuario => [
                            usuario.nome,
                            usuario.email,
                            usuario.telefone,
                            usuario.cargo,
                            new Date(usuario.dataCadastro).toLocaleDateString('pt-BR')
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
                } catch {
                    showToast('Erro', 'Erro ao exportar dados. Tente novamente.', 'error');
                } finally {
                    exportData.innerHTML = originalText;
                    exportData.disabled = false;
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

            const closeBtn = toast.querySelector('.toast-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    removerToast(toast);
                });
            }

            toastContainer.appendChild(toast);

            // Auto remover após 5 segundos
            setTimeout(() => {
                removerToast(toast);
            }, 5000);

            // Vibração para feedback tátil
            if (navigator.vibrate) {
                navigator.vibrate(type === 'error' ? [100, 50, 100] : 50);
            }
        } catch (error) {
            console.error('Erro ao mostrar toast:', error);
        }
    }

    function removerToast(toast) {
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

    function setupGlobalEvents() {
        // Carregar preferências
        try {
            const viewPreference = localStorage.getItem('viewPreference');
            if (viewPreference) {
                alterarVisualizacao(viewPreference);
            }

            const itemsPerPagePreference = localStorage.getItem('itemsPerPagePreference');
            if (itemsPerPagePreference && itemsPerPageSelect) {
                itensPorPagina = parseInt(itemsPerPagePreference);
                itemsPerPageSelect.value = itensPorPagina;
            }
        } catch (error) {
            console.error('Erro ao carregar preferências:', error);
        }
    }

    // Verificar dados de importação na inicialização
    verificarDadosImportacao();

    // Adicionar estilos para seleção
    const selectionStyles = document.createElement('style');
    selectionStyles.textContent = `
        .usuario-checkbox {
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 10;
        }
        
        .usuario-checkbox input[type="checkbox"] {
            display: none;
        }
        
        .usuario-checkbox label {
            display: block;
            width: 24px;
            height: 24px;
            border: 2px solid var(--border-color);
            border-radius: 4px;
            background: var(--surface-color);
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .usuario-checkbox input[type="checkbox"]:checked + label {
            background: var(--primary-color);
            border-color: var(--primary-color);
        }
        
        .usuario-checkbox input[type="checkbox"]:checked + label::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 14px;
            font-weight: bold;
        }
        
        .usuario-card.selected {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px var(--primary-light);
        }
        
        .usuario-card {
            position: relative;
        }
        
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
    document.head.appendChild(selectionStyles);
});