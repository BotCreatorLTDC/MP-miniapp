// Gestión de pedidos y formularios
class OrderManager {
    constructor(app) {
        this.app = app;
        this.orderForm = null;
        this.setupOrderForm();
    }
    
    setupOrderForm() {
        this.orderForm = document.getElementById('orderForm');
        if (!this.orderForm) return;
        
        // Configurar validación en tiempo real
        this.setupFormValidation();
        
        // Configurar envío del formulario
        this.orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitOrder();
        });
        
        // Configurar botones
        this.setupOrderButtons();
    }
    
    setupFormValidation() {
        const requiredFields = this.orderForm.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
            
            field.addEventListener('input', () => {
                this.clearFieldError(field);
            });
        });
    }
    
    setupOrderButtons() {
        // Botón de limpiar carrito
        const clearBtn = document.getElementById('clearCartBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearCart();
            });
        }
        
        // Botón de cancelar pedido
        const cancelBtn = document.getElementById('cancelOrderBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideOrderForm();
            });
        }
        
        // Botón de enviar pedido
        const submitBtn = document.getElementById('submitOrderBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitOrder();
            });
        }
        
        // Botón de cerrar éxito
        const closeSuccessBtn = document.getElementById('closeSuccessModal');
        if (closeSuccessBtn) {
            closeSuccessBtn.addEventListener('click', () => {
                this.hideSuccessModal();
            });
        }
    }
    
    setupProceedButton() {
        // Botón de proceder al pedido - configurar cuando se muestra el carrito
        const proceedBtn = document.getElementById('proceedOrderBtn');
        console.log('Configurando botón proceder al pedido:', proceedBtn);
        
        if (proceedBtn) {
            // Remover event listeners anteriores para evitar duplicados
            proceedBtn.replaceWith(proceedBtn.cloneNode(true));
            const newProceedBtn = document.getElementById('proceedOrderBtn');
            console.log('Nuevo botón creado:', newProceedBtn);
            
            newProceedBtn.addEventListener('click', (e) => {
                console.log('Botón proceder al pedido clickeado', e);
                console.log('Carrito actual:', this.app.cart);
                this.openTelegramChat();
            });
            
            console.log('Event listener agregado al botón');
        } else {
            console.error('No se encontró el botón proceedOrderBtn');
        }
    }
    
    showOrderForm() {
        // Llenar el contenido del pedido automáticamente
        this.populateOrderContent();
        
        // Mostrar modal de pedido
        const orderModal = document.getElementById('orderModal');
        this.app.showModal(orderModal);
        
        // Cerrar modal del carrito
        const cartModal = document.getElementById('cartModal');
        this.app.hideModal(cartModal);
    }
    
    hideOrderForm() {
        const orderModal = document.getElementById('orderModal');
        this.app.hideModal(orderModal);
    }
    
    populateOrderContent() {
        const orderContentField = document.getElementById('orderContent');
        if (!orderContentField || this.app.cart.length === 0) return;
        
        const orderContent = this.app.cart.map(item => 
            `${item.quantity}x ${item.name} - ${item.price}`
        ).join('\n');
        
        orderContentField.value = orderContent;
    }
    
    validateField(field) {
        const value = field.value.trim();
        const isValid = this.isFieldValid(field, value);
        
        if (!isValid) {
            this.showFieldError(field, this.getFieldErrorMessage(field));
        } else {
            this.clearFieldError(field);
        }
        
        return isValid;
    }
    
    isFieldValid(field, value) {
        const type = field.type;
        const required = field.hasAttribute('required');
        
        if (required && !value) return false;
        if (!value) return true; // Campo opcional vacío es válido
        
        switch (type) {
            case 'email':
                return this.isValidEmail(value);
            case 'tel':
                return this.isValidPhone(value);
            case 'text':
                return value.length >= 2;
            default:
                return true;
        }
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{9,}$/;
        return phoneRegex.test(phone);
    }
    
    getFieldErrorMessage(field) {
        const type = field.type;
        const required = field.hasAttribute('required');
        
        if (required && !field.value.trim()) {
            return 'Este campo es obligatorio';
        }
        
        switch (type) {
            case 'email':
                return 'Ingresa un email válido';
            case 'tel':
                return 'Ingresa un teléfono válido';
            case 'text':
                return 'Debe tener al menos 2 caracteres';
            default:
                return 'Valor inválido';
        }
    }
    
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.color = 'var(--error-color)';
        errorElement.style.fontSize = '0.8rem';
        errorElement.style.marginTop = '0.25rem';
        
        field.parentNode.appendChild(errorElement);
    }
    
    clearFieldError(field) {
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }
    
    validateForm() {
        const requiredFields = this.orderForm.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    async submitOrder() {
        if (!this.validateForm()) {
            this.app.showToast(this.app.t('form_errors'), 'error');
            return;
        }
        
        if (this.app.cart.length === 0) {
            this.app.showToast(this.app.t('cart_empty_error'), 'error');
            return;
        }
        
        try {
            // Mostrar loading
            this.showLoading();
            
            // Preparar datos del pedido
            const orderData = this.prepareOrderData();
            
            // Enviar pedido (simulado)
            await this.sendOrder(orderData);
            
            // Mostrar éxito
            this.showSuccess();
            
            // Limpiar carrito
            this.app.clearCart();
            
        } catch (error) {
            console.error('Error enviando pedido:', error);
            this.app.showToast(this.app.t('error_sending_order'), 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    prepareOrderData() {
        const formData = new FormData(this.orderForm);
        const orderData = {
            // Datos de envío
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            city: formData.get('city'),
            province: formData.get('province'),
            postalCode: formData.get('postalCode'),
            comments: formData.get('comments'),
            
            // Datos del pedido
            orderContent: formData.get('orderContent'),
            username: formData.get('username'),
            paymentMethod: formData.get('paymentMethod'),
            
            // Metadatos
            cart: this.app.cart,
            totalItems: this.app.cart.reduce((sum, item) => sum + item.quantity, 0),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        return orderData;
    }
    
    async sendOrder(orderData) {
        try {
            // Generar mensaje de pedido para Telegram
            const orderMessage = this.generateOrderMessage(orderData);
            
            // Crear URL de Telegram con el mensaje
            const telegramUrl = `https://t.me/grlltdc?text=${encodeURIComponent(orderMessage)}`;
            
            // Abrir chat de Telegram
            window.open(telegramUrl, '_blank');
            
            return { success: true, message: this.app.t('telegram_opened_success') };
        } catch (error) {
            console.error('Error abriendo chat de Telegram:', error);
            throw error;
        }
    }
    
    generateOrderMessage(orderData) {
        const cartItems = this.app.cart.map(item => {
            if (item.selectedQuantity && item.selectedAmount) {
                return `• ${item.name} (${item.selectedQuantity} por ${item.selectedAmount}) x${item.quantity}`;
            } else {
                return `• ${item.name} x${item.quantity}`;
            }
        }).join('\n');
        
        const totalItems = this.app.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        return `🛒 NUEVO PEDIDO - MP Global Corp

👤 Cliente: ${orderData.fullName}
📞 Teléfono: ${orderData.phone}
📍 Dirección: ${orderData.address}
${orderData.city ? `🏙️ Ciudad: ${orderData.city}` : ''}
${orderData.postalCode ? `📮 CP: ${orderData.postalCode}` : ''}

🛍️ PRODUCTOS (${totalItems} items):
${cartItems}

💬 Notas: ${orderData.notes || ''}

📅 Fecha: ${new Date().toLocaleString(this.app.translationManager.getLocale())}

---
Enviado desde la Miniapp MP Global Corp`;
    }
    
    generateOrderId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `MP-${timestamp}-${random}`.toUpperCase();
    }
    
    showLoading() {
        const submitBtn = document.getElementById('submitOrderBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${this.app.t('sending')}`;
        }
    }
    
    hideLoading() {
        const submitBtn = document.getElementById('submitOrderBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> ${this.app.t('submit_order')}`;
        }
    }
    
    showSuccess() {
        // Cerrar modal de pedido
        this.hideOrderForm();
        
        // Mostrar modal de éxito
        const successModal = document.getElementById('successModal');
        this.app.showModal(successModal);
        
        // Mostrar toast
        this.app.showToast(this.app.t('telegram_opened_success'), 'success');
    }
    
    hideSuccessModal() {
        const successModal = document.getElementById('successModal');
        this.app.hideModal(successModal);
    }
    
    clearCart() {
        this.app.clearCart();
        this.app.showToast(this.app.t('cart_cleared'), 'info');
    }
    
    openTelegramChat() {
        console.log('openTelegramChat llamada');
        console.log('Carrito:', this.app.cart);
        
        if (this.app.cart.length === 0) {
            console.log('Carrito vacío, mostrando toast de error');
            this.app.showToast('Tu carrito está vacío', 'error');
            return;
        }
        
        try {
            // Generar mensaje de pedido para Telegram
            const orderMessage = this.generateCartMessage();
            console.log('Mensaje generado:', orderMessage);
            
            // Crear URL de Telegram con el mensaje
            const telegramUrl = `https://t.me/grlltdc?text=${encodeURIComponent(orderMessage)}`;
            console.log('URL de Telegram:', telegramUrl);
            
            // Abrir chat de Telegram
            console.log('Abriendo ventana de Telegram...');
            window.open(telegramUrl, '_blank');
            
            // Mostrar mensaje de confirmación
            this.app.showToast('¡Chat de Telegram abierto!', 'success');
            console.log('Chat de Telegram abierto exitosamente');
            
        } catch (error) {
            console.error('Error abriendo chat de Telegram:', error);
            this.app.showToast('Error abriendo chat de Telegram', 'error');
        }
    }
    
    generateCartMessage() {
        const cartItems = this.app.cart.map(item => {
            if (item.selectedQuantity && item.selectedAmount) {
                const totalPrice = item.totalPrice || item.selectedAmount;
                const unitText = item.selectedQuantity.includes('@') ? 'cada 100@' : 'c/u';
                return `• ${item.name} (${item.selectedQuantity} por ${item.selectedAmount} ${unitText}) x${item.quantity} = ${totalPrice}`;
            } else {
                return `• ${item.name} x${item.quantity}`;
            }
        }).join('\n');
        
        const totalItems = this.app.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        return `🛒 NUEVO PEDIDO - MP Global Corp

🛍️ PRODUCTOS (${totalItems} items):
${cartItems}

📅 Fecha: ${new Date().toLocaleString('es-ES')}

---
Enviado desde la Miniapp MP Global Corp`;
    }
    
    // Generar resumen del pedido para mostrar
    generateOrderSummary() {
        if (this.app.cart.length === 0) {
            return this.app.t('cart_empty');
        }
        
        const summary = this.app.cart.map(item => 
            `${item.quantity}x ${item.name}`
        ).join('\n');
        
        const totalItems = this.app.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        return `${summary}\n\n${this.app.t('total')}: ${totalItems} ${this.app.t('products')}`;
    }
    
    // Exportar pedido a diferentes formatos
    exportOrder(format = 'text') {
        const orderData = this.prepareOrderData();
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(orderData, null, 2);
            case 'csv':
                return this.exportOrderToCSV(orderData);
            case 'text':
                return this.exportOrderToText(orderData);
            default:
                return null;
        }
    }
    
    exportOrderToText(orderData) {
        let text = '=== PEDIDO MP GLOBAL CORP ===\n\n';
        text += `Fecha: ${new Date(orderData.timestamp).toLocaleString()}\n`;
        text += `ID: ${this.generateOrderId()}\n\n`;
        
        text += 'DATOS DE ENVÍO:\n';
        text += `Nombre: ${orderData.fullName}\n`;
        text += `Teléfono: ${orderData.phone}\n`;
        text += `Dirección: ${orderData.address}\n`;
        text += `Ciudad: ${orderData.city}\n`;
        text += `Provincia: ${orderData.province}\n`;
        text += `Código Postal: ${orderData.postalCode}\n`;
        if (orderData.comments) {
            text += `Comentarios: ${orderData.comments}\n`;
        }
        
        text += '\nPEDIDO:\n';
        text += orderData.orderContent;
        
        text += '\n\nMÉTODO DE PAGO:\n';
        text += orderData.paymentMethod;
        
        return text;
    }
    
    exportOrderToCSV(orderData) {
        const headers = ['Campo', 'Valor'];
        const rows = [
            ['Fecha', new Date(orderData.timestamp).toLocaleString()],
            ['ID Pedido', this.generateOrderId()],
            ['Nombre', orderData.fullName],
            ['Teléfono', orderData.phone],
            ['Dirección', orderData.address],
            ['Ciudad', orderData.city],
            ['Provincia', orderData.province],
            ['Código Postal', orderData.postalCode],
            ['Comentarios', orderData.comments || ''],
            ['Contenido del Pedido', orderData.orderContent],
            ['Método de Pago', orderData.paymentMethod]
        ];
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        return csvContent;
    }
}

// Funciones de utilidad para pedidos
const OrderUtils = {
    // Validar datos de envío
    validateShippingData(data) {
        const errors = [];
        
        if (!data.fullName || data.fullName.length < 2) {
            errors.push('Nombre completo requerido');
        }
        
        if (!data.phone || !/^[\+]?[0-9\s\-\(\)]{9,}$/.test(data.phone)) {
            errors.push('Teléfono válido requerido');
        }
        
        if (!data.address || data.address.length < 5) {
            errors.push('Dirección válida requerida');
        }
        
        if (!data.city || data.city.length < 2) {
            errors.push('Ciudad requerida');
        }
        
        if (!data.province || data.province.length < 2) {
            errors.push('Provincia requerida');
        }
        
        if (!data.postalCode || !/^[0-9]{5}$/.test(data.postalCode)) {
            errors.push('Código postal válido requerido (5 dígitos)');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },
    
    // Calcular costo estimado de envío
    calculateShippingCost(address, weight) {
        // Lógica simplificada para cálculo de envío
        const baseCost = 5; // Costo base
        const weightCost = weight * 0.5; // Costo por peso
        const distanceCost = this.estimateDistance(address) * 0.1; // Costo por distancia
        
        return Math.round((baseCost + weightCost + distanceCost) * 100) / 100;
    },
    
    // Estimar distancia (simulado)
    estimateDistance(address) {
        // En una implementación real, usarías una API de geocoding
        return Math.random() * 100; // Simulado
    },
    
    // Generar código de seguimiento
    generateTrackingCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 10; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};
