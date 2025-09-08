// Aplicación principal de la miniapp MP Global Corp
class MPApp {
    constructor() {
        this.catalog = null;
        this.currentCategory = 'all';
        this.searchTerm = '';
        
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
        console.log('createProductCard called for:', product.name, 'with images:', product.images);
        
        const isAvailable = product.stock === 'Disponible';
        const categoryClass = this.getCategoryClass(this.currentCategory);
        
        let imageHtml = '';
        if (product.images && product.images.length > 0) {
            const imageUrl = this.getImageUrl(product.images[0]);
            console.log('Generated image URL:', imageUrl);
            imageHtml = `<img src="${imageUrl}" alt="${product.name}" class="gallery-image" onload="console.log('Image loaded:', this.src)" onerror="console.log('Image error:', this.src); this.style.display='none'; this.parentElement.querySelector('.image-placeholder').style.display='flex';">`;
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
        console.log('getImageUrl called with:', imagePath);
        
        // Si la imagen es una URL completa, usarla directamente
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            console.log('Using full URL:', imagePath);
            return imagePath;
        }
        
        // Si es una ruta relativa que empieza con 'img/', convertir a la ruta correcta
        if (imagePath.startsWith('img/')) {
            const newPath = `assets/images/${imagePath}`;
            console.log('Converting img/ path:', imagePath, '->', newPath);
            return newPath;
        }
        
        // Para otros casos, intentar usar la imagen directamente
        console.log('Using path as-is:', imagePath);
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
            productGallery.innerHTML = product.images.map(img => 
                `<img src="${this.getImageUrl(img)}" alt="${product.name}" class="gallery-image" onerror="this.style.display='none';">`
            ).join('');
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
    
    updateAddToCartButton(product, selectedQuantity, selectedAmount) {
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (!addToCartBtn) return;
        
        // Calcular el precio total para esta variante
        const totalPrice = this.calculateTotalPrice(selectedQuantity, selectedAmount);
        
        // Actualizar el texto del botón para mostrar la variante seleccionada con precio total
        addToCartBtn.textContent = `Agregar ${selectedQuantity} por ${totalPrice}`;
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
        if (this.orderManager) {
            this.orderManager.setupProceedButton();
        }
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="text-center">Tu carrito está vacío</p>';
        } else {
            cartItems.innerHTML = this.cart.map((item, index) => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-variant">${item.selectedQuantity} por ${item.selectedAmount}</div>
                        <div class="cart-item-quantity">Cantidad: ${item.quantity}</div>
                    </div>
                    <div class="cart-item-price">
                        <div class="price-per-unit">${item.selectedAmount} ${item.selectedQuantity.includes('@') ? 'por cada 100@' : 'c/u'}</div>
                        <div class="price-total">${item.totalPrice || item.selectedAmount} total</div>
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
