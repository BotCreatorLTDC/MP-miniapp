# Videos de Bienvenida

Esta carpeta contiene los videos de bienvenida para la miniapp MP Global Corp.

## Archivos Requeridos

Para que la pantalla de bienvenida funcione correctamente, necesitas agregar los siguientes archivos:

### 1. Video Principal (MP4)
- **Archivo:** `welcome.mp4`
- **Formato:** MP4 (H.264)
- **Resolución:** 1920x1080 (Full HD) o superior
- **Duración:** 10-30 segundos (se reproduce en loop)
- **Tamaño:** Máximo 10MB para mejor rendimiento

### 2. Video Alternativo (WebM)
- **Archivo:** `welcome.webm`
- **Formato:** WebM (VP9)
- **Resolución:** 1920x1080 (Full HD) o superior
- **Duración:** 10-30 segundos (se reproduce en loop)
- **Tamaño:** Máximo 8MB para mejor rendimiento

## Especificaciones Técnicas

### Resolución Recomendada
- **Mínimo:** 1280x720 (HD)
- **Recomendado:** 1920x1080 (Full HD)
- **Óptimo:** 2560x1440 (2K) o 3840x2160 (4K)

### Aspectos Técnicos
- **Codec de video:** H.264 (MP4) / VP9 (WebM)
- **Codec de audio:** AAC (MP4) / Opus (WebM)
- **Frame rate:** 24-30 fps
- **Bitrate:** 2-5 Mbps

### Contenido del Video
El video debe ser:
- **Temático:** Relacionado con cannabis premium o productos naturales
- **Profesional:** Calidad cinematográfica
- **Atractivo:** Visualmente impactante
- **Apropiado:** Contenido profesional, no explícito
- **Loop-friendly:** El final debe conectar suavemente con el inicio

## Fallback

Si no se proporcionan videos o hay errores de carga, la aplicación mostrará automáticamente un fondo degradado con efectos visuales CSS como fallback.

## Optimización

Para mejor rendimiento:
1. Comprime los videos usando herramientas como HandBrake o FFmpeg
2. Usa resoluciones apropiadas para dispositivos móviles
3. Considera crear versiones de diferentes tamaños para diferentes dispositivos
4. Prueba la carga en conexiones lentas

## Herramientas Recomendadas

- **HandBrake:** Para compresión de video
- **FFmpeg:** Para conversión de formatos
- **Adobe Premiere Pro:** Para edición profesional
- **DaVinci Resolve:** Alternativa gratuita para edición

## Ejemplo de Comando FFmpeg

```bash
# Convertir a MP4 optimizado
ffmpeg -i input_video.mov -c:v libx264 -crf 23 -c:a aac -b:a 128k -movflags +faststart welcome.mp4

# Convertir a WebM optimizado
ffmpeg -i input_video.mov -c:v libvpx-vp9 -crf 30 -b:v 0 -b:a 128k -c:a libopus welcome.webm
```
