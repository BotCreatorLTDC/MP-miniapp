// Admin Panel para Miniapp
class AdminPanel {
    constructor() {
        this.currentTab = 'categories';
        this.authenticated = false;
        this.currentUser = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    async checkAuth() {
        try {
            // Obtener username del usuario
            let username = null;

            console.log('🔍 Verificando datos de admin...');

            // Método 1: Parámetros de URL (cuando viene del bot)
            const urlParams = new URLSearchParams(window.location.search);
            const urlUser = urlParams.get('user');
            const isAdminUrl = urlParams.get('admin') === 'true';

            if (urlUser && isAdminUrl) {
                username = urlUser;
                console.log('✅ Username desde URL:', username);
                console.log('✅ Admin mode activado desde URL');
            } else {
                // Método 2: Telegram WebApp
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
                    const initData = window.Telegram.WebApp.initDataUnsafe;
                    console.log('✅ Datos de Telegram disponibles:', initData);

                    if (initData?.user?.username) {
                        username = initData.user.username;
                        console.log('✅ Username encontrado en Telegram:', username);
                    }
                }
            }

            // Si no hay username, no es admin
            if (!username) {
                console.log('❌ No hay username disponible');
                return;
            }

            console.log('✅ Verificando admin para:', username);

            // Lista de usuarios admin (mismo que en bot.py)
            const adminUsers = ['Mpglobalcorp', 'latierradc', 'grlltdc'];
            let isAdmin = false;

            // Si viene de URL con admin=true, verificar que el usuario está en la lista de admins
            if (urlUser && urlParams.get('admin') === 'true') {
                isAdmin = adminUsers.includes(username);
                console.log('✅ Verificación desde URL:', isAdmin, 'usuario:', username, 'es admin?', isAdmin);
            } else {
                // Obtener la URL base de la API
                const apiBase = window.mpApp && window.mpApp.getApiBases ? window.mpApp.getApiBases()[1] : 'https://mp-bot-wtcf.onrender.com';

                console.log('API Base:', apiBase);

                // Verificar si el usuario es admin a través de la API
                const response = await fetch(`${apiBase}/api/admin/check`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username: username })
                });

                const data = await response.json();
                console.log('Respuesta de API admin:', data);

