// Gestión del catálogo de productos
class CatalogManager {
    constructor(app) {
        this.app = app;
        this.categories = {
            'moroccan_hash': { name: '🇲🇦 MOROCCAN STUFF 🇲🇦', icon: 'fas fa-leaf' },
            'spanish_flower': { name: '🇪🇸 SPANISH STUFF 🇪🇸', icon: 'fas fa-seedling' },
            'cali_flower': { name: '🇺🇸 CALIFORNIA STUFF 🇺🇸', icon: 'fas fa-star' },
            'extractions': { name: '🔬 EXTRACTIONS', icon: 'fas fa-flask' },
            'varios': { name: '📦 OTHER PRODUCTS', icon: 'fas fa-box' }
        };
    }
    
    // Obtener todos los productos de una categoría
    getProductsByCategory(categoryId) {
        if (!this.app.catalog || !this.app.catalog.categories) {
            return [];
        }
        
        const category = this.app.catalog.categories[categoryId];
        return category ? category.products : [];
    }
    
    // Obtener todos los productos
    getAllProducts() {
        if (!this.app.catalog || !this.app.catalog.categories) {
            return [];
        }
        
        let allProducts = [];
        Object.values(this.app.catalog.categories).forEach(category => {
            allProducts = allProducts.concat(category.products);
        });
        return allProducts;
    }
    
