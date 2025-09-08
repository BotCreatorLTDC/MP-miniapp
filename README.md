# MP Global Corp® - Miniapp

Miniapp web para el catálogo de productos MP Global Corp®.

## 🚀 Despliegue en GitHub Pages

### 1. Crear Repositorio
1. Ve a [GitHub](https://github.com/new)
2. Crea un nuevo repositorio: `mp-bot-miniapp`
3. Marca como **público** (requerido para GitHub Pages)

### 2. Subir Archivos
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mp-bot-miniapp.git
git push -u origin main
```

### 3. Activar GitHub Pages
1. Ve a **Settings** del repositorio
2. Scroll down a **Pages**
3. En **Source**, selecciona **Deploy from a branch**
4. Selecciona **main** branch
5. Haz clic en **Save**

### 4. Configurar el Bot
Una vez desplegada, actualiza la URL en tu bot:
```env
MINIAPP_URL=https://TU_USUARIO.github.io/mp-bot-miniapp
```

## 🔗 URLs

- **Miniapp:** `https://TU_USUARIO.github.io/mp-bot-miniapp`
- **API del Bot:** `https://mp-bot-wtcf.onrender.com/api/`

## ✅ Funcionalidades

- 🛍️ Catálogo interactivo
- 🔍 Búsqueda en tiempo real
- 🛒 Carrito de compras
- 📝 Formulario de pedidos
- 📱 Diseño responsivo
- 🔄 Sincronización con base de datos del bot