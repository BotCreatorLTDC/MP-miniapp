// Aplicación principal de la miniapp MP Global Corp
class MPApp {
    constructor() {
        this.catalog = null;
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.lastImageLoadTime = 0;
        this.welcomeScreenShown = false;

        // Inicializar sistema de traducciones
        this.translationManager = new TranslationManager();

        // Obtener ID de usuario de Telegram
        this.userId = this.getTelegramUserId();
        console.log('User ID:', this.userId);

        // Mostrar información del usuario para debug
        this.logUserInfo();

        // Cargar carrito específico del usuario
        this.cart = this.loadUserCart();

        // Inicializar pantalla de bienvenida
        this.initWelcomeScreen();
    }

    getTelegramUserId() {
        // Intentar obtener el ID del usuario desde Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
            const initData = window.Telegram.WebApp.initDataUnsafe;
            if (initData.user && initData.user.id) {
                return initData.user.id.toString();
            }
        }

        // Fallback: usar timestamp + random para usuarios sin ID de Telegram
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `temp_${timestamp}_${random}`;
    }

    loadUserCart() {
        try {
            const userCarts = JSON.parse(localStorage.getItem('mp_user_carts')) || {};
            return userCarts[this.userId] || [];
        } catch (error) {
            console.error('Error cargando carrito de usuario:', error);
            return [];
        }
    }

    saveUserCart() {
        try {
            const userCarts = JSON.parse(localStorage.getItem('mp_user_carts')) || {};
            userCarts[this.userId] = this.cart;
            localStorage.setItem('mp_user_carts', JSON.stringify(userCarts));

            // Limpiar carritos temporales antiguos (más de 24 horas)
            this.cleanupOldCarts();
        } catch (error) {
            console.error('Error guardando carrito de usuario:', error);
        }
    }

    cleanupOldCarts() {
        try {
            const userCarts = JSON.parse(localStorage.getItem('mp_user_carts')) || {};
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

            // Limpiar carritos temporales antiguos
            Object.keys(userCarts).forEach(userId => {
                if (userId.startsWith('temp_')) {
                    // Extraer timestamp del ID temporal
                    const timestamp = parseInt(userId.split('_')[1], 36);
                    if (now - timestamp > oneDay) {
                        delete userCarts[userId];
                        console.log('Carrito temporal limpiado:', userId);
                    }
                }
            });

            localStorage.setItem('mp_user_carts', JSON.stringify(userCarts));
        } catch (error) {
            console.error('Error limpiando carritos antiguos:', error);
        }
    }

    logUserInfo() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
            const initData = window.Telegram.WebApp.initDataUnsafe;
            console.log('Telegram User Info:', {
                id: initData.user?.id,
                username: initData.user?.username,
                first_name: initData.user?.first_name,
                last_name: initData.user?.last_name
            });
        } else {
            console.log('No Telegram WebApp data available, using temporary ID');
        }
    }

    initWelcomeScreen() {
        // Verificar si ya se mostró la pantalla de bienvenida en esta sesión
        const welcomeShown = sessionStorage.getItem('mp_welcome_shown');

        if (welcomeShown === 'true') {
            // Si ya se mostró, ocultar la pantalla de bienvenida inmediatamente
            this.hideWelcomeScreen();
            this.init();
            return;
        }

        // Configurar el video de bienvenida
        this.setupWelcomeVideo();

        // Configurar el botón de inicio
        this.setupWelcomeButton();

        // Mostrar la pantalla de bienvenida
        this.showWelcomeScreen();
    }

    setupWelcomeVideo() {
        const video = document.getElementById('welcomeVideo');
        if (!video) return;

        // Configurar el video para que se reproduzca automáticamente
        video.addEventListener('loadeddata', () => {
            console.log('✅ Video de bienvenida cargado correctamente');
            // Intentar reproducir el video una vez que esté cargado
            video.play().catch(error => {
                console.log('⚠️ No se pudo reproducir el video automáticamente:', error);
            });
        });

        video.addEventListener('canplay', () => {
            console.log('✅ Video listo para reproducir');
        });

        video.addEventListener('error', (e) => {
            console.log('❌ Error cargando video, usando fallback:', e);
            // El fallback CSS se activará automáticamente
        });

        // Configurar el video para que se reproduzca en loop
        video.addEventListener('ended', () => {
            video.currentTime = 0;
            video.play();
        });

        // Intentar reproducir el video inmediatamente
        video.play().catch(error => {
            console.log('⚠️ No se pudo reproducir el video inmediatamente:', error);
        });
    }

    setupWelcomeButton() {
        const startBtn = document.getElementById('welcomeStartBtn');
        if (!startBtn) return;

        startBtn.addEventListener('click', () => {
            this.startApp();
        });

        // También permitir iniciar con Enter
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.welcomeScreenShown) {
                this.startApp();
            }
        });
    }

    showWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (!welcomeScreen) return;

        welcomeScreen.style.display = 'flex';
        this.welcomeScreenShown = true;

        // Aplicar traducciones a la pantalla de bienvenida
        this.translationManager.translatePage();

        console.log('Pantalla de bienvenida mostrada');
    }

    hideWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (!welcomeScreen) return;

        // Agregar clase de animación de salida
        welcomeScreen.classList.add('fade-out');

        // Ocultar después de la animación
        setTimeout(() => {
            welcomeScreen.style.display = 'none';
            this.welcomeScreenShown = false;
        }, 800); // Duración de la animación CSS
    }

    startApp() {
        console.log('Iniciando aplicación...');

        // Marcar que la pantalla de bienvenida ya se mostró en esta sesión
        sessionStorage.setItem('mp_welcome_shown', 'true');

        // Ocultar pantalla de bienvenida
        this.hideWelcomeScreen();

        // Inicializar la aplicación principal
        this.init();
    }

    async init() {
        try {
            await this.loadCatalog();
            this.setupEventListeners();

            // Asegurar que currentCategory esté inicializado
            this.currentCategory = 'all';
            console.log('🔍 DEBUG: init - currentCategory inicializado como:', this.currentCategory);
            console.log('🔍 DEBUG: init - catálogo cargado:', this.catalog);
            console.log('🔍 DEBUG: init - categorías disponibles:', Object.keys(this.catalog?.categories || {}));

            this.renderProducts();
            this.updateCartUI();
            // Aplicar traducciones iniciales
            this.translationManager.updateUI();

            // Inicializar gestor de pedidos
            console.log('Inicializando OrderManager...');
            this.orderManager = new OrderManager(this);
            console.log('OrderManager inicializado:', this.orderManager);

            // Configurar modal de información
            this.setupInformationModal();

            this.hideLoading();
        } catch (error) {
            console.error('Error inicializando la app:', error);
            this.showError(this.t('error_loading_catalog'));
        }
    }

    getApiBases() {
        const bases = [];
        // 1) Mismo origen (cuando la miniapp se sirve embebida desde el bot)
        bases.push('');
        // 2) Dominio de Render (servicio del bot)
        bases.push('https://mp-bot-wtcf.onrender.com');
        // 3) Local dev (por si se abre el HTML en local con el bot en 5000)
        bases.push('http://127.0.0.1:5000');
        return bases;
    }

    async loadCatalog() {
        try {
            // Probar múltiples bases de API en orden hasta conseguir catálogo
            let loaded = false;
            for (const base of this.getApiBases()) {
                try {
                    const url = `${base}/api/catalog`;
                    console.log('🔎 Intentando cargar catálogo desde:', url);
                    const response = await fetch(url, { cache: 'no-store' });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const result = await response.json();
                    if (!result.success) throw new Error(result.error || 'error_api');
                    this.catalog = result.data;
                    console.log('✅ Catálogo cargado desde:', url);
                    console.log('🔍 DEBUG: Secciones en catálogo:', this.catalog.sections);
                    loaded = true;
                    break;
                } catch (e) {
                    console.warn('⚠️ Falla fuente API:', e.message);
                }
            }

            if (!loaded) throw new Error('no_api_source');

            // Convertir imágenes y sincronizar categorías
            this.convertCatalogImages();
            await this.updateCategoryDisplay();
        } catch (error) {
            console.warn('Error cargando desde API del bot, intentando fallback:', error);
            try {
                // Fallback: cargar desde archivo JSON local
                const response = await fetch('data/catalog.json');
                if (response.ok) {
                    this.catalog = await response.json();
                    console.log('✅ Catálogo cargado desde archivo local');
                    console.log('🔍 DEBUG: Secciones en catálogo local:', this.catalog.sections);
                    // Convertir imágenes después de cargar el catálogo
                    this.convertCatalogImages();
                    // Actualizar visualización de categorías
                    await this.updateCategoryDisplay();
                } else {
                    throw new Error('Archivo local no encontrado');
                }
            } catch (fallbackError) {
                console.warn('Error en fallback, usando datos hardcodeados:', fallbackError);
                this.catalog = this.getFallbackCatalog();
                // Convertir imágenes después de cargar el catálogo
                this.convertCatalogImages();
                // Actualizar visualización de categorías
                await this.updateCategoryDisplay();
            }
        }
    }

    convertCatalogImages() {
        // Convertir todas las imágenes del catálogo para la miniapp
        try {
            console.log('🔄 Convirtiendo imágenes del catálogo...');
            console.log('📚 Catálogo actual:', this.catalog);

            if (!this.catalog || !this.catalog.categories) {
                console.warn('⚠️ No hay catálogo o categorías disponibles');
                return;
            }

            let totalProducts = 0;
            let totalImages = 0;

            for (const categoryName in this.catalog.categories) {
                const category = this.catalog.categories[categoryName];
                console.log(`📁 Procesando categoría: ${categoryName}`);

                if (category.products) {
                    category.products.forEach(product => {
                        totalProducts++;
                        if (product.images && product.images.length > 0) {
                            console.log(`🖼️ Convirtiendo imágenes para "${product.name}":`, product.images);
                            const originalImages = [...product.images];
                            product.images = product.images.map(img => {
                                const converted = this.getImageUrl(img);
                                console.log(`  ${img} -> ${converted}`);
                                return converted;
                            });
                            totalImages += product.images.length;
                            console.log(`✅ Imágenes convertidas para "${product.name}":`, product.images);
                        }
                    });
                }
            }

            console.log(`✅ Conversión completada: ${totalProducts} productos procesados, ${totalImages} imágenes convertidas`);
        } catch (error) {
            console.error('❌ Error convirtiendo imágenes del catálogo:', error);
        }
    }

    async updateCategoryDisplay() {
        // Actualizar la visualización de categorías y secciones dinámicamente
        try {
            console.log('🔄 Actualizando visualización de categorías y secciones...');
            console.log('🔍 DEBUG: updateCategoryDisplay - this.catalog:', this.catalog);
            console.log('🔍 DEBUG: updateCategoryDisplay - this.catalog.categories:', this.catalog?.categories);

            if (!this.catalog || !this.catalog.categories) {
                console.warn('⚠️ No hay catálogo o categorías disponibles');
                return;
            }

            // Actualizar el menú de categorías (usar category-tabs en lugar de category-menu)
            const categoryTabs = document.querySelector('.category-tabs');
            if (categoryTabs) {
                // Limpiar botones existentes (excepto "Todos")
                const existingButtons = categoryTabs.querySelectorAll('.tab-btn:not([data-category="all"])');
                existingButtons.forEach(btn => btn.remove());

                // Añadir botones para cada categoría
                for (const categoryKey in this.catalog.categories) {
                    const category = this.catalog.categories[categoryKey];
                    const categoryButton = document.createElement('button');
                    categoryButton.className = 'tab-btn';
                    categoryButton.setAttribute('data-category', categoryKey);
                    categoryButton.innerHTML = `<i class="fas fa-cannabis"></i><span>${category.name}</span>`;
                    categoryButton.onclick = () => this.showCategory(categoryKey);
                    categoryTabs.appendChild(categoryButton);
                }

                console.log(`✅ Añadidas ${Object.keys(this.catalog.categories).length} categorías al menú`);

                // Añadir separador y secciones de información
                try {
                    const sections = await this.loadSections();
                    console.log('🔍 DEBUG: Secciones cargadas para menú:', Object.keys(sections));

                    if (Object.keys(sections).length > 0) {
                        // Crear separador visual
                        const separator = document.createElement('div');
                        separator.className = 'menu-separator';
                        separator.innerHTML = '<hr><span>Información</span><hr>';
                        categoryTabs.appendChild(separator);

                        // Añadir botones para secciones de información
                        for (const sectionKey in sections) {
                            const section = sections[sectionKey];
                            const sectionButton = document.createElement('button');
                            sectionButton.className = 'tab-btn section-btn';
                            sectionButton.setAttribute('data-section', sectionKey);

                            // Iconos específicos para cada sección
                            let icon = 'fas fa-info-circle';
                            if (sectionKey === 'shipping') icon = 'fas fa-shipping-fast';
                            else if (sectionKey === 'stock') icon = 'fas fa-boxes';
                            else if (sectionKey === 'contact') icon = 'fas fa-phone';

                            sectionButton.innerHTML = `<i class="${icon}"></i><span>${section.title || sectionKey}</span>`;
                            sectionButton.onclick = () => this.showSection(sectionKey);
                            categoryTabs.appendChild(sectionButton);
                        }

                        console.log(`✅ Añadidas ${Object.keys(sections).length} secciones al menú con separador`);
                    }
                } catch (error) {
                    console.error('❌ Error cargando secciones para menú:', error);
                }
            } else {
                console.warn('⚠️ No se encontró el elemento .category-tabs');
            }

            console.log('✅ Visualización de categorías y secciones actualizada');
        } catch (error) {
            console.error('❌ Error actualizando visualización de categorías:', error);
        }
    }

    getFallbackCatalog() {
        // Datos de fallback basados en el catalog.json del bot
        return {
            categories: {
                moroccan_hash: {
                    name: "🇲🇦 MOROCCAN STUFF 🇲🇦",
                    products: [
                        {
                            name: "Commercial Mousse",
                            price: "100@ / 320# | 300@ / 290# | 500@ / 270# | 1k@ / 250#",
                            description: "Commercial Mousse - 100@ / 320# | 300@ / 290# | 500@ / 270# | 1k@ / 250#",
                            stock: "Disponible"
                        },
                        {
                            name: "7Seven Mousse",
                            price: "100@ / 320# | 300@ / 290# | 500@ / 270# | 1k@ / 250#",
                            description: "7Seven Mousse - 100@ / 320# | 300@ / 290# | 500@ / 270# | 1k@ / 250#",
                            stock: "Disponible"
                        }
                    ]
                },
                spanish_flower: {
                    name: "🇪🇸 SPANISH STUFF 🇪🇸",
                    products: [
                        {
                            name: "Top Indoor (Loose) - Zkittlez",
                            price: "100@ / 510# | 300@ / 480# | 500@ / 450#",
                            description: "Top Indoor (Loose) - Zkittlez - 100@ / 510# | 300@ / 480# | 500@ / 450#",
                            stock: "Disponible"
                        }
                    ]
                },
                cali_flower: {
                    name: "🇺🇸 CALIFORNIA STUFF 🇺🇸",
                    products: [
                        {
                            name: "Standard Indoor (Loose) - Apple Tartz",
                            price: "1Oz / 260# | Qp / 780# | Hp / 1.240# | Lb / 2.400#",
                            description: "Standard Indoor (Loose) - Apple Tartz - 1Oz / 260# | Qp / 780# | Hp / 1.240# | Lb / 2.400#",
                            stock: "Disponible"
                        }
                    ]
                },
                extractions: {
                    name: "🔬 EXTRACTIONS",
                    products: [
                        {
                            name: "Live Resin - Exotic Terps - LemonGum [2G Jars]",
                            price: "2@ / 50# | 5ud / 45# | 10ud / 40# | 50ud / 35# | 100ud / 30#",
                            description: "Live Resin - Exotic Terps - LemonGum [2G Jars] - 2@ / 50# | 5ud / 45# | 10ud / 40# | 50ud / 35# | 100ud / 30#",
                            stock: "Disponible"
                        }
                    ]
                },
                varios: {
                    name: "📦 OTHER PRODUCTS",
                    products: [
                        {
                            name: "Prerolls & Donuts - Exotic Terps x Genetics By G - LA Kush Cake X Pop Rocks [2G Flower]",
                            price: "1ud / 60# | 5ud / 55# | 10ud / 50#",
                            description: "Prerolls & Donuts - Exotic Terps x Genetics By G - LA Kush Cake X Pop Rocks [2G Flower] - 1ud / 60# | 5ud / 55# | 10ud / 50#",
                            stock: "Disponible",
                            images: []
                        }
                    ]
                }
            }
        };
    }

    setupEventListeners() {
        // Navegación por categorías (solo botones de categoría, no secciones)
        document.querySelectorAll('.tab-btn[data-category]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.setActiveCategory(category);
            });
        });

        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();

            // Debounce para evitar muchas llamadas a la API
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch();
            }, 300);
        });

        // Evitar que se cierre la barra lateral cuando se hace foco en el input
        searchInput.addEventListener('focus', (e) => {
            const navigation = document.getElementById('navigation');
            if (navigation) {
                navigation.classList.add('show');
            }
        });

        // Evitar que se cierre la barra lateral cuando se pierde el foco
        searchInput.addEventListener('blur', (e) => {
            // Solo cerrar si no hay texto en el input
            if (!this.searchTerm || this.searchTerm.trim() === '') {
                const navigation = document.getElementById('navigation');
                if (navigation) {
                    navigation.classList.remove('show');
                }
            }
        });

        // Carrito
        document.getElementById('cartBtn').addEventListener('click', () => {
            this.showCart();
        });

        // Menú móvil
        document.getElementById('menuToggle').addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Ocultar menú al hacer clic fuera de él
        document.addEventListener('click', (e) => {
            const navigation = document.getElementById('navigation');
            const menuToggle = document.getElementById('menuToggle');

            if (navigation && navigation.classList.contains('show') &&
                !navigation.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                navigation.classList.remove('show');
            }
        });

        // Ocultar menú al hacer scroll
        window.addEventListener('scroll', () => {
            const navigation = document.getElementById('navigation');
            if (navigation && navigation.classList.contains('show')) {
                navigation.classList.remove('show');
            }
        });

        // Modales
        this.setupModalListeners();

        // Image Zoom
        this.setupImageZoom();

        // Security & Privacy
        this.setupSecurity();

        // Language Selection
        this.setupLanguageSelection();
    }

    setupModalListeners() {
        // Cerrar modales
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal);
            });
        });

        // Cerrar al hacer clic fuera del modal
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    this.hideModal(openModal);
                }
            }
        });

        // Information modal specific listeners
        this.setupInformationModalListeners();
    }

    setupInformationModalListeners() {
        // Cerrar modal de información
        const closeInformationModal = document.getElementById('closeInformationModal');
        const closeInformationModalBtn = document.getElementById('closeInformationModalBtn');

        if (closeInformationModal) {
            closeInformationModal.addEventListener('click', () => this.hideInformationModal());
        }
        if (closeInformationModalBtn) {
            closeInformationModalBtn.addEventListener('click', () => this.hideInformationModal());
        }
    }

    hideInformationModal() {
        const modal = document.getElementById('informationModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    setActiveCategory(category) {
        this.currentCategory = category;

        // Actualizar botones de categoría
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeButton = document.querySelector(`[data-category="${category}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Ocultar menú desplegado en móvil
        const navigation = document.getElementById('navigation');
        if (navigation) {
            navigation.classList.remove('show');
        }

        // Renderizar productos
        this.renderProducts();
    }

    async performSearch() {
        if (!this.searchTerm) {
            this.renderProducts();
            return;
        }

        // Mostrar indicador de búsqueda
        this.showSearchIndicator();

        try {
            // Intentar búsqueda contra múltiples bases
            for (const base of this.getApiBases()) {
                try {
                    const url = `${base}/api/products/search?q=${encodeURIComponent(this.searchTerm)}`;
                    const response = await fetch(url, { cache: 'no-store' });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const result = await response.json();
                if (result.success) {
                    this.searchResults = result.data;
                    this.renderSearchResults();
                        return;
                }
                } catch (e) {
                    // probar siguiente base
                }
            }
        } catch (error) {
            console.warn('Error en búsqueda API, usando búsqueda local:', error);
        }

        // Fallback: búsqueda local
        this.performLocalSearch();
    }

    showSearchIndicator() {
        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');

        emptyState.style.display = 'none';
        productsGrid.innerHTML = `
            <div class="search-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>${this.t('searching')}</p>
            </div>
        `;
    }

    performLocalSearch() {
        if (!this.catalog || !this.catalog.categories) {
            console.error('No hay catálogo disponible para búsqueda local');
            this.renderProducts();
            return;
        }

        const searchTerm = this.searchTerm.toLowerCase();
        const results = [];

        // Buscar en todas las categorías
        for (const categoryId in this.catalog.categories) {
            const category = this.catalog.categories[categoryId];
            if (category.products) {
                for (const product of category.products) {
                    // Buscar en nombre, descripción y categoría
                    const productName = (product.name || '').toLowerCase();
                    const productDescription = (product.description || '').toLowerCase();
                    const categoryName = (category.name || '').toLowerCase();

                    if (productName.includes(searchTerm) ||
                        productDescription.includes(searchTerm) ||
                        categoryName.includes(searchTerm)) {
                        results.push(product);
                    }
                }
            }
        }

        this.searchResults = results;
        this.renderSearchResults();
    }

    renderSearchResults() {
        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.searchResults.length === 0) {
            productsGrid.innerHTML = '';
            emptyState.style.display = 'block';

            // Mostrar mensaje específico para búsqueda sin resultados
            const emptyStateContent = emptyState.querySelector('.empty-state-content');
            if (emptyStateContent) {
                emptyStateContent.innerHTML = `
                    <i class="fas fa-search"></i>
                    <h3>${this.t('no_products_found')}</h3>
                    <p>${this.t('no_products_match')} "${this.searchTerm}"</p>
                    <p>${this.t('try_different_terms')}</p>
                `;
            }
        } else {
            emptyState.style.display = 'none';
            productsGrid.innerHTML = this.searchResults.map(product => this.createProductCard(product)).join('');

            // Agregar event listeners a las tarjetas de productos
            productsGrid.querySelectorAll('.product-card').forEach(card => {
                card.addEventListener('click', () => {
                    const productName = card.dataset.productName;
                    this.showProductModal(productName);
                });
            });
        }
    }

    renderProducts() {
        console.log('🔍 DEBUG: renderProducts - Iniciando...');
        console.log('🔍 DEBUG: renderProducts - currentCategory:', this.currentCategory);
        console.log('🔍 DEBUG: renderProducts - catalog:', this.catalog);

        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');

        // Si no existe productsGrid, crearlo
        if (!productsGrid) {
            console.log('🔍 DEBUG: productsGrid no existe, creándolo...');
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="products-container" id="productsContainer">
                        <div class="products-grid" id="productsGrid">
                            <!-- Los productos se cargarán dinámicamente aquí -->
                        </div>
                    </div>
                    <div class="empty-state" id="emptyState" style="display: none;">
                        <i class="fas fa-search"></i>
                        <h3 data-i18n="no_products_found">No se encontraron productos</h3>
                        <p data-i18n="try_different_terms">Intenta con otros términos de búsqueda</p>
                    </div>
                `;
            }
        }

        // Obtener referencias actualizadas después de crear los elementos
        const updatedProductsGrid = document.getElementById('productsGrid');
        const updatedEmptyState = document.getElementById('emptyState');

        if (!this.catalog) {
            console.log('❌ DEBUG: renderProducts - No hay catálogo');
            if (updatedProductsGrid) {
                updatedProductsGrid.innerHTML = `<p>${this.t('error_loading_catalog')}</p>`;
            }
            return;
        }

        let products = [];

        // Obtener productos según la categoría seleccionada
        if (this.currentCategory === 'all') {
            console.log('🔍 DEBUG: renderProducts - Mostrando todos los productos');
            Object.values(this.catalog.categories).forEach(category => {
                console.log('🔍 DEBUG: renderProducts - Procesando categoría:', category.name, 'con', category.products?.length || 0, 'productos');
                products = products.concat(category.products || []);
            });
        } else {
            console.log('🔍 DEBUG: renderProducts - Mostrando categoría específica:', this.currentCategory);
            const category = this.catalog.categories[this.currentCategory];
            if (category) {
                console.log('🔍 DEBUG: renderProducts - Categoría encontrada:', category.name, 'con', category.products?.length || 0, 'productos');
                products = category.products || [];
            } else {
                console.log('❌ DEBUG: renderProducts - Categoría no encontrada:', this.currentCategory);
            }
        }

        console.log('🔍 DEBUG: renderProducts - Productos encontrados:', products.length);

        // Filtrar por término de búsqueda
        if (this.searchTerm) {
            console.log('🔍 DEBUG: renderProducts - Filtrando por término:', this.searchTerm);
            products = products.filter(product =>
                product.name.toLowerCase().includes(this.searchTerm) ||
                product.description.toLowerCase().includes(this.searchTerm)
            );
            console.log('🔍 DEBUG: renderProducts - Productos después del filtro:', products.length);
        }

        // Renderizar productos
        if (products.length === 0) {
            console.log('❌ DEBUG: renderProducts - No hay productos para mostrar');
            if (updatedProductsGrid) {
                updatedProductsGrid.innerHTML = '';
            }
            if (updatedEmptyState) {
                updatedEmptyState.style.display = 'block';
            }
        } else {
            console.log('✅ DEBUG: renderProducts - Renderizando', products.length, 'productos');
            if (updatedEmptyState) {
                updatedEmptyState.style.display = 'none';
            }
            if (updatedProductsGrid) {
                updatedProductsGrid.innerHTML = products.map(product => this.createProductCard(product)).join('');

            // Agregar event listeners a las tarjetas de productos
                updatedProductsGrid.querySelectorAll('.product-card').forEach(card => {
                card.addEventListener('click', () => {
                    const productName = card.dataset.productName;
                    this.showProductModal(productName);
                });
            });
            }
        }
    }

    createProductCard(product) {
        console.log('createProductCard called for:', product.name);
        console.log('product.media:', product.media);
        console.log('product.images:', product.images);

        const isAvailable = product.stock === 'Disponible' || product.stock === this.t('available');
        const categoryClass = this.getCategoryClass(this.currentCategory);

        let mediaHtml = '';

        // Usar el nuevo sistema de medios o fallback a imágenes
        let mediaItems = [];

        if (product.media && product.media.length > 0) {
            mediaItems = product.media;
        } else if (product.images && product.images.length > 0) {
            mediaItems = product.images.map(img => {
                // Detectar tipo de medio por extensión
                const url = img.toLowerCase();
                if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
                    return { type: 'video', url: img };
                } else if (url.includes('.gif')) {
                    return { type: 'gif', url: img };
                } else {
                    return { type: 'image', url: img };
                }
            });
        }

        console.log('mediaItems processed:', mediaItems);

        if (mediaItems && mediaItems.length > 0) {
            // Mostrar solo 1 elemento de medio (la primera imagen)
            const maxMedia = 1;
            // Filtrar solo imágenes para la miniatura
            const imageItems = mediaItems.filter(item => item.type === 'image');
            const media = imageItems.slice(0, maxMedia);

            mediaHtml = media.map((mediaItem, index) => {
                return this.createMediaElement(mediaItem, product.name, index);
            }).join('');

            // Añadir chip de galería en la tarjeta
            const mediaPayload = JSON.stringify(mediaItems).replace(/"/g, '&quot;');
            const viewAllText = mediaItems.length > 2 ? '+' + (mediaItems.length - 2) : 'Ver todo';
            mediaHtml += `<div class="view-all-media" onclick="event.stopPropagation(); showMediaGallery('${product.name}', ${mediaPayload})">
                <i class="fas fa-images"></i>
                <span>${viewAllText}</span>
            </div>`;
        }

        // Variantes de precio (máximo 4 en tarjeta)
        let priceVariantsHtml = '';
        try {
            const parsedPrices = this.parsePrices(product.price);
            if (Array.isArray(parsedPrices) && parsedPrices.length > 0) {
                const limited = parsedPrices.slice(0, 4);
                priceVariantsHtml = `
                    <div class="price-variants">
                        ${limited.map(p => `
                            <span class="price-variant">
                                <span class="variant-qty">${p.quantity}</span>
                                <span class="variant-sep">/</span>
                                <span class="variant-amt">${p.amount}</span>
                            </span>
                        `).join('')}
                        ${parsedPrices.length > 4 ? `<span class="price-variant more">+${parsedPrices.length - 4}</span>` : ''}
                    </div>
                `;
            }
        } catch (e) {
            console.warn('Precio no parseable para tarjeta:', product.price, e);
        }

        return `
            <div class="product-card fade-in" data-product-name="${product.name}">
                <div class="category-indicator ${categoryClass}">
                    ${this.getCategoryIcon(this.currentCategory)}
                </div>
                <div class="product-image">
                    ${mediaHtml}
                    <div class="image-placeholder" style="display: ${mediaItems && mediaItems.length > 0 ? 'none' : 'flex'};">
                        <i class="fas fa-cannabis"></i>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${product.price}</p>
                    ${priceVariantsHtml}
                    <span class="product-stock ${isAvailable ? 'stock-available' : 'stock-unavailable'}">
                        ${isAvailable ? this.t('available') : this.t('unavailable')}
                    </span>
                </div>
            </div>
        `;
    }

    createMediaElement(mediaItem, productName, index) {
        const mediaUrl = this.getMediaUrl(mediaItem.url);
        const isSecondary = index > 0;

        switch (mediaItem.type) {
            case 'video':
                return `
                    <div class="media-container video-container ${isSecondary ? 'secondary-media' : ''}" data-media-type="video">
                        <video class="gallery-media" muted loop playsinline autoplay preload="metadata" style="object-fit: cover;">
                            <source src="${mediaUrl}" type="video/mp4">
                            <source src="${mediaUrl.replace('.mp4', '.webm')}" type="video/webm">
                        </video>
                        <div class="media-overlay">
                            <i class="fas fa-play media-play-icon"></i>
                        </div>
                    </div>
                `;

            case 'gif':
                return `
                    <div class="media-container gif-container ${isSecondary ? 'secondary-media' : ''}" data-media-type="gif">
                        <img src="${mediaUrl}" alt="${productName}" class="gallery-media gif-media">
                        <div class="media-overlay">
                            <i class="fas fa-play gif-play-icon"></i>
                        </div>
                    </div>
                `;

            case 'image':
            default:
                return `
                    <div class="media-container image-container ${isSecondary ? 'secondary-media' : ''}" data-media-type="image">
                        <img src="${mediaUrl}" alt="${productName}" class="gallery-media gallery-image"
                             onload="console.log('Media loaded:', this.src); window.mpApp.lastImageLoadTime = Date.now();"
                             onerror="console.log('Media error:', this.src); this.style.display='none';">
                    </div>
                `;
        }
    }

    getMediaUrl(mediaPath) {
        // Si ya es una URL completa, devolverla tal como está
        if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
            return mediaPath;
        }

        // Si es una ruta relativa, construir la URL completa usando la misma lógica del bot
        const baseUrl = 'https://botcreatorltdc.github.io/MP-miniapp';
        return `${baseUrl}/${mediaPath}`;
    }

    formatDuration(seconds) {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showMediaGallery(productName, mediaItems) {
        console.log('Mostrando galería de medios para:', productName, mediaItems);

        const modal = document.getElementById('mediaGalleryModal');
        if (!modal) {
            this.createMediaGalleryModal();
        }

        // Actualizar contenido del modal
        this.updateMediaGalleryContent(productName, mediaItems);

        // Mostrar modal
        document.getElementById('mediaGalleryModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    createMediaGalleryModal() {
        const modalHtml = `
            <div class="modal" id="mediaGalleryModal">
                <div class="modal-content media-gallery-content">
                    <div class="modal-header">
                        <div class="modal-header-content">
                            <img src="https://botcreatorltdc.github.io/MP-miniapp/assets/images/logo.jpg" alt="MP Global Corp Logo" class="modal-logo">
                            <h2 id="mediaGalleryTitle">Galería de Medios</h2>
                        </div>
                        <button class="close-btn" id="closeMediaGalleryModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body media-gallery-body">
                        <div class="media-gallery-container">
                            <div class="media-gallery-main" id="mediaGalleryMain">
                                <!-- Contenido principal de medios -->
                            </div>
                            <div class="media-gallery-thumbnails" id="mediaGalleryThumbnails">
                                <!-- Miniaturas -->
                            </div>
                        </div>
                        <div class="media-gallery-controls">
                            <button class="media-control-btn" id="prevMediaBtn">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button class="media-control-btn" id="nextMediaBtn">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Configurar event listeners
        this.setupMediaGalleryEvents();
    }

    setupMediaGalleryEvents() {
        const modal = document.getElementById('mediaGalleryModal');
        const closeBtn = document.getElementById('closeMediaGalleryModal');
        const prevBtn = document.getElementById('prevMediaBtn');
        const nextBtn = document.getElementById('nextMediaBtn');

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        prevBtn.addEventListener('click', () => this.previousMedia());
        nextBtn.addEventListener('click', () => this.nextMedia());

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    updateMediaGalleryContent(productName, mediaItems) {
        const title = document.getElementById('mediaGalleryTitle');
        const mainContainer = document.getElementById('mediaGalleryMain');
        const thumbnailsContainer = document.getElementById('mediaGalleryThumbnails');

        title.textContent = `${productName} - Galería`;

        // Limpiar contenido anterior
        mainContainer.innerHTML = '';
        thumbnailsContainer.innerHTML = '';

        // Configurar estado de la galería
        this.currentMediaIndex = 0;
        this.mediaItems = mediaItems;

        // Crear elementos de medios
        mediaItems.forEach((mediaItem, index) => {
            // Contenido principal
            const mediaElement = this.createGalleryMediaElement(mediaItem, index === 0);
            mainContainer.appendChild(mediaElement);

            // Miniatura
            const thumbnail = this.createMediaThumbnail(mediaItem, index);
            thumbnailsContainer.appendChild(thumbnail);
        });

        // Actualizar controles
        this.updateMediaGalleryControls();
    }

    createGalleryMediaElement(mediaItem, isActive) {
        const container = document.createElement('div');
        container.className = `gallery-media-item ${isActive ? 'active' : ''}`;
        container.dataset.mediaType = mediaItem.type;

        const mediaUrl = this.getMediaUrl(mediaItem.url);

        switch (mediaItem.type) {
            case 'video':
                container.innerHTML = `
                    <video class="gallery-main-media" controls muted loop playsinline preload="metadata">
                        <source src="${mediaUrl}" type="video/mp4">
                        <source src="${mediaUrl.replace('.mp4', '.webm')}" type="video/webm">
                    </video>
                    <div class="media-info">
                        <span class="media-type-badge video-badge">
                            <i class="fas fa-video"></i> Video
                        </span>
                        ${mediaItem.duration ? `<span class="media-duration">${this.formatDuration(mediaItem.duration)}</span>` : ''}
                    </div>
                `;
                break;

            case 'gif':
                container.innerHTML = `
                    <img src="${mediaUrl}" alt="GIF" class="gallery-main-media gif-media">
                    <div class="media-info">
                        <span class="media-type-badge gif-badge">
                            <i class="fas fa-play"></i> GIF
                        </span>
                    </div>
                `;
                break;

            case 'image':
            default:
                container.innerHTML = `
                    <img src="${mediaUrl}" alt="Imagen" class="gallery-main-media">
                    <div class="media-info">
                        <span class="media-type-badge image-badge">
                            <i class="fas fa-image"></i> Imagen
                        </span>
                    </div>
                `;
        }

        return container;
    }

    createMediaThumbnail(mediaItem, index) {
        const thumbnail = document.createElement('div');
        thumbnail.className = `media-thumbnail ${index === 0 ? 'active' : ''}`;
        thumbnail.dataset.index = index;

        let thumbnailUrl;
        if (mediaItem.type === 'video') {
            // Para videos, usar la primera imagen disponible o crear un thumbnail
            const imageItems = this.currentMediaItems.filter(item => item.type === 'image');
            if (imageItems.length > 0) {
                thumbnailUrl = this.getMediaUrl(imageItems[0].url);
            } else {
                // Si no hay imágenes, usar el video con poster
                thumbnailUrl = this.getMediaUrl(mediaItem.url);
            }
        } else {
            thumbnailUrl = this.getMediaUrl(mediaItem.url);
        }

        if (mediaItem.type === 'video') {
            thumbnail.innerHTML = `
                <video class="thumbnail-video" muted preload="metadata" poster="${thumbnailUrl}">
                    <source src="${this.getMediaUrl(mediaItem.url)}" type="video/mp4">
                </video>
                <div class="thumbnail-overlay">
                    <i class="fas fa-play"></i>
                </div>
            `;
        } else {
            thumbnail.innerHTML = `
                <img src="${thumbnailUrl}" alt="Thumbnail" class="thumbnail-image">
                <div class="thumbnail-overlay">
                    <i class="fas fa-${mediaItem.type === 'gif' ? 'play' : 'image'}"></i>
                </div>
            `;
        }

        thumbnail.addEventListener('click', () => this.showMediaAtIndex(index));

        return thumbnail;
    }

    showMediaAtIndex(index) {
        const mainContainer = document.getElementById('mediaGalleryMain');
        const thumbnails = document.querySelectorAll('.media-thumbnail');
        const mediaItems = document.querySelectorAll('.gallery-media-item');

        // Ocultar elemento actual
        mediaItems[this.currentMediaIndex].classList.remove('active');
        thumbnails[this.currentMediaIndex].classList.remove('active');

        // Mostrar nuevo elemento
        this.currentMediaIndex = index;
        mediaItems[index].classList.add('active');
        thumbnails[index].classList.add('active');

        this.updateMediaGalleryControls();
    }

    previousMedia() {
        if (this.currentMediaIndex > 0) {
            this.showMediaAtIndex(this.currentMediaIndex - 1);
        }
    }

    nextMedia() {
        if (this.currentMediaIndex < this.mediaItems.length - 1) {
            this.showMediaAtIndex(this.currentMediaIndex + 1);
        }
    }

    updateMediaGalleryControls() {
        const prevBtn = document.getElementById('prevMediaBtn');
        const nextBtn = document.getElementById('nextMediaBtn');

        prevBtn.style.opacity = this.currentMediaIndex === 0 ? '0.5' : '1';
        nextBtn.style.opacity = this.currentMediaIndex === this.mediaItems.length - 1 ? '0.5' : '1';
    }

    getCategoryClass(category) {
        const classes = {
            'moroccan_hash': 'category-moroccan',
            'spanish_flower': 'category-spanish',
            'cali_flower': 'category-cali',
            'extractions': 'category-extractions',
            'varios': 'category-otros',
            'all': 'category-moroccan'
        };
        return classes[category] || 'category-otros';
    }

    getCategoryIcon(category) {
        const icons = {
            'moroccan_hash': '🇲🇦',
            'spanish_flower': '🇪🇸',
            'cali_flower': '🇺🇸',
            'extractions': '🔬',
            'varios': '📦',
            'all': '🏠'
        };
        return icons[category] || '📦';
    }

    getImageUrl(imagePath) {
        console.log('getImageUrl called with:', imagePath);

        // Si la imagen es una URL completa, usarla directamente
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            console.log('Using full URL:', imagePath);
            return imagePath;
        }

        // Si es una URL de Telegram API, usarla directamente
        if (imagePath.includes('api.telegram.org/file/bot')) {
            console.log('Using Telegram API URL:', imagePath);
            return imagePath;
        }

        // Si es una referencia a imagen de base de datos, usar el endpoint de la API
        if (imagePath.startsWith('db_image_')) {
            const base = location.hostname.endsWith('github.io') ? 'https://mp-bot-wtcf.onrender.com' : '';
            const apiUrl = `${base}/api/image/${imagePath}`;
            console.log('Using database image:', imagePath, '->', apiUrl);
            return apiUrl;
        }

        // Si es una ruta relativa que empieza con 'img/': SIEMPRE usar GitHub Pages
        if (imagePath.startsWith('img/')) {
            const cdnUrl = `https://botcreatorltdc.github.io/MP-miniapp/assets/images/${imagePath}`;
            console.log('Forcing img/ to GitHub Pages CDN:', imagePath, '->', cdnUrl);
            return cdnUrl;
        }

        // Si parece ser un file_id de Telegram, intentar construir la URL
        if (imagePath.length > 20 && !imagePath.includes('/') && !imagePath.includes('\\')) {
            // Es muy probable que sea un file_id: construir un proxy a través del backend del bot
            const base = location.hostname.endsWith('github.io') ? 'https://mp-bot-wtcf.onrender.com' : '';
            const apiUrl = `${base}/api/file/${imagePath}`;
            console.log('Detected file_id, proxying via:', apiUrl);
            return apiUrl;
        }

        // Para otros casos, intentar usar la imagen directamente
        console.log('Using path as-is:', imagePath);
        return imagePath;
    }

    showImageGallery(productName, images) {
        console.log('showImageGallery called for:', productName, 'with', images.length, 'images');
        console.log('Images array:', images);

        // Convertir imágenes al nuevo formato de medios detectando el tipo
        const mediaItems = images.map(img => {
            const url = img.toLowerCase();
            if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
                return { type: 'video', url: img };
            } else if (url.includes('.gif')) {
                return { type: 'gif', url: img };
            } else {
                return { type: 'image', url: img };
            }
        });

        // Usar el nuevo sistema de galería de medios
        this.showMediaGallery(productName, mediaItems);
    }

    showImageGalleryLegacy(productName, images) {
        console.log('showImageGalleryLegacy called for:', productName, 'with', images.length, 'images');
        console.log('Images array:', images);

        // Crear modal para galería de imágenes
        const modal = document.createElement('div');
        modal.className = 'image-gallery-modal';
        console.log('Creating gallery modal with', images.length, 'images');
        modal.innerHTML = `
            <div class="gallery-overlay" onclick="this.parentElement.remove()">
                <div class="gallery-container" onclick="event.stopPropagation()">
                    <div class="gallery-header">
                        <h3>${productName}</h3>
                        <button class="close-gallery" onclick="this.closest('.image-gallery-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="gallery-images">
                        ${images.map((image, index) => `
                            <div class="gallery-item">
                                <img src="${this.getImageUrl(image)}" alt="${productName} - Imagen ${index + 1}"
                                     onclick="this.classList.toggle('fullscreen')">
                                <div class="image-counter">${index + 1} / ${images.length}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="gallery-nav">
                        <button class="nav-btn prev-btn" onclick="this.parentElement.parentElement.querySelector('.gallery-images').scrollBy(-300, 0)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="nav-btn next-btn" onclick="this.parentElement.parentElement.querySelector('.gallery-images').scrollBy(300, 0)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        console.log('Gallery modal added to DOM');
        console.log('Modal element:', modal);

        // Añadir estilos si no existen
        if (!document.getElementById('gallery-styles')) {
            const styles = document.createElement('style');
            styles.id = 'gallery-styles';
            console.log('Adding gallery styles');
            styles.textContent = `
                .image-gallery-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                }

                .gallery-overlay {
                    background: rgba(0, 0, 0, 0.9);
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .gallery-container {
                    background: #1a1a1a;
                    border-radius: 15px;
                    max-width: 90vw;
                    max-height: 90vh;
                    overflow: hidden;
                    position: relative;
                }

                .gallery-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #333;
                }

                .gallery-header h3 {
                    color: #fff;
                    margin: 0;
                    font-size: 1.2em;
                }

                .close-gallery {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 1.5em;
                    cursor: pointer;
                    padding: 5px;
                }

                .gallery-images {
                    display: flex;
                    overflow-x: auto;
                    padding: 20px;
                    gap: 15px;
                    scroll-behavior: smooth;
                }

                .gallery-item {
                    position: relative;
                    min-width: 300px;
                    height: 300px;
                }

                .gallery-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                }

                .gallery-item img.fullscreen {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 90vw;
                    height: 90vh;
                    z-index: 10001;
                    object-fit: contain;
                }

                .image-counter {
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.7);
                    color: #fff;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 0.9em;
                }

                .gallery-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    pointer-events: none;
                }

                .nav-btn {
                    background: rgba(0, 0, 0, 0.7);
                    border: none;
                    color: #fff;
                    font-size: 1.5em;
                    padding: 15px;
                    cursor: pointer;
                    pointer-events: all;
                    transition: background 0.3s ease;
                }

                .nav-btn:hover {
                    background: rgba(0, 0, 0, 0.9);
                }

                .prev-btn {
                    border-radius: 0 10px 10px 0;
                }

                .next-btn {
                    border-radius: 10px 0 0 10px;
                }

                .secondary-image {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 60px;
                    height: 60px;
                    border-radius: 8px;
                    border: 2px solid #fff;
                    object-fit: cover;
                }

                .view-all-images {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.8);
                    color: #fff;
                    padding: 8px 12px;
                    border-radius: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.9em;
                    transition: background 0.3s ease;
                }

                .view-all-images:hover {
                    background: rgba(0, 0, 0, 0.9);
                }
            `;
            document.head.appendChild(styles);
            console.log('Gallery styles added to head');
        }
    }

    getPlaceholderImage() {
        // Generar un placeholder basado en la categoría
        const placeholders = {
            'moroccan_hash': 'https://via.placeholder.com/300x200/4a5d23/ffffff?text=🇲🇦+MOROCCAN',
            'spanish_flower': 'https://via.placeholder.com/300x200/2d5016/ffffff?text=🇪🇸+SPANISH',
            'cali_flower': 'https://via.placeholder.com/300x200/1a4d1a/ffffff?text=🇺🇸+CALIFORNIA',
            'extractions': 'https://via.placeholder.com/300x200/8b4513/ffffff?text=🔬+EXTRACTIONS',
            'varios': 'https://via.placeholder.com/300x200/654321/ffffff?text=📦+PRODUCTS'
        };

        const category = this.currentCategory || 'varios';
        return placeholders[category] || placeholders['varios'];
    }

    showProductModal(productName) {
        console.log('showProductModal called for:', productName);
        const product = this.findProductByName(productName);
        if (!product) {
            console.log('Product not found:', productName);
            return;
        }
        console.log('Product found:', product);
        console.log('Product images:', product.images);

        const modal = document.getElementById('productModal');
        const modalProductName = document.getElementById('modalProductName');
        const productGallery = document.getElementById('productGallery');
        const priceList = document.getElementById('priceList');
        const productDescription = document.getElementById('productDescription');
        const stockBadge = document.getElementById('stockBadge');

        // Configurar modal
        modalProductName.textContent = product.name;
        productDescription.textContent = product.description;

        // Configurar galería de imágenes
        if (product.images && product.images.length > 0) {
            console.log(`Modal: Producto ${product.name} tiene ${product.images.length} imágenes`);
            this.lastImageLoadTime = Date.now();

            // Mostrar máximo 2 imágenes en el modal
            const maxImages = Math.min(2, product.images.length);
            const images = product.images.slice(0, maxImages);

            let galleryHtml = images.map((image, index) => {
                const imageUrl = this.getImageUrl(image);
                return `<img src="${imageUrl}" alt="${product.name}" class="gallery-image ${index > 0 ? 'secondary-image' : ''}" onerror="this.style.display='none';" onload="window.mpApp.lastImageLoadTime = Date.now();">`;
            }).join('');

            // Mostrar SIEMPRE botón de galería si hay al menos 1 imagen
            const imagesPayload = JSON.stringify(product.images).replace(/"/g, '&quot;');
            galleryHtml += `<div class="view-all-images" onclick="window.mpApp.showImageGallery('${product.name}', ${imagesPayload})">
                <i class="fas fa-images"></i>
                <span>${product.images.length > 2 ? '+' + (product.images.length - 2) : this.t('view_all_images')}</span>
            </div>`;
            console.log('Modal: Botón de galería forzado con', product.images.length, 'imágenes');

            productGallery.innerHTML = galleryHtml;
        } else {
            productGallery.innerHTML = '<div class="gallery-placeholder"><i class="fas fa-cannabis"></i></div>';
        }

        // Configurar precios como botones seleccionables
        const prices = this.parsePrices(product.price);
        priceList.innerHTML = prices.map((price, index) => `
            <div class="price-option" data-price-index="${index}">
                <button class="price-button" data-quantity="${price.quantity}" data-amount="${price.amount}">
                    <span class="price-quantity">${price.quantity}</span>
                    <span class="price-amount">${price.amount}</span>
                </button>
            </div>
        `).join('');

        // Agregar event listeners a los botones de precio
        priceList.querySelectorAll('.price-button').forEach(button => {
            button.addEventListener('click', () => {
                // Remover selección anterior
                priceList.querySelectorAll('.price-button').forEach(btn => btn.classList.remove('selected'));
                // Seleccionar actual
                button.classList.add('selected');
                // Actualizar botón de agregar al carrito
                this.updateAddToCartButton(product, button.dataset.quantity, button.dataset.amount);
            });
        });

        // Seleccionar la primera opción por defecto y actualizar el botón
        if (prices.length > 0) {
            const firstButton = priceList.querySelector('.price-button');
            if (firstButton) {
                firstButton.classList.add('selected');
                this.updateAddToCartButton(product, firstButton.dataset.quantity, firstButton.dataset.amount);
            }
        }

        // Configurar stock
        const isAvailable = product.stock === 'Disponible' || product.stock === this.t('available');
        stockBadge.className = `stock-badge ${isAvailable ? 'stock-available' : 'stock-unavailable'}`;
        stockBadge.textContent = isAvailable ? this.t('available') : this.t('unavailable');

        // Configurar botón de agregar al carrito
        const addToCartBtn = document.getElementById('addToCartBtn');
        addToCartBtn.disabled = !isAvailable;
        addToCartBtn.onclick = () => {
            if (isAvailable) {
                this.addToCart(product);
                this.showToast(this.t('product_added'), 'success');
            }
        };

        this.showModal(modal);
    }

    updateAddToCartButton(product, selectedQuantity, selectedAmount) {
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (!addToCartBtn) return;

        // Calcular el precio total para esta variante
        const totalPrice = this.calculateTotalPrice(selectedQuantity, selectedAmount);

        // Actualizar el texto del botón para mostrar la variante seleccionada con precio total
        addToCartBtn.textContent = `${this.t('add')} ${selectedQuantity} ${this.t('for')} ${totalPrice}`;
        addToCartBtn.dataset.selectedQuantity = selectedQuantity;
        addToCartBtn.dataset.selectedAmount = selectedAmount;

        // Habilitar el botón
        addToCartBtn.disabled = false;
    }

    parsePrices(priceString) {
        // Parsear precios del formato "100@ / 320# | 300@ / 290#"
        const prices = [];
        // Permitir separadores con espacios variables alrededor de |
        const priceParts = priceString.split(/\s*\|\s*/);

        priceParts.forEach(part => {
            // Aceptar espacios entre número y unidad (p.ej. "2 Oz"), y símbolos como @, #, €
            const match = part.match(/(\d+\s*[a-zA-Z@#]*)\s*\/\s*(\d+[\.,]?\d*\s*[a-zA-Z@#€]*)/);
            if (match) {
                const quantity = match[1].replace(/\s+/g, ' ').trim();
                const pricePerUnit = match[2].replace(/\s+/g, ' ').trim();

                // Calcular precio total para esta cantidad
                const totalPrice = this.calculateTotalPrice(quantity, pricePerUnit);

                prices.push({
                    quantity: quantity,
                    amount: pricePerUnit,
                    totalPrice: totalPrice,
                    pricePerUnit: pricePerUnit,
                    pricePer100: pricePerUnit // Precio por cada 100@
                });
            }
        });

        return prices;
    }

    calculateTotalPrice(quantity, pricePerUnit) {
        // Extraer números de la cantidad y precio
        const quantityNum = this.extractNumber(quantity);
        const priceNum = this.extractNumber(pricePerUnit);

        if (quantityNum && priceNum) {
            // Verificar si la cantidad usa "@" (aplicar lógica de "por cada 100@")
            if (quantity.includes('@')) {
                // El precio es por cada 100@, así que calculamos cuántos grupos de 100@ hay
                const groupsOf100 = quantityNum / 100;
                const total = groupsOf100 * priceNum;
                return `${total}#`;
            } else {
                // Para otras unidades (ud, Oz, Qp, Hp, Lb, etc.), precio por unidad normal
                const total = quantityNum * priceNum;
                return `${total}#`;
            }
        }

        return pricePerUnit; // Fallback si no se puede calcular
    }

    extractNumber(str) {
        // Extraer número de strings como "100@", "320#", "1k@"
        const match = str.match(/(\d+)/);
        if (match) {
            let num = parseInt(match[1]);
            // Manejar "k" como miles
            if (str.toLowerCase().includes('k')) {
                num *= 1000;
            }
            return num;
        }
        return null;
    }

    findProductByName(name) {
        for (const category of Object.values(this.catalog.categories)) {
            const product = category.products.find(p => p.name === name);
            if (product) return product;
        }
        return null;
    }

    addToCart(product) {
        // Obtener la variante seleccionada del botón
        const addToCartBtn = document.getElementById('addToCartBtn');
        const selectedQuantity = addToCartBtn?.dataset.selectedQuantity || '1';
        const selectedAmount = addToCartBtn?.dataset.selectedAmount || product.price;

        // Calcular precio total para esta variante
        const totalPrice = this.calculateTotalPrice(selectedQuantity, selectedAmount);

        // Crear un ID único para esta variante específica
        const variantId = `${product.name}_${selectedQuantity}_${selectedAmount}`;

        const existingItem = this.cart.find(item => item.variantId === variantId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                variantId: variantId,
                name: product.name,
                price: product.price,
                selectedQuantity: selectedQuantity,
                selectedAmount: selectedAmount,
                totalPrice: totalPrice,
                pricePer100: selectedAmount, // Precio por cada 100@
                quantity: 1
            });
        }

        this.saveUserCart();
        this.updateCartUI();
    }

    removeFromCart(variantId) {
        console.log('Eliminando del carrito:', variantId);
        console.log('Carrito antes:', this.cart);

        this.cart = this.cart.filter(item => item.variantId !== variantId);

        console.log('Carrito después:', this.cart);

        this.saveUserCart();
        this.updateCartUI();

        // Recargar la vista del carrito si está abierto
        if (document.getElementById('cartModal').style.display !== 'none') {
            this.showCart();
        }
    }

    clearCart() {
        console.log('Limpiando carrito completo');
        this.cart = [];
        this.saveUserCart();
        this.updateCartUI();

        // Recargar la vista del carrito si está abierto
        if (document.getElementById('cartModal').style.display !== 'none') {
            this.showCart();
        }

        this.showToast(this.t('cart_cleared'), 'info');
    }

    setupProceedButtonFallback() {
        console.log('Configurando botón de proceder al pedido (fallback)');
        const proceedBtn = document.getElementById('proceedOrderBtn');
        if (proceedBtn) {
            // Remover event listeners anteriores
            proceedBtn.replaceWith(proceedBtn.cloneNode(true));
            const newProceedBtn = document.getElementById('proceedOrderBtn');

            newProceedBtn.addEventListener('click', () => {
                console.log('Botón proceder al pedido clickeado (fallback)');
                this.openTelegramChatFallback();
            });

            console.log('Event listener agregado al botón (fallback)');
        } else {
            console.error('No se encontró el botón proceedOrderBtn (fallback)');
        }
    }

    openTelegramChatFallback() {
        console.log('openTelegramChatFallback llamada');
        console.log('Carrito:', this.cart);

        if (this.cart.length === 0) {
            console.log('Carrito vacío, mostrando toast de error');
            this.showToast(this.t('cart_empty_error'), 'error');
            return;
        }

        try {
            // Generar mensaje de pedido para Telegram
            const orderMessage = this.generateCartMessageFallback();
            console.log('Mensaje generado:', orderMessage);

            // Crear URL de Telegram con el mensaje
            const telegramUrl = `https://t.me/grlltdc?text=${encodeURIComponent(orderMessage)}`;
            console.log('URL de Telegram:', telegramUrl);

            // Abrir chat de Telegram
            console.log('Abriendo ventana de Telegram...');
            window.open(telegramUrl, '_blank');

            // Mostrar mensaje de confirmación
            this.showToast(this.t('telegram_opened_success'), 'success');
            console.log('Chat de Telegram abierto exitosamente');

        } catch (error) {
            console.error('Error abriendo chat de Telegram:', error);
            this.showToast(this.t('telegram_error'), 'error');
        }
    }

    generateCartMessageFallback() {
        const cartItems = this.cart.map(item => {
            if (item.selectedQuantity && item.selectedAmount) {
                const totalPrice = item.totalPrice || item.selectedAmount;
                const unitText = item.selectedQuantity.includes('@') ? this.t('per_100') : this.t('per_unit');
                return `• ${item.name} (${item.selectedQuantity} ${this.t('for')} ${item.selectedAmount} ${unitText}) x${item.quantity} = ${totalPrice}`;
            } else {
                return `• ${item.name} x${item.quantity}`;
            }
        }).join('\n');

        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);

        return `🛒 NUEVO PEDIDO - MP Global Corp

🛍️ PRODUCTOS (${totalItems} items):
${cartItems}

📅 Fecha: ${new Date().toLocaleString(this.translationManager.getLocale())}

---
Enviado desde la Miniapp MP Global Corp`;
    }


    updateCartUI() {
        const cartCount = document.getElementById('cartCount');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }

    showCart() {
        const modal = document.getElementById('cartModal');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        // Configurar el botón de proceder al pedido
        console.log('showCart - OrderManager existe:', !!this.orderManager);
        if (this.orderManager) {
            console.log('Configurando botón de proceder al pedido...');
            this.orderManager.setupProceedButton();
        } else {
            console.error('OrderManager no está inicializado');
            // Fallback: configurar el botón directamente
            this.setupProceedButtonFallback();
        }

        if (this.cart.length === 0) {
            cartItems.innerHTML = `<p class="text-center">${this.t('cart_empty')}</p>`;
        } else {
            cartItems.innerHTML = this.cart.map((item, index) => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-variant">${item.selectedQuantity} ${this.t('for')} ${item.selectedAmount}</div>
                        <div class="cart-item-quantity">${this.t('quantity')}: ${item.quantity}</div>
                    </div>
                    <div class="cart-item-price">
                        <div class="price-per-unit">${item.selectedAmount} ${item.selectedQuantity.includes('@') ? this.t('per_100') : this.t('per_unit')}</div>
                        <div class="price-total">${item.totalPrice || item.selectedAmount} ${this.t('total')}</div>
                    </div>
                    <button class="cart-item-remove" data-variant-id="${item.variantId}" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');

            // Agregar event listeners a los botones de eliminar
            cartItems.querySelectorAll('.cart-item-remove').forEach(button => {
                button.addEventListener('click', (e) => {
                    const variantId = e.target.closest('button').dataset.variantId;
                    this.removeFromCart(variantId);
                });
            });
        }

        // Calcular total (simplificado)
        cartTotal.textContent = `${this.cart.length} ${this.t('products')}`;

        this.showModal(modal);
    }

    showModal(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    toggleMobileMenu() {
        const navigation = document.getElementById('navigation');
        if (navigation) {
            navigation.classList.toggle('show');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        loading.style.display = 'none';
    }

    showError(message) {
        console.error(message);
        // Implementar notificación de error
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle toast-icon"></i>
                <span class="toast-message">${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    // Image Zoom Functionality
    setupImageZoom() {
        // Zoom state
        this.zoomState = {
            scale: 1,
            rotation: 0,
            isDragging: false,
            startX: 0,
            startY: 0,
            translateX: 0,
            translateY: 0
        };

        // Setup image click listeners
        this.setupImageClickListeners();

        // Setup zoom controls
        this.setupZoomControls();
    }

    setupImageClickListeners() {
        // Add click listeners to all images
        document.addEventListener('click', (e) => {
            // Solo activar zoom si el usuario hace clic explícitamente en la imagen
            // y no es un clic automático o de carga
            if ((e.target.classList.contains('gallery-image') ||
                (e.target.classList.contains('product-image') && e.target.tagName === 'IMG')) &&
                e.type === 'click' && e.isTrusted && e.detail > 0) {

                // Verificar que no sea un clic automático durante la carga
                if (e.timeStamp - this.lastImageLoadTime < 1000) {
                    console.log('🔍 DEBUG: Ignorando clic automático durante carga de imagen');
                    return;
                }

                e.preventDefault();
                e.stopPropagation();
                this.openImageZoom(e.target.src, e.target.alt);
            }
        });
    }

    setupZoomControls() {
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const zoomResetBtn = document.getElementById('zoomResetBtn');
        const zoomRotateBtn = document.getElementById('zoomRotateBtn');
        const closeBtn = document.getElementById('closeImageZoomModal');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', () => this.zoomReset());
        }
        if (zoomRotateBtn) {
            zoomRotateBtn.addEventListener('click', () => this.zoomRotate());
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeImageZoom());
        }
    }

    openImageZoom(imageSrc, imageAlt) {
        const modal = document.getElementById('imageZoomModal');
        const zoomImage = document.getElementById('zoomImage');
        const zoomImageTitle = document.getElementById('zoomImageTitle');

        if (modal && zoomImage) {
            zoomImage.src = imageSrc;
            zoomImage.alt = imageAlt;
            zoomImageTitle.textContent = imageAlt || this.t('image_zoom');

            // Reset zoom state
            this.zoomState = {
                scale: 1,
                rotation: 0,
                isDragging: false,
                startX: 0,
                startY: 0,
                translateX: 0,
                translateY: 0
            };

            this.updateZoomImage();
            this.showModal(modal);

            // Setup drag functionality
            this.setupImageDrag();
        }
    }

    closeImageZoom() {
        const modal = document.getElementById('imageZoomModal');
        if (modal) {
            this.hideModal(modal);
        }
    }

    setupImageDrag() {
        const zoomImage = document.getElementById('zoomImage');
        if (!zoomImage) return;

        zoomImage.addEventListener('mousedown', (e) => {
            if (this.zoomState.scale > 1) {
                this.zoomState.isDragging = true;
                this.zoomState.startX = e.clientX - this.zoomState.translateX;
                this.zoomState.startY = e.clientY - this.zoomState.translateY;
                zoomImage.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.zoomState.isDragging) {
                this.zoomState.translateX = e.clientX - this.zoomState.startX;
                this.zoomState.translateY = e.clientY - this.zoomState.startY;
                this.updateZoomImage();
            }
        });

        document.addEventListener('mouseup', () => {
            this.zoomState.isDragging = false;
            if (zoomImage) {
                zoomImage.style.cursor = this.zoomState.scale > 1 ? 'grab' : 'default';
            }
        });

        // Touch support
        zoomImage.addEventListener('touchstart', (e) => {
            if (this.zoomState.scale > 1 && e.touches.length === 1) {
                this.zoomState.isDragging = true;
                this.zoomState.startX = e.touches[0].clientX - this.zoomState.translateX;
                this.zoomState.startY = e.touches[0].clientY - this.zoomState.translateY;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (this.zoomState.isDragging && e.touches.length === 1) {
                e.preventDefault();
                this.zoomState.translateX = e.touches[0].clientX - this.zoomState.startX;
                this.zoomState.translateY = e.touches[0].clientY - this.zoomState.startY;
                this.updateZoomImage();
            }
        });

        document.addEventListener('touchend', () => {
            this.zoomState.isDragging = false;
        });
    }

    zoomIn() {
        this.zoomState.scale = Math.min(this.zoomState.scale * 1.2, 5);
        this.updateZoomImage();
    }

    zoomOut() {
        this.zoomState.scale = Math.max(this.zoomState.scale / 1.2, 0.5);
        this.updateZoomImage();
    }

    zoomReset() {
        this.zoomState.scale = 1;
        this.zoomState.rotation = 0;
        this.zoomState.translateX = 0;
        this.zoomState.translateY = 0;
        this.updateZoomImage();
    }

    zoomRotate() {
        this.zoomState.rotation = (this.zoomState.rotation + 90) % 360;
        this.updateZoomImage();
    }

    updateZoomImage() {
        const zoomImage = document.getElementById('zoomImage');
        if (!zoomImage) return;

        const transform = `scale(${this.zoomState.scale}) rotate(${this.zoomState.rotation}deg) translate(${this.zoomState.translateX}px, ${this.zoomState.translateY}px)`;
        zoomImage.style.transform = transform;

        // Update cursor
        zoomImage.style.cursor = this.zoomState.scale > 1 ? 'grab' : 'default';
    }

    // Security & Privacy Functionality
    setupSecurity() {
        // Security modal button
        const securityBtn = document.getElementById('securityBtn');
        if (securityBtn) {
            securityBtn.addEventListener('click', () => this.showSecurityModal());
        }

        // Security modal close buttons
        const closeSecurityModal = document.getElementById('closeSecurityModal');
        const closeSecurityModalBtn = document.getElementById('closeSecurityModalBtn');

        if (closeSecurityModal) {
            closeSecurityModal.addEventListener('click', () => this.hideSecurityModal());
        }
        if (closeSecurityModalBtn) {
            closeSecurityModalBtn.addEventListener('click', () => this.hideSecurityModal());
        }

        // Clear all data button
        const clearAllDataBtn = document.getElementById('clearAllDataBtn');
        if (clearAllDataBtn) {
            clearAllDataBtn.addEventListener('click', () => this.clearAllData());
        }
    }

    showSecurityModal() {
        const modal = document.getElementById('securityModal');
        if (modal) {
            this.showModal(modal);
        }
    }

    hideSecurityModal() {
        const modal = document.getElementById('securityModal');
        if (modal) {
            this.hideModal(modal);
        }
    }

    clearAllData() {
        if (confirm(this.t('confirm_clear_all_data'))) {
            try {
                // Clear all localStorage data
                localStorage.clear();

                // Reset app state
                this.cart = [];
                this.currentCategory = 'all';
                this.searchTerm = '';

                // Update UI
                this.updateCartUI();
                this.renderProducts();

                // Show success message
                this.showToast(this.t('data_cleared'), 'success');

                // Close security modal
                this.hideSecurityModal();

                console.log('All data cleared successfully');
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showToast(this.t('data_clear_error'), 'error');
            }
        }
    }

    // Language Selection Functionality
    setupLanguageSelection() {
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            // Establecer idioma actual
            languageSelect.value = this.translationManager.currentLanguage;

            // Actualizar UI inicial
            this.translationManager.updateUI();

            // Escuchar cambios de idioma
            languageSelect.addEventListener('change', (e) => {
                this.translationManager.setLanguage(e.target.value);
                this.showToast(`${this.t('language_changed')} ${this.translationManager.getLanguageName(e.target.value)}`, 'info');
                // Recargar para asegurar que todo el contenido refleje el idioma
                setTimeout(() => {
                    if (window.Telegram && window.Telegram.WebApp) {
                        // En el contexto de miniapps, usar close/reloadAnimation puede ser intrusivo;
                        // preferimos recargar la vista si está embebida en web.
                    }
                    window.location.reload();
                }, 300);
            });
        }
    }

    // Función helper para obtener traducciones
    t(key) {
        return this.translationManager.t(key);
    }

    // ==================== FUNCIONALIDAD DE CATEGORÍAS ====================

    showCategory(categoryKey) {
        /* Mostrar una categoría específica */
        try {
            console.log(`🔍 DEBUG: showCategory - Mostrando categoría: ${categoryKey}`);

            // Actualizar categoría actual
            this.currentCategory = categoryKey;
            this.searchTerm = ''; // Limpiar búsqueda

            if (categoryKey === 'all') {
                this.showAllProducts();
            } else {
                this.showProductsByCategory(categoryKey);
            }

            // Actualizar botones activos
            this.updateActiveButtons(categoryKey, 'category');

        } catch (error) {
            console.error(`❌ Error mostrando categoría ${categoryKey}:`, error);
        }
    }

    showAllProducts() {
        /* Mostrar todos los productos */
        try {
            console.log('🔍 DEBUG: Mostrando todos los productos');

            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = '<div class="products-grid" id="productsGrid"></div>';
                this.renderProducts();
            }

        } catch (error) {
            console.error('❌ Error mostrando todos los productos:', error);
        }
    }

    showProductsByCategory(categoryKey) {
        /* Mostrar productos de una categoría específica */
        try {
            console.log(`🔍 DEBUG: Mostrando productos de categoría: ${categoryKey}`);

            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = '<div class="products-grid" id="productsGrid"></div>';
                // currentCategory ya fue actualizado en showCategory()
                this.renderProducts();
            }

        } catch (error) {
            console.error(`❌ Error mostrando productos de categoría ${categoryKey}:`, error);
        }
    }

    // ==================== FUNCIONALIDAD DE SECCIONES ====================

    async showSection(sectionKey) {
        /* Mostrar una sección específica como página */
        try {
            console.log(`🔍 DEBUG: showSection - INICIANDO para sección: ${sectionKey}`);
            console.log(`🔍 DEBUG: showSection - this.catalog:`, this.catalog);

            // Obtener secciones
            console.log(`🔍 DEBUG: showSection - Llamando a loadSections()...`);
            const sections = await this.loadSections();
            console.log(`🔍 DEBUG: showSection - Secciones obtenidas:`, Object.keys(sections));

            const section = sections[sectionKey];
            console.log(`🔍 DEBUG: showSection - Sección específica:`, section);

            if (!section) {
                console.error(`❌ Sección ${sectionKey} no encontrada en:`, Object.keys(sections));
                this.showError(`Sección ${sectionKey} no encontrada`);
                return;
            }

            // Crear contenido de la sección
            const content = this.formatSectionContent(section.content || section);
            console.log(`🔍 DEBUG: showSection - Contenido formateado:`, content.substring(0, 100) + '...');

            // Mostrar como página en el área principal
            const mainContent = document.querySelector('.main-content');
            console.log(`🔍 DEBUG: showSection - mainContent encontrado:`, !!mainContent);

            if (mainContent) {
                // Ocultar elementos de productos
                const productsContainer = document.getElementById('productsContainer');
                const emptyState = document.getElementById('emptyState');

                console.log(`🔍 DEBUG: showSection - Ocultando elementos de productos...`);
                if (productsContainer) {
                    productsContainer.style.display = 'none';
                    console.log(`🔍 DEBUG: showSection - productsContainer ocultado`);
                }
                if (emptyState) {
                    emptyState.style.display = 'none';
                    console.log(`🔍 DEBUG: showSection - emptyState ocultado`);
                }

                // Crear página de sección
                console.log(`🔍 DEBUG: showSection - Creando página de sección...`);
                mainContent.innerHTML = `
                    <div class="section-page">
                        <div class="section-header">
                            <button class="back-btn" onclick="app.showMainView()">
                                <i class="fas fa-arrow-left"></i>
                                <span data-i18n="back">Volver</span>
                            </button>
                            <h1 class="section-title">
                                <i class="fas fa-info-circle"></i>
                                ${section.title || sectionKey}
                            </h1>
                        </div>
                        <div class="section-content">
                            ${content}
                        </div>
                    </div>
                `;

                console.log(`🔍 DEBUG: showSection - Página creada, actualizando botones activos...`);

                // Actualizar botones activos
                this.updateActiveButtons(sectionKey, 'section');

                console.log(`✅ Sección ${sectionKey} mostrada como página correctamente`);
            } else {
                console.error('❌ Elemento .main-content no encontrado');
                this.showError('Error: Área principal no disponible');
            }

        } catch (error) {
            console.error(`❌ Error mostrando sección ${sectionKey}:`, error);
            this.showError(`Error mostrando sección: ${error.message}`);
        }
    }

    showMainView() {
        /* Regresar a la vista principal de productos */
        try {
            console.log('🔍 DEBUG: showMainView - Regresando a vista principal');

            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                // Restaurar elementos de productos
                const productsContainer = document.getElementById('productsContainer');
                const emptyState = document.getElementById('emptyState');

                if (productsContainer) productsContainer.style.display = 'block';
                if (emptyState) emptyState.style.display = 'none';

                // Restaurar contenido original
                mainContent.innerHTML = `
                    <div class="products-container" id="productsContainer">
                        <div class="products-grid" id="productsGrid">
                            <!-- Los productos se cargarán dinámicamente aquí -->
                        </div>
                    </div>
                    <div class="empty-state" id="emptyState" style="display: none;">
                        <i class="fas fa-search"></i>
                        <h3 data-i18n="no_products_found">No se encontraron productos</h3>
                        <p data-i18n="try_different_terms">Intenta con otros términos de búsqueda</p>
                    </div>
                `;

                // Renderizar productos actuales
                this.renderProducts();

                // Actualizar botones activos (categoría actual)
                this.updateActiveButtons(this.currentCategory, 'category');

                console.log('✅ Vista principal restaurada correctamente');
            } else {
                console.error('❌ Elemento .main-content no encontrado');
            }
        } catch (error) {
            console.error('❌ Error restaurando vista principal:', error);
        }
    }

    updateActiveButtons(activeKey, type) {
        /* Actualizar botones activos en el menú */
        try {
            // Remover clase active de todos los botones
            const allButtons = document.querySelectorAll('.tab-btn');
            allButtons.forEach(btn => btn.classList.remove('active'));

            // Añadir clase active al botón correspondiente
            if (type === 'category') {
                const activeButton = document.querySelector(`[data-category="${activeKey}"]`);
                if (activeButton) activeButton.classList.add('active');
            } else if (type === 'section') {
                const activeButton = document.querySelector(`[data-section="${activeKey}"]`);
                if (activeButton) activeButton.classList.add('active');
            }

        } catch (error) {
            console.error('❌ Error actualizando botones activos:', error);
        }
    }

    async loadSections() {
        /* Cargar secciones de información desde la API */
        try {
            console.log('🔍 DEBUG: loadSections - Iniciando...');
            console.log('🔍 DEBUG: loadSections - this.catalog:', this.catalog);
            console.log('🔍 DEBUG: loadSections - this.catalog.sections:', this.catalog?.sections);

            // Primero intentar usar las secciones del catálogo cargado
            if (this.catalog && this.catalog.sections && Object.keys(this.catalog.sections).length > 0) {
                console.log('✅ Usando secciones del catálogo cargado');
                console.log('🔍 DEBUG: Secciones del catálogo:', Object.keys(this.catalog.sections));
                return this.catalog.sections;
            }

            // Si no hay secciones en el catálogo, hacer llamada a la API
            console.log('🔍 DEBUG: No hay secciones en el catálogo, llamando a la API...');

            const apiUrls = [
                'https://mp-bot-miniapp.onrender.com/api/sections',
                'http://localhost:5000/api/sections'
            ];

            for (const url of apiUrls) {
                try {
                    console.log(`🔍 DEBUG: Intentando cargar secciones desde: ${url}`);
                    const response = await fetch(url);

                    if (!response.ok) {
                        console.warn(`⚠️ Error HTTP ${response.status} desde ${url}`);
                        continue;
                    }

                    const result = await response.json();
                    if (result.success && result.data) {
                        console.log('✅ Secciones cargadas desde API:', Object.keys(result.data));

                        // Actualizar el catálogo con las secciones
                        if (this.catalog) {
                            this.catalog.sections = result.data;
                        }

                        return result.data;
                    } else {
                        console.warn(`⚠️ Respuesta inválida desde ${url}:`, result);
                    }
                } catch (e) {
                    console.warn(`⚠️ Error cargando secciones desde ${url}:`, e.message);
                }
            }

            console.log('⚠️ No se pudieron cargar secciones desde ninguna fuente, usando fallback');
            console.log('🔍 DEBUG: loadSections - this.catalog después de intentar API:', this.catalog);
            console.log('🔍 DEBUG: loadSections - this.catalog.sections después de intentar API:', this.catalog?.sections);

            // Fallback: secciones por defecto si la API no está disponible
            const fallbackSections = {
                'shipping': {
                    title: '🚚 Envíos y Pagos',
                    content: `
                        <h2>Información de Envíos</h2>
                        <p>Realizamos envíos a toda España con las siguientes opciones:</p>
                        <ul>
                            <li><strong>Envío Estándar:</strong> 3-5 días laborables - 5€</li>
                            <li><strong>Envío Express:</strong> 1-2 días laborables - 10€</li>
                            <li><strong>Envío Gratis:</strong> Pedidos superiores a 100€</li>
                        </ul>

                        <h2>Métodos de Pago</h2>
                        <p>Aceptamos los siguientes métodos de pago:</p>
                        <ul>
                            <li>Transferencia bancaria</li>
                            <li>Bizum</li>
                            <li>Criptomonedas (Bitcoin, Ethereum)</li>
                            <li>Pago contra reembolso (+3€)</li>
                        </ul>
                    `
                },
                'stock': {
                    title: '📦 Estado del Stock',
                    content: `
                        <h2>Disponibilidad en Tiempo Real</h2>
                        <p>Nuestro stock se actualiza constantemente. Aquí puedes ver el estado actual de nuestros productos:</p>

                        <h3>Disponibilidad por Categoría</h3>
                        <ul>
                            <li><strong>Moroccan Hash:</strong> Stock completo</li>
                            <li><strong>Spanish Flower:</strong> Stock limitado</li>
                            <li><strong>California Flower:</strong> Stock completo</li>
                            <li><strong>Extractions:</strong> Stock variable</li>
                            <li><strong>Otros:</strong> Stock completo</li>
                        </ul>
                    `
                },
                'contact': {
                    title: '📞 Información de Contacto',
                    content: `
                        <h2>Contacta con Nosotros</h2>
                        <p>Estamos aquí para ayudarte con cualquier consulta sobre nuestros productos o servicios.</p>

                        <h3>Horarios de Atención</h3>
                        <ul>
                            <li><strong>Lunes a Viernes:</strong> 10:00 - 20:00</li>
                            <li><strong>Sábados:</strong> 10:00 - 18:00</li>
                            <li><strong>Domingos:</strong> Cerrado</li>
                        </ul>

                        <h3>Canales de Contacto</h3>
                        <ul>
                            <li><strong>Telegram:</strong> @mpglobalcorp_bot</li>
                            <li><strong>Email:</strong> info@mpglobalcorp.com</li>
                            <li><strong>WhatsApp:</strong> +34 600 123 456</li>
                        </ul>
                    `
                }
            };

            // Actualizar el catálogo con las secciones de fallback
            if (this.catalog) {
                this.catalog.sections = fallbackSections;
            }

            return fallbackSections;
        } catch (error) {
            console.error('❌ Error general cargando secciones:', error);
            return {};
        }
    }

    async showInformationModal() {
        /* Mostrar modal de información con secciones dinámicas */
        try {
            console.log('🔍 DEBUG: showInformationModal - Iniciando...');

            const modal = document.getElementById('informationModal');
            const content = document.getElementById('informationContent');
            const loading = document.getElementById('infoLoading');

            console.log('🔍 DEBUG: Elementos del modal encontrados:', {
                modal: !!modal,
                content: !!content,
                loading: !!loading
            });

            // Mostrar modal y loading
            modal.style.display = 'flex';
            loading.style.display = 'block';
            content.innerHTML = '';

            // Cargar secciones
            console.log('🔍 DEBUG: Cargando secciones...');
            const sections = await this.loadSections();
            console.log('🔍 DEBUG: Secciones cargadas:', sections);
            console.log('🔍 DEBUG: Número de secciones:', Object.keys(sections).length);

            // Ocultar loading
            loading.style.display = 'none';

            if (Object.keys(sections).length === 0) {
                content.innerHTML = `
                    <div class="information-section">
                        <h3><i class="fas fa-info-circle"></i> Información</h3>
                        <div class="section-content">
                            <p>No hay información disponible en este momento.</p>
                        </div>
                    </div>
                `;
                return;
            }

            // Renderizar secciones
            let sectionsHtml = '';
            for (const [sectionKey, sectionData] of Object.entries(sections)) {
                const title = sectionData.title || 'Sin título';
                const content_text = sectionData.content || 'Sin contenido';

                sectionsHtml += `
                    <div class="information-section">
                        <h3><i class="fas fa-info-circle"></i> ${title}</h3>
                        <div class="section-content">
                            ${this.formatSectionContent(content_text)}
                        </div>
                    </div>
                `;
            }

            content.innerHTML = sectionsHtml;

        } catch (error) {
            console.error('Error mostrando modal de información:', error);
            const content = document.getElementById('informationContent');
            const loading = document.getElementById('infoLoading');
            loading.style.display = 'none';
            content.innerHTML = `
                <div class="information-section">
                    <h3><i class="fas fa-exclamation-triangle"></i> Error</h3>
                    <div class="section-content">
                        <p>Error cargando la información. Inténtalo de nuevo más tarde.</p>
                    </div>
                </div>
            `;
        }
    }

    formatSectionContent(content) {
        /* Formatear contenido de sección para HTML */
        if (!content) return '<p>Sin contenido</p>';

        // Asegurar que content es un string
        const contentStr = typeof content === 'string' ? content : String(content);

        // Convertir saltos de línea a <br>
        let formatted = contentStr.replace(/\n/g, '<br>');

        // Convertir listas con • a <ul>
        formatted = formatted.replace(/(•[^<]*<br>)+/g, (match) => {
            const items = match.split('<br>').filter(item => item.trim());
            const listItems = items.map(item =>
                `<li>${item.replace('•', '').trim()}</li>`
            ).join('');
            return `<ul>${listItems}</ul>`;
        });

        // Convertir listas con - a <ul>
        formatted = formatted.replace(/(-[^<]*<br>)+/g, (match) => {
            const items = match.split('<br>').filter(item => item.trim());
            const listItems = items.map(item =>
                `<li>${item.replace('-', '').trim()}</li>`
            ).join('');
            return `<ul>${listItems}</ul>`;
        });

        return `<p>${formatted}</p>`;
    }

    setupInformationModal() {
        /* Configurar eventos del modal de información - YA NO SE USA */
        // El modal de información se eliminó, las secciones ahora se muestran en el menú hamburguesa
        console.log('ℹ️ Modal de información deshabilitado - secciones en menú hamburguesa');
    }
}

// Función global para mostrar galería de medios
function showMediaGallery(productName, mediaItems) {
    if (window.mpApp) {
        window.mpApp.showMediaGallery(productName, mediaItems);
    } else {
        console.error('MP App no está disponible');
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MPApp();
    window.mpApp = window.app; // Alias para compatibilidad
});
