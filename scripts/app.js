// Aplicación principal de la miniapp MP Global Corp
class MPApp {
    constructor() {
        this.catalog = null;
        this.cart = JSON.parse(localStorage.getItem('mp_cart')) || [];
        this.currentCategory = 'all';
        this.searchTerm = '';
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadCatalog();
            this.setupEventListeners();
            this.renderProducts();
            this.updateCartUI();
            this.hideLoading();
        } catch (error) {
            console.error('Error inicializando la app:', error);
            this.showError('Error cargando el catálogo');
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
                } else {
                    throw new Error('Archivo local no encontrado');
                }
            } catch (fallbackError) {
                console.warn('Error en fallback, usando datos hardcodeados:', fallbackError);
                this.catalog = this.getFallbackCatalog();
            }
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
        
        // Carrito
        document.getElementById('cartBtn').addEventListener('click', () => {
            this.showCart();
        });
        
        // Menú móvil
        document.getElementById('menuToggle').addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        // Modales
        this.setupModalListeners();
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
        
        // Renderizar productos
        this.renderProducts();
    }
    
    async performSearch() {
        if (!this.searchTerm) {
            this.renderProducts();
            return;
        }
        
        try {
            const botApiUrl = `https://mp-bot-wtcf.onrender.com/api/products/search?q=${encodeURIComponent(this.searchTerm)}`;
            const response = await fetch(botApiUrl);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.searchResults = result.data;
                    this.renderSearchResults();
                } else {
                    console.error('Error en búsqueda:', result.error);
                    this.renderProducts();
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn('Error en búsqueda API, usando búsqueda local:', error);
            this.renderProducts();
        }
    }
    
    renderSearchResults() {
        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (this.searchResults.length === 0) {
            productsGrid.innerHTML = '';
            emptyState.style.display = 'block';
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
            productsGrid.innerHTML = '<p>Error cargando productos</p>';
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
        const isAvailable = product.stock === 'Disponible';
        const categoryClass = this.getCategoryClass(this.currentCategory);
        
        return `
            <div class="product-card fade-in" data-product-name="${product.name}">
                <div class="category-indicator ${categoryClass}">
                    ${this.getCategoryIcon(this.currentCategory)}
                </div>
                <div class="product-image">
                    ${product.images && product.images.length > 0 
                        ? `<img src="${this.getImageUrl(product.images[0])}" alt="${product.name}" class="gallery-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                        : ''
                    }
                    <div class="image-placeholder" style="display: ${product.images && product.images.length > 0 ? 'none' : 'flex'};">
                        <i class="fas fa-cannabis"></i>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${product.price}</p>
                    <span class="product-stock ${isAvailable ? 'stock-available' : 'stock-unavailable'}">
                        ${isAvailable ? 'Disponible' : 'No Disponible'}
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
        // Si la imagen es una URL completa, usarla directamente
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // Si es una ruta relativa que empieza con 'img/', usar placeholder
        if (imagePath.startsWith('img/')) {
            // Por ahora, usar un placeholder genérico
            // En el futuro se puede configurar un servidor de imágenes
            return this.getPlaceholderImage();
        }
        
        // Para otros casos, intentar usar la imagen directamente
        return imagePath;
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
        
        return placeholders[this.currentCategory] || placeholders['varios'];
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
            productGallery.innerHTML = product.images.map(img => 
                `<img src="${this.getImageUrl(img)}" alt="${product.name}" class="gallery-image" onerror="this.style.display='none';">`
            ).join('');
        } else {
            productGallery.innerHTML = '<div class="gallery-placeholder"><i class="fas fa-cannabis"></i></div>';
        }
        
        // Configurar precios
        const prices = this.parsePrices(product.price);
        priceList.innerHTML = prices.map(price => `
            <div class="price-item">
                <span class="price-quantity">${price.quantity}</span>
                <span class="price-amount">${price.amount}</span>
            </div>
        `).join('');
        
        // Configurar stock
        const isAvailable = product.stock === 'Disponible';
        stockBadge.className = `stock-badge ${isAvailable ? 'stock-available' : 'stock-unavailable'}`;
        stockBadge.textContent = isAvailable ? 'Disponible' : 'No Disponible';
        
        // Configurar botón de agregar al carrito
        const addToCartBtn = document.getElementById('addToCartBtn');
        addToCartBtn.disabled = !isAvailable;
        addToCartBtn.onclick = () => {
            if (isAvailable) {
                this.addToCart(product);
                this.showToast('Producto agregado al carrito', 'success');
            }
        };
        
        this.showModal(modal);
    }
    
    parsePrices(priceString) {
        // Parsear precios del formato "100@ / 320# | 300@ / 290#"
        const prices = [];
        const priceParts = priceString.split(' | ');
        
        priceParts.forEach(part => {
            const match = part.match(/(\d+[a-zA-Z@#]*)\s*\/\s*(\d+[a-zA-Z@#]*)/);
            if (match) {
                prices.push({
                    quantity: match[1].trim(),
                    amount: match[2].trim()
                });
            }
        });
        
        return prices;
    }
    
    findProductByName(name) {
        for (const category of Object.values(this.catalog.categories)) {
            const product = category.products.find(p => p.name === name);
            if (product) return product;
        }
        return null;
    }
    
    addToCart(product) {
        const existingItem = this.cart.find(item => item.name === product.name);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                name: product.name,
                price: product.price,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.updateCartUI();
    }
    
    removeFromCart(productName) {
        this.cart = this.cart.filter(item => item.name !== productName);
        this.saveCart();
        this.updateCartUI();
    }
    
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
    }
    
    saveCart() {
        localStorage.setItem('mp_cart', JSON.stringify(this.cart));
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
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="text-center">Tu carrito está vacío</p>';
        } else {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-quantity">Cantidad: ${item.quantity}</div>
                    </div>
                    <div class="cart-item-price">${item.price}</div>
                    <button class="cart-item-remove" onclick="app.removeFromCart('${item.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
        
        // Calcular total (simplificado)
        cartTotal.textContent = `${this.cart.length} productos`;
        
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
        navigation.classList.toggle('show');
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
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MPApp();
});
