// Aplicación principal de la miniapp MP Global Corp
class MPApp {
    constructor() {
        this.catalog = null;
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.lastImageLoadTime = 0;

        // Inicializar sistema de traducciones
        this.translationManager = new TranslationManager();

        // Obtener ID de usuario de Telegram
        this.userId = this.getTelegramUserId();
        console.log('User ID:', this.userId);

        // Mostrar información del usuario para debug
        this.logUserInfo();

        // Cargar carrito específico del usuario
        this.cart = this.loadUserCart();

        this.init();
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

    async init() {
        try {
            await this.loadCatalog();
            this.setupEventListeners();
            this.renderProducts();
            this.updateCartUI();
            // Aplicar traducciones iniciales
            this.translationManager.updateUI();

            // Inicializar gestor de pedidos
            console.log('Inicializando OrderManager...');
            this.orderManager = new OrderManager(this);
            console.log('OrderManager inicializado:', this.orderManager);

            this.hideLoading();
        } catch (error) {
            console.error('Error inicializando la app:', error);
            this.showError(this.t('error_loading_catalog'));
        }
    }

    async loadCatalog() {
        try {
            // Intentar cargar desde la API del bot primero
            const botApiUrl = 'https://mp-bot-wtcf.onrender.com/api/catalog';
            const response = await fetch(botApiUrl);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.catalog = result.data;
                    console.log('✅ Catálogo cargado desde la API del bot');
                    // Convertir imágenes después de cargar el catálogo
                    this.convertCatalogImages();
                    // Actualizar visualización de categorías
                    this.updateCategoryDisplay();
                } else {
                    throw new Error(result.error);
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn('Error cargando desde API del bot, intentando fallback:', error);
            try {
                // Fallback: cargar desde archivo JSON local
                const response = await fetch('data/catalog.json');
                if (response.ok) {
                    this.catalog = await response.json();
                    console.log('✅ Catálogo cargado desde archivo local');
                    // Convertir imágenes después de cargar el catálogo
                    this.convertCatalogImages();
                    // Actualizar visualización de categorías
                    this.updateCategoryDisplay();
                } else {
                    throw new Error('Archivo local no encontrado');
                }
            } catch (fallbackError) {
                console.warn('Error en fallback, usando datos hardcodeados:', fallbackError);
                this.catalog = this.getFallbackCatalog();
                // Convertir imágenes después de cargar el catálogo
                this.convertCatalogImages();
                // Actualizar visualización de categorías
                this.updateCategoryDisplay();
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

    updateCategoryDisplay() {
        // Actualizar la visualización de categorías dinámicamente
        try {
            console.log('🔄 Actualizando visualización de categorías...');

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
            } else {
                console.warn('⚠️ No se encontró el elemento .category-tabs');
            }

            console.log('✅ Visualización de categorías actualizada');
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
        // Navegación por categorías
        document.querySelectorAll('.tab-btn').forEach(btn => {
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
    }

    setActiveCategory(category) {
        this.currentCategory = category;

        // Actualizar botones de categoría
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

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
            // Intentar búsqueda en la API del bot primero
            const botApiUrl = `https://mp-bot-wtcf.onrender.com/api/products/search?q=${encodeURIComponent(this.searchTerm)}`;
            const response = await fetch(botApiUrl);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.searchResults = result.data;
                    this.renderSearchResults();
                    return;
                } else {
                    console.error('Error en búsqueda API:', result.error);
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
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
                <p>Buscando productos...</p>
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
                    <h3>No se encontraron productos</h3>
                    <p>No hay productos que coincidan con "${this.searchTerm}"</p>
                    <p>Intenta con otros términos de búsqueda</p>
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
        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');

        if (!this.catalog) {
            productsGrid.innerHTML = `<p>${this.t('error_loading_catalog')}</p>`;
            return;
        }

        let products = [];

        // Obtener productos según la categoría seleccionada
        if (this.currentCategory === 'all') {
            Object.values(this.catalog.categories).forEach(category => {
                products = products.concat(category.products);
            });
        } else {
            const category = this.catalog.categories[this.currentCategory];
            if (category) {
                products = category.products;
            }
        }

        // Filtrar por término de búsqueda
        if (this.searchTerm) {
            products = products.filter(product =>
                product.name.toLowerCase().includes(this.searchTerm) ||
                product.description.toLowerCase().includes(this.searchTerm)
            );
        }

        // Renderizar productos
        if (products.length === 0) {
            productsGrid.innerHTML = '';
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            productsGrid.innerHTML = products.map(product => this.createProductCard(product)).join('');

            // Agregar event listeners a las tarjetas de productos
            productsGrid.querySelectorAll('.product-card').forEach(card => {
                card.addEventListener('click', () => {
                    const productName = card.dataset.productName;
                    this.showProductModal(productName);
                });
            });
        }
    }

    createProductCard(product) {
        console.log('createProductCard called for:', product.name, 'with images:', product.images);
        console.log('Number of images:', product.images ? product.images.length : 0);

        const isAvailable = product.stock === 'Disponible' || product.stock === this.t('available');
        const categoryClass = this.getCategoryClass(this.currentCategory);

        let imageHtml = '';
        let galleryButton = '';

        if (product.images && product.images.length > 0) {
            // Mostrar máximo 2 imágenes
            const maxImages = Math.min(2, product.images.length);
            const images = product.images.slice(0, maxImages);

            imageHtml = images.map((image, index) => {
                const imageUrl = this.getImageUrl(image);
                console.log(`Generated image URL ${index + 1}:`, imageUrl);
                this.lastImageLoadTime = Date.now();
                return `<img src="${imageUrl}" alt="${product.name}" class="gallery-image ${index > 0 ? 'secondary-image' : ''}" onload="console.log('Image loaded:', this.src); window.mpApp.lastImageLoadTime = Date.now();" onerror="console.log('Image error:', this.src); this.style.display='none';">`;
            }).join('');

            // Si hay más de 2 imágenes, crear botón para ver todas (se mostrará entre imágenes y precio)
            console.log('Checking if should show gallery button. Images count:', product.images.length);
            if (product.images.length > 2) {
                console.log('Adding gallery button for product:', product.name);
                galleryButton = `<div class="gallery-button-container">
                    <button class="gallery-button" onclick="window.mpApp.showImageGallery('${product.name}', ${JSON.stringify(product.images).replace(/"/g, '&quot;')})">
                        <i class="fas fa-images"></i>
                        <span>Ver galería (+${product.images.length - 2} más)</span>
                    </button>
                </div>`;
            } else {
                console.log('Not adding gallery button. Only', product.images.length, 'images');
            }
        }

        return `
            <div class="product-card fade-in" data-product-name="${product.name}">
                <div class="category-indicator ${categoryClass}">
                    ${this.getCategoryIcon(this.currentCategory)}
                </div>
                <div class="product-image">
                    ${imageHtml}
                    <div class="image-placeholder" style="display: ${product.images && product.images.length > 0 ? 'none' : 'flex'};">
                        <i class="fas fa-cannabis"></i>
                    </div>
                </div>
                ${galleryButton}
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${product.price}</p>
                    <span class="product-stock ${isAvailable ? 'stock-available' : 'stock-unavailable'}">
                        ${isAvailable ? this.t('available') : this.t('unavailable')}
                    </span>
                </div>
            </div>
        `;
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
            const apiUrl = `/api/image/${imagePath}`;
            console.log('Using database image:', imagePath, '->', apiUrl);
            return apiUrl;
        }

        // Si es una ruta relativa que empieza con 'img/', convertir a la ruta correcta
        if (imagePath.startsWith('img/')) {
            const newPath = `assets/images/${imagePath}`;
            console.log('Converting img/ path:', imagePath, '->', newPath);
            return newPath;
        }

        // Si parece ser un file_id de Telegram, intentar construir la URL
        if (imagePath.length > 20 && !imagePath.includes('/') && !imagePath.includes('\\')) {
            // Esto podría ser un file_id, pero no tenemos el token aquí
            // Devolver un placeholder por ahora
            console.log('Detected potential file_id, using placeholder:', imagePath);
            return this.getPlaceholderImage();
        }

        // Para otros casos, intentar usar la imagen directamente
        console.log('Using path as-is:', imagePath);
        return imagePath;
    }

    showImageGallery(productName, images) {
        console.log('showImageGallery called for:', productName, 'with', images.length, 'images');

        // Crear modal para galería de imágenes
        const modal = document.createElement('div');
        modal.className = 'image-gallery-modal';
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

        // Añadir estilos si no existen
        if (!document.getElementById('gallery-styles')) {
            const styles = document.createElement('style');
            styles.id = 'gallery-styles';
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
        const product = this.findProductByName(productName);
        if (!product) return;

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
            this.lastImageLoadTime = Date.now();

            // Mostrar máximo 2 imágenes en el modal
            const maxImages = Math.min(2, product.images.length);
            const images = product.images.slice(0, maxImages);

            let galleryHtml = images.map((image, index) => {
                const imageUrl = this.getImageUrl(image);
                return `<img src="${imageUrl}" alt="${product.name}" class="gallery-image ${index > 0 ? 'secondary-image' : ''}" onerror="this.style.display='none';" onload="window.mpApp.lastImageLoadTime = Date.now();">`;
            }).join('');

            // Si hay más de 2 imágenes, añadir botón para ver todas
            if (product.images.length > 2) {
                galleryHtml += `<div class="view-all-images" onclick="window.mpApp.showImageGallery('${product.name}', ${JSON.stringify(product.images).replace(/"/g, '&quot;')})">
                    <i class="fas fa-images"></i>
                    <span>+${product.images.length - 2}</span>
                </div>`;
            }

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
        const priceParts = priceString.split(' | ');

        priceParts.forEach(part => {
            const match = part.match(/(\d+[a-zA-Z@#]*)\s*\/\s*(\d+[a-zA-Z@#]*)/);
            if (match) {
                const quantity = match[1].trim();
                const pricePerUnit = match[2].trim();

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

        this.showToast('Carrito limpiado', 'info');
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
        if (confirm('¿Estás seguro de que quieres eliminar todos los datos locales? Esto incluye tu carrito y preferencias.')) {
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
                this.showToast('Todos los datos han sido eliminados', 'success');

                // Close security modal
                this.hideSecurityModal();

                console.log('All data cleared successfully');
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showToast('Error al eliminar los datos', 'error');
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
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MPApp();
    window.mpApp = window.app; // Alias para compatibilidad
});