    // Buscar productos por término
    searchProducts(term) {
        const allProducts = this.getAllProducts();
        if (!term) return allProducts;
        
        const searchTerm = term.toLowerCase();
        return allProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.price.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtrar productos por disponibilidad
    filterByAvailability(products, availableOnly = true) {
        if (!availableOnly) return products;
        
        return products.filter(product => product.stock === 'Disponible');
    }
    
    // Obtener productos destacados
    getFeaturedProducts() {
        const allProducts = this.getAllProducts();
        return allProducts
            .filter(product => product.stock === 'Disponible')
            .slice(0, 6); // Primeros 6 productos disponibles
    }
    
    // Obtener productos por rango de precio
    getProductsByPriceRange(products, minPrice = 0, maxPrice = Infinity) {
        return products.filter(product => {
            const prices = this.parsePriceString(product.price);
            return prices.some(price => {
                const numericPrice = this.extractNumericPrice(price.amount);
                return numericPrice >= minPrice && numericPrice <= maxPrice;
            });
        });
    }
    
    // Parsear string de precios
    parsePriceString(priceString) {
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
    
    // Extraer precio numérico de un string
    extractNumericPrice(priceString) {
        const match = priceString.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
    
    // Obtener estadísticas del catálogo
    getCatalogStats() {
        const allProducts = this.getAllProducts();
        const availableProducts = allProducts.filter(p => p.stock === 'Disponible');
        
        const stats = {
            total: allProducts.length,
            available: availableProducts.length,
            unavailable: allProducts.length - availableProducts.length,
            categories: Object.keys(this.app.catalog.categories).length
        };
        
        // Estadísticas por categoría
        stats.categoryBreakdown = {};
        Object.keys(this.app.catalog.categories).forEach(categoryId => {
            const products = this.getProductsByCategory(categoryId);
            stats.categoryBreakdown[categoryId] = {
                total: products.length,
                available: products.filter(p => p.stock === 'Disponible').length
            };
        });
        
        return stats;
    }
    
    // Obtener productos similares
    getSimilarProducts(currentProduct, limit = 4) {
        const allProducts = this.getAllProducts();
        const currentCategory = this.findProductCategory(currentProduct);
        
        return allProducts
            .filter(product => 
                product.name !== currentProduct.name &&
                this.findProductCategory(product) === currentCategory
            )
            .slice(0, limit);
    }
    
    // Encontrar la categoría de un producto
    findProductCategory(product) {
        for (const [categoryId, category] of Object.entries(this.app.catalog.categories)) {
            if (category.products.some(p => p.name === product.name)) {
                return categoryId;
            }
        }
        return null;
    }
    
    // Obtener productos recientemente agregados (simulado)
    getRecentProducts(limit = 5) {
        const allProducts = this.getAllProducts();
        // Simular productos recientes tomando los últimos del array
        return allProducts.slice(-limit);
    }
    
    // Obtener productos más populares (simulado basado en disponibilidad)
    getPopularProducts(limit = 5) {
        const allProducts = this.getAllProducts();
        return allProducts
            .filter(product => product.stock === 'Disponible')
            .sort((a, b) => {
                // Simular popularidad basada en longitud del nombre (más descriptivo = más popular)
                return b.name.length - a.name.length;
            })
            .slice(0, limit);
    }
    
    // Validar estructura del catálogo
    validateCatalog(catalog) {
        if (!catalog || !catalog.categories) {
            return { valid: false, error: 'Estructura de catálogo inválida' };
        }
        
        const errors = [];
        
        Object.entries(catalog.categories).forEach(([categoryId, category]) => {
            if (!category.name || !category.products) {
                errors.push(`Categoría ${categoryId} incompleta`);
                return;
            }
            
            if (!Array.isArray(category.products)) {
                errors.push(`Productos de categoría ${categoryId} no es un array`);
                return;
            }
            
            category.products.forEach((product, index) => {
                if (!product.name) {
                    errors.push(`Producto ${index} en categoría ${categoryId} sin nombre`);
                }
                if (!product.price) {
                    errors.push(`Producto ${index} en categoría ${categoryId} sin precio`);
                }
            });
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    // Exportar catálogo a formato específico
    exportCatalog(format = 'json') {
        if (!this.app.catalog) return null;
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(this.app.catalog, null, 2);
            case 'csv':
                return this.exportToCSV();
            case 'xml':
                return this.exportToXML();
            default:
                return null;
        }
    }
    
    // Exportar a CSV
    exportToCSV() {
        const allProducts = this.getAllProducts();
        const headers = ['Categoría', 'Nombre', 'Precio', 'Descripción', 'Stock'];
        
        const csvContent = [
            headers.join(','),
            ...allProducts.map(product => {
                const category = this.findProductCategory(product);
                return [
                    category || 'N/A',
                    `"${product.name}"`,
                    `"${product.price}"`,
                    `"${product.description}"`,
                    product.stock
                ].join(',');
            })
        ].join('\n');
        
        return csvContent;
    }
    
    // Exportar a XML
    exportToXML() {
        const allProducts = this.getAllProducts();
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<catalog>\n';
        
        Object.entries(this.app.catalog.categories).forEach(([categoryId, category]) => {
            xml += `  <category id="${categoryId}">\n`;
            xml += `    <name>${category.name}</name>\n`;
            xml += `    <products>\n`;
            
            category.products.forEach(product => {
                xml += `      <product>\n`;
                xml += `        <name><![CDATA[${product.name}]]></name>\n`;
                xml += `        <price><![CDATA[${product.price}]]></price>\n`;
                xml += `        <description><![CDATA[${product.description}]]></description>\n`;
                xml += `        <stock>${product.stock}</stock>\n`;
                if (product.images && product.images.length > 0) {
                    xml += `        <images>\n`;
                    product.images.forEach(img => {
                        xml += `          <image>${img}</image>\n`;
                    });
                    xml += `        </images>\n`;
                }
                xml += `      </product>\n`;
            });
            
            xml += `    </products>\n`;
            xml += `  </category>\n`;
        });
        
        xml += '</catalog>';
        return xml;
    }
}

// Funciones de utilidad para el catálogo
const CatalogUtils = {
    // Formatear precio para mostrar
    formatPrice(priceString) {
        return priceString.replace(/#/g, '€').replace(/@/g, 'g');
    },
    
    // Obtener precio mínimo de un producto
    getMinPrice(product) {
        const prices = new CatalogManager().parsePriceString(product.price);
        if (prices.length === 0) return 0;
        
        return Math.min(...prices.map(p => 
            new CatalogManager().extractNumericPrice(p.amount)
        ));
    },
    
    // Obtener precio máximo de un producto
    getMaxPrice(product) {
        const prices = new CatalogManager().parsePriceString(product.price);
        if (prices.length === 0) return 0;
        
        return Math.max(...prices.map(p => 
            new CatalogManager().extractNumericPrice(p.amount)
        ));
    },
    
    // Verificar si un producto tiene descuentos por volumen
    hasVolumeDiscounts(product) {
        const prices = new CatalogManager().parsePriceString(product.price);
        return prices.length > 1;
    },
    
    // Obtener el mejor precio por gramo
    getBestPricePerGram(product) {
        const prices = new CatalogManager().parsePriceString(product.price);
        if (prices.length === 0) return null;
        
        let bestPrice = null;
        let bestRatio = Infinity;
        
        prices.forEach(price => {
            const quantity = new CatalogManager().extractNumericPrice(price.quantity);
            const amount = new CatalogManager().extractNumericPrice(price.amount);
            
            if (quantity > 0) {
                const ratio = amount / quantity;
                if (ratio < bestRatio) {
                    bestRatio = ratio;
                    bestPrice = { quantity: price.quantity, amount: price.amount, ratio };
                }
            }
        });
        
        return bestPrice;
    }
};
