# 🎬 Sistema de Medios para Productos - MP Global Corp

## 📋 Descripción

El sistema de medios permite agregar **imágenes**, **videos** y **GIFs** a los productos de la miniapp, creando una experiencia visual mucho más rica y profesional.

## ✨ Características

### **Tipos de Medios Soportados:**
- 🖼️ **Imágenes:** JPG, PNG, WebP
- 🎥 **Videos:** MP4, WebM (con controles de reproducción)
- 🎞️ **GIFs:** GIF animados (reproducción automática)

### **Funcionalidades:**
- **Galería unificada** con navegación por miniaturas
- **Controles de video** (play, pause, duración)
- **Indicadores visuales** para cada tipo de medio
- **Responsive design** para móviles y desktop
- **Fallback automático** si no hay medios disponibles
- **Sistema de traducciones** integrado

## 🏗️ Estructura de Datos

### **Formato de Medios en el Catálogo:**

```json
{
  "name": "Nombre del Producto",
  "price": "100@ / 350# | 300@ / 320#",
  "description": "Descripción del producto",
  "stock": "Disponible",
  "media": [
    {
      "type": "image",
      "url": "products/category/product_image.jpg",
      "thumbnail": "products/category/thumbs/product_image_thumb.jpg"
    },
    {
      "type": "video",
      "url": "products/category/product_video.mp4",
      "thumbnail": "products/category/thumbs/product_video_thumb.jpg",
      "duration": 25
    },
    {
      "type": "gif",
      "url": "products/category/product_animation.gif",
      "thumbnail": "products/category/thumbs/product_animation_thumb.jpg"
    }
  ]
}
```

### **Propiedades de Medios:**

| Propiedad | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `type` | string | ✅ | Tipo de medio: "image", "video", "gif" |
| `url` | string | ✅ | URL o ruta del archivo de medio |
| `thumbnail` | string | ❌ | URL de miniatura (opcional) |
| `duration` | number | ❌ | Duración en segundos (solo videos) |

## 📁 Organización de Archivos

### **Estructura Recomendada:**
```
assets/
├── products/
│   ├── moroccan/
│   │   ├── commercial_mousse_1.jpg
│   │   ├── commercial_mousse_process.mp4
│   │   ├── commercial_mousse_texture.gif
│   │   └── thumbs/
│   │       ├── commercial_mousse_1_thumb.jpg
│   │       ├── commercial_mousse_process_thumb.jpg
│   │       └── commercial_mousse_texture_thumb.jpg
│   ├── cali/
│   │   ├── purple_haze_1.jpg
│   │   ├── purple_haze_grow.mp4
│   │   └── thumbs/
│   │       ├── purple_haze_1_thumb.jpg
│   │       └── purple_haze_grow_thumb.jpg
│   └── extractions/
│       ├── live_rosin_1.jpg
│       ├── live_rosin_extraction.mp4
│       └── thumbs/
│           ├── live_rosin_1_thumb.jpg
│           └── live_rosin_extraction_thumb.jpg
```

## 🎯 Cómo Usar

### **1. Agregar Medios a un Producto:**

```json
{
  "name": "Mi Producto",
  "price": "100@ / 350#",
  "description": "Descripción del producto",
  "stock": "Disponible",
  "media": [
    {
      "type": "image",
      "url": "products/mi_producto_1.jpg"
    },
    {
      "type": "video",
      "url": "products/mi_producto_demo.mp4",
      "duration": 20
    }
  ]
}
```

### **2. Migrar del Sistema Anterior:**

Si ya tienes productos con el campo `images`, el sistema automáticamente los convierte:

```json
// Sistema anterior
{
  "images": ["image1.jpg", "image2.jpg"]
}

// Se convierte automáticamente a:
{
  "media": [
    { "type": "image", "url": "image1.jpg" },
    { "type": "image", "url": "image2.jpg" }
  ]
}
```

## 🎨 Personalización

### **Estilos CSS Disponibles:**

```css
/* Contenedores de medios */
.media-container { }
.video-container { }
.gif-container { }

/* Galería de medios */
.media-gallery-content { }
.gallery-media-item { }
.media-thumbnail { }

/* Controles */
.media-control-btn { }
.media-type-badge { }
```

### **Clases de Estado:**
- `.active` - Elemento activo en la galería
- `.secondary-media` - Medios secundarios en tarjetas
- `.video-badge`, `.gif-badge`, `.image-badge` - Badges de tipo

## 🔧 Configuración Técnica

### **URLs de Medios:**
- **URLs completas:** Se usan tal como están
- **Rutas relativas:** Se construyen con la URL base configurada

### **Optimización:**
- **Videos:** Usar MP4 + WebM para mejor compatibilidad
- **Imágenes:** Optimizar para web (WebP recomendado)
- **GIFs:** Mantener tamaño razonable (< 5MB)
- **Miniaturas:** 150x150px recomendado

## 📱 Responsive Design

El sistema se adapta automáticamente a diferentes tamaños de pantalla:

- **Desktop:** Galería completa con controles
- **Tablet:** Galería optimizada con controles táctiles
- **Móvil:** Galería compacta con navegación por swipe

## 🌍 Traducciones

### **Nuevas Claves de Traducción:**
```javascript
'view_all_media': 'Ver Medios',
'media_gallery': 'Galería de Medios',
'video': 'Video',
'gif': 'GIF',
'image': 'Imagen'
```

## 🧪 Pruebas

### **Archivo de Prueba:**
- `test_media_system.html` - Demostración del sistema completo

### **Cómo Probar:**
1. Abrir `test_media_system.html` en el navegador
2. Ver productos con diferentes tipos de medios
3. Hacer clic en "Ver Medios" para abrir la galería
4. Navegar entre diferentes medios

## 🚀 Implementación en Producción

### **Pasos:**
1. **Subir archivos de medios** al servidor
2. **Actualizar catálogo** con la nueva estructura `media`
3. **Configurar URLs base** en `getMediaUrl()`
4. **Probar en diferentes dispositivos**

### **Consideraciones:**
- **CDN:** Usar CDN para mejor rendimiento
- **Compresión:** Comprimir videos e imágenes
- **Caché:** Configurar headers de caché apropiados
- **Fallbacks:** Asegurar fallbacks para medios no disponibles

## 🐛 Solución de Problemas

### **Problemas Comunes:**

1. **Medios no se cargan:**
   - Verificar URLs y rutas
   - Comprobar permisos de archivos
   - Revisar consola del navegador

2. **Videos no se reproducen:**
   - Verificar formatos soportados (MP4/WebM)
   - Comprobar codecs de video
   - Revisar políticas de autoplay

3. **Galería no se abre:**
   - Verificar estructura de datos JSON
   - Comprobar que `showMediaGallery` esté definido
   - Revisar errores en consola

## 📈 Rendimiento

### **Optimizaciones Implementadas:**
- **Lazy loading** de medios
- **Preload metadata** para videos
- **Miniaturas** para navegación rápida
- **Compresión** automática de imágenes
- **Caché** de elementos de galería

### **Métricas Recomendadas:**
- **Tiempo de carga:** < 3 segundos
- **Tamaño de video:** < 10MB
- **Tamaño de imagen:** < 2MB
- **Tamaño de GIF:** < 5MB

---

## 🎉 ¡Sistema Listo!

El sistema de medios está completamente implementado y listo para usar. Solo necesitas:

1. **Agregar tus archivos de medios**
2. **Actualizar el catálogo** con la nueva estructura
3. **¡Disfrutar de la nueva experiencia visual!**

Para más información o soporte, consulta los archivos de ejemplo o contacta al equipo de desarrollo.