                isAdmin = data.authenticated || (username && adminUsers.includes(username));
            }

            console.log('🔍 Verificación final isAdmin:', isAdmin);

            if (isAdmin) {
                this.authenticated = true;
                this.currentUser = username;

                // Mostrar botón en header
                const adminBtn = document.getElementById('adminBtn');
                if (adminBtn) {
                    adminBtn.style.display = 'flex';
                    console.log('✅ Botón admin en header mostrado');
                }

                // Mostrar sección en navigation
                const adminNavSection = document.getElementById('adminNavSection');
                console.log('🔍 Buscando adminNavSection...', adminNavSection);
                if (adminNavSection) {
                    adminNavSection.style.display = 'block';
                    console.log('✅ Sección admin en navegación mostrada (display: block)');
                    console.log('🔍 Comprobando después de 1s...');
                    setTimeout(() => {
                        console.log('🔍 adminNavSection.style.display después de setTimeout:', adminNavSection.style.display);
                    }, 1000);
                } else {
                    console.error('❌ No se encontró adminNavSection');
                }

                console.log('✅ Panel de admin activado para:', this.currentUser);
            } else {
                console.log('❌ Usuario no es admin:', username);
            }
        } catch (error) {
            console.error('Error verificando admin:', error);
            console.log('Intentando verificación local...');

            // Fallback: verificar localmente
            const adminUsers = ['Mpglobalcorp', 'latierradc', 'grlltdc'];
            if (username && adminUsers.includes(username)) {
                this.authenticated = true;
                this.currentUser = username;

                // Mostrar botón en header
                const adminBtn = document.getElementById('adminBtn');
                if (adminBtn) {
                    adminBtn.style.display = 'flex';
                    console.log('✅ Botón admin en header mostrado (verificación local)');
                }

                // Mostrar sección en navigation
                const adminNavSection = document.getElementById('adminNavSection');
                console.log('🔍 Buscando adminNavSection (fallback)...', adminNavSection);
                if (adminNavSection) {
                    adminNavSection.style.display = 'block';
                    console.log('✅ Sección admin en navegación mostrada (verificación local)');
                    console.log('🔍 adminNavSection.style.display:', adminNavSection.style.display);
                } else {
                    console.error('❌ No se encontró adminNavSection (fallback)');
                }

                console.log('✅ Panel de admin activado (verificación local)');
            } else {
                console.log('No hay acceso de administrador');
            }
        }
    }

    setupEventListeners() {
        const adminBtn = document.getElementById('adminBtn');
        const adminNavBtn = document.getElementById('adminNavBtn');
        const adminModal = document.getElementById('adminModal');
        const closeAdminModal = document.getElementById('closeAdminModal');
        const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');

        const showAdminModal = () => {
            if (adminModal) {
                adminModal.classList.add('show');
                this.loadCurrentTab();
            }
        };

        if (adminBtn) {
            adminBtn.addEventListener('click', showAdminModal);
        }

        if (adminNavBtn) {
            adminNavBtn.addEventListener('click', showAdminModal);
        }

        if (closeAdminModal) {
            closeAdminModal.addEventListener('click', () => {
                adminModal.classList.remove('show');
            });
        }

        if (closeAdminModalBtn) {
            closeAdminModalBtn.addEventListener('click', () => {
                adminModal.classList.remove('show');
            });
        }

        // Tabs navigation
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Action buttons
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.addCategory());
        document.getElementById('addProductBtn').addEventListener('click', () => this.addProduct());
        document.getElementById('addSectionBtn').addEventListener('click', () => this.addSection());

        document.getElementById('refreshCategoriesBtn').addEventListener('click', () => this.loadCategories());
        document.getElementById('refreshProductsBtn').addEventListener('click', () => this.loadProducts());
        document.getElementById('refreshSectionsBtn').addEventListener('click', () => this.loadSections());
        document.getElementById('refreshOrdersBtn').addEventListener('click', () => this.loadOrders());

        // Category form events
        document.getElementById('submitCategoryFormBtn').addEventListener('click', () => this.submitCategoryForm());
        document.getElementById('closeCategoryFormBtn').addEventListener('click', () => {
            document.getElementById('categoryFormModal').classList.remove('show');
        });
        document.getElementById('cancelCategoryFormBtn').addEventListener('click', () => {
            document.getElementById('categoryFormModal').classList.remove('show');
        });

        // Product form events
        document.getElementById('submitProductFormBtn').addEventListener('click', () => this.submitProductForm());
        document.getElementById('closeProductFormBtn').addEventListener('click', () => {
            document.getElementById('productFormModal').classList.remove('show');
        });
        document.getElementById('cancelProductFormBtn').addEventListener('click', () => {
            document.getElementById('productFormModal').classList.remove('show');
        });

        // Section form events
        document.getElementById('submitSectionFormBtn').addEventListener('click', () => this.submitSectionForm());
        document.getElementById('closeSectionFormBtn').addEventListener('click', () => {
            document.getElementById('sectionFormModal').classList.remove('show');
        });
        document.getElementById('cancelSectionFormBtn').addEventListener('click', () => {
            document.getElementById('sectionFormModal').classList.remove('show');
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.admin-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
        });

        this.loadCurrentTab();
    }

    loadCurrentTab() {
        switch(this.currentTab) {
            case 'categories':
                this.loadCategories();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'sections':
                this.loadSections();
                break;
            case 'orders':
                this.loadOrders();
                break;
        }
    }

    async loadCategories() {
        try {
            const apiBase = window.mpApp && window.mpApp.getApiBases ? window.mpApp.getApiBases()[1] : 'https://mp-bot-wtcf.onrender.com';
            const response = await fetch(`${apiBase}/api/catalog`);
            const data = await response.json();

            const categoriesList = document.getElementById('categoriesList');
            const categories = data.data?.categories || {};

            categoriesList.innerHTML = '';

            Object.entries(categories).forEach(([key, category]) => {
                const categoryCard = document.createElement('div');
                categoryCard.className = 'admin-item-card';
                categoryCard.innerHTML = `
                    <div class="admin-item-header">
                        <h4>${category.name}</h4>
                        <span class="badge">${category.products?.length || 0} productos</span>
                    </div>
                    <p class="admin-item-description">${category.description || 'Sin descripción'}</p>
                    <div class="admin-item-actions">
                        <button class="btn btn-sm btn-primary" onclick="adminPanel.editCategory('${key}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteCategory('${key}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                `;
                categoriesList.appendChild(categoryCard);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadProducts() {
        try {
            const apiBase = window.mpApp && window.mpApp.getApiBases ? window.mpApp.getApiBases()[1] : 'https://mp-bot-wtcf.onrender.com';
            const response = await fetch(`${apiBase}/api/catalog`);
            const data = await response.json();

            const productsList = document.getElementById('productsList');
            const categories = data.data?.categories || {};

            productsList.innerHTML = '';

            Object.entries(categories).forEach(([catKey, category]) => {
                category.products?.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.className = 'admin-item-card';
                    productCard.innerHTML = `
                        <div class="admin-item-header">
                            <h4>${product.name}</h4>
                            <span class="badge">${catKey}</span>
                        </div>
                        <p class="admin-item-description">${product.description || 'Sin descripción'}</p>
                        <p class="admin-item-price">${product.price || 'Sin precio'}</p>
                        <div class="admin-item-actions">
                            <button class="btn btn-sm btn-primary" onclick="adminPanel.editProduct('${catKey}', '${product.name}')">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteProduct('${catKey}', '${product.name}')">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    `;
                    productsList.appendChild(productCard);
                });
            });
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async loadSections() {
        try {
            const apiBase = window.mpApp && window.mpApp.getApiBases ? window.mpApp.getApiBases()[1] : 'https://mp-bot-wtcf.onrender.com';
            const response = await fetch(`${apiBase}/api/sections`);
            const data = await response.json();

            const sectionsList = document.getElementById('sectionsList');
            const sections = data.data?.sections || {};

            sectionsList.innerHTML = '';

            Object.entries(sections).forEach(([key, section]) => {
                const sectionCard = document.createElement('div');
                sectionCard.className = 'admin-item-card';
                sectionCard.innerHTML = `
                    <div class="admin-item-header">
                        <h4>${section.title}</h4>
                        <span class="badge">${key}</span>
                    </div>
                    <p class="admin-item-description">${section.content || 'Sin contenido'}</p>
                    <div class="admin-item-actions">
                        <button class="btn btn-sm btn-primary" onclick="adminPanel.editSection('${key}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteSection('${key}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                `;
                sectionsList.appendChild(sectionCard);
            });
        } catch (error) {
            console.error('Error loading sections:', error);
        }
    }

    async loadOrders() {
        try {
            const apiBase = window.mpApp && window.mpApp.getApiBases ? window.mpApp.getApiBases()[1] : 'https://mp-bot-wtcf.onrender.com';
            const response = await fetch(`${apiBase}/api/orders`);
            const data = await response.json();

            const ordersList = document.getElementById('ordersList');
            const orders = data.orders || [];

            ordersList.innerHTML = '';

            if (orders.length === 0) {
                ordersList.innerHTML = '<p class="empty-state">No hay pedidos disponibles</p>';
                return;
            }

            orders.forEach(order => {
                const orderCard = document.createElement('div');
                orderCard.className = 'admin-item-card';
                orderCard.innerHTML = `
                    <div class="admin-item-header">
                        <h4>Pedido #${order.id || 'N/A'}</h4>
                        <span class="badge ${order.status}">${order.status}</span>
                    </div>
                    <p class="admin-item-description"><strong>Cliente:</strong> ${order.customer_name || 'N/A'}</p>
                    <p class="admin-item-price"><strong>Total:</strong> ${order.total || 'N/A'}</p>
                    <div class="admin-item-actions">
                        <button class="btn btn-sm btn-success" onclick="adminPanel.completeOrder(${order.id})">
                            <i class="fas fa-check"></i> Completar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminPanel.cancelOrder(${order.id})">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                `;
                ordersList.appendChild(orderCard);
            });
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    // Category methods
    addCategory() {
        // Mostrar formulario
        document.getElementById('categoryFormMode').value = 'add';
        document.getElementById('categoryFormKey').value = '';
        document.getElementById('categoryFormTitle').textContent = 'Añadir Categoría';
        document.getElementById('categoryKey').disabled = false;
        document.getElementById('categoryKey').value = '';
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryDescription').value = '';
        document.getElementById('categoryFormModal').classList.add('show');
    }

    editCategory(categoryKey) {
        // Cargar datos de la categoría en el formulario
        document.getElementById('categoryFormMode').value = 'edit';
        document.getElementById('categoryFormKey').value = categoryKey;
        document.getElementById('categoryFormTitle').textContent = 'Editar Categoría';
        document.getElementById('categoryKey').disabled = true;
        document.getElementById('categoryKey').value = categoryKey;
        
        // TODO: Cargar datos de la categoría desde el API
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryDescription').value = '';
        document.getElementById('categoryFormModal').classList.add('show');
    }
    
    submitCategoryForm() {
        const mode = document.getElementById('categoryFormMode').value;
        const categoryKey = document.getElementById('categoryFormKey').value || document.getElementById('categoryKey').value;
        const categoryName = document.getElementById('categoryName').value;
        const description = document.getElementById('categoryDescription').value;

        if (!categoryKey || !categoryName) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        document.getElementById('categoryFormModal').classList.remove('show');

        this.makeRequest('POST', '/api/admin/categories', {
            category_key: categoryKey,
            category_name: categoryName,
            description: description
        }).then(() => this.loadCategories());
    }

    deleteCategory(categoryKey) {
        if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

        this.makeRequest('DELETE', `/api/admin/categories/${categoryKey}`)
            .then(() => this.loadCategories());
    }

    // Product methods
    async addProduct() {
        // Cargar categorías en el select
        const apiBase = window.mpApp && window.mpApp.getApiBases ? window.mpApp.getApiBases()[1] : 'https://mp-bot-wtcf.onrender.com';
        const response = await fetch(`${apiBase}/api/catalog`);
        const data = await response.json();
        const categories = data.data?.categories || {};

        const categorySelect = document.getElementById('productCategory');
        categorySelect.innerHTML = '<option value="">Seleccionar categoría...</option>';
        
        Object.entries(categories).forEach(([key, category]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });

        // Mostrar formulario
        document.getElementById('productFormMode').value = 'add';
        document.getElementById('productFormOldName').value = '';
        document.getElementById('productFormCategoryKey').value = '';
        document.getElementById('productFormTitle').textContent = 'Añadir Producto';
        document.getElementById('productCategory').value = '';
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productDescription').value = '';
        document.getElementById('productStock').value = '99';
        document.getElementById('productFormModal').classList.add('show');
    }

    editProduct(categoryKey, productName) {
        // Mostrar formulario con datos pre-llenados
        document.getElementById('productFormMode').value = 'edit';
        document.getElementById('productFormOldName').value = productName;
        document.getElementById('productFormCategoryKey').value = categoryKey;
        document.getElementById('productFormTitle').textContent = 'Editar Producto';
        
        // Cargar datos del producto en el formulario
        // TODO: Obtener datos del producto desde el API
        
        document.getElementById('productFormModal').classList.add('show');
    }
    
    submitProductForm() {
        const mode = document.getElementById('productFormMode').value;
        const categoryKey = document.getElementById('productCategory').value || document.getElementById('productFormCategoryKey').value;
        const productName = document.getElementById('productName').value;
        const productPrice = document.getElementById('productPrice').value;
        const productDescription = document.getElementById('productDescription').value;
        const productStock = document.getElementById('productStock').value;
        const oldName = document.getElementById('productFormOldName').value;

        if (!categoryKey || !productName || !productPrice) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        document.getElementById('productFormModal').classList.remove('show');

        const formData = {
            category_key: categoryKey,
            name: productName,
            price: productPrice,
            description: productDescription || '',
            stock: productStock || '99'
        };

        if (mode === 'edit' && oldName) {
            formData.old_name = oldName;
        }

        this.makeRequest('POST', '/api/admin/products', formData).then(() => this.loadProducts());
    }

    deleteProduct(categoryKey, productName) {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        this.makeRequest('DELETE', `/api/admin/products/${categoryKey}/${productName}`)
            .then(() => this.loadProducts());
    }

    // Section methods
    addSection() {
        // Mostrar formulario
        document.getElementById('sectionFormMode').value = 'add';
        document.getElementById('sectionFormKey').value = '';
        document.getElementById('sectionFormTitle').textContent = 'Añadir Sección';
        document.getElementById('sectionKey').disabled = false;
        document.getElementById('sectionKey').value = '';
        document.getElementById('sectionTitle').value = '';
        document.getElementById('sectionContent').value = '';
        document.getElementById('sectionFormModal').classList.add('show');
    }

    editSection(sectionKey) {
        // Mostrar formulario con datos pre-llenados
        document.getElementById('sectionFormMode').value = 'edit';
        document.getElementById('sectionFormKey').value = sectionKey;
        document.getElementById('sectionFormTitle').textContent = 'Editar Sección';
        document.getElementById('sectionKey').disabled = true;
        document.getElementById('sectionKey').value = sectionKey;
        
        // TODO: Cargar datos de la sección desde el API
        
        document.getElementById('sectionFormModal').classList.add('show');
    }
    
    submitSectionForm() {
        const mode = document.getElementById('sectionFormMode').value;
        const sectionKey = document.getElementById('sectionFormKey').value || document.getElementById('sectionKey').value;
        const title = document.getElementById('sectionTitle').value;
        const content = document.getElementById('sectionContent').value;

        if (!sectionKey || !title || !content) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        document.getElementById('sectionFormModal').classList.remove('show');

        this.makeRequest('POST', '/api/admin/sections', {
            section_key: sectionKey,
            title: title,
            content: content
        }).then(() => this.loadSections());
    }

    deleteSection(sectionKey) {
        if (!confirm('¿Estás seguro de eliminar esta sección?')) return;

        this.makeRequest('DELETE', `/api/admin/sections/${sectionKey}`)
            .then(() => this.loadSections());
    }

    // Order methods
    completeOrder(orderId) {
        this.makeRequest('POST', `/api/admin/orders/${orderId}/complete`)
            .then(() => this.loadOrders());
    }

    cancelOrder(orderId) {
        if (!confirm('¿Estás seguro de cancelar este pedido?')) return;

        this.makeRequest('POST', `/api/admin/orders/${orderId}/cancel`)
            .then(() => this.loadOrders());
    }

    async makeRequest(method, url, data = null) {
        try {
            // Obtener la URL base de la API
            const apiBase = window.mpApp && window.mpApp.getApiBases ? window.mpApp.getApiBases()[1] : 'https://mp-bot-wtcf.onrender.com';

            // Construir la URL completa
            const fullUrl = url.startsWith('http') ? url : `${apiBase}${url}`;

            console.log(`🔍 Request: ${method} ${fullUrl}`, data);

            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(fullUrl, options);
            const result = await response.json();

            console.log(`✅ Response:`, result);

            if (result.success) {
                alert('✅ Operación exitosa');
            } else {
                alert('❌ Error: ' + (result.error || 'Desconocido'));
            }

            return result;
        } catch (error) {
            console.error('❌ Request error:', error);
            alert('❌ Error en la petición: ' + error.message);
        }
    }
}

// Inicializar admin panel
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Inicializando AdminPanel...');
    adminPanel = new AdminPanel();
    console.log('✅ AdminPanel inicializado');

    // Verificar después de un breve delay para asegurar que el DOM está listo
    setTimeout(() => {
        const adminNavSection = document.getElementById('adminNavSection');
        console.log('🔍 adminNavSection encontrada:', adminNavSection);
        if (adminNavSection) {
            console.log('🔍 adminNavSection.style.display:', adminNavSection.style.display);
        }
    }, 2000);
});

// Exportar para uso global
window.adminPanel = adminPanel;
