# VLC Web

<p align="center">
  <a href="https://jabar-reda.github.io/vlc-web/">
    <img src="assets/vlc512x512.png" alt="VLC Web" width="128">
  </a>
</p>

<p align="center">Un reproductor multimedia web minimalista en blanco y negro inspirado en VLC.</p>

<p align="center">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"></a>
  <a href="https://jabar-reda.github.io/vlc-web/"><img alt="Live demo" src="https://img.shields.io/website?url=https%3A%2F%2Fjabar-reda.github.io%2Fvlc-web%2F&label=live%20demo&style=flat-square"></a>
  <a href="app.js"><img alt="JS: vanilla" src="https://img.shields.io/badge/JS-vanilla%20zero%20deps-yellow?style=flat-square"></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.zh.md">中文</a>
</p>

[![Captura de VLC Web](assets/screenshot.png)](https://jabar-reda.github.io/vlc-web/)

---

## Cómo usarlo

### ▶ En línea (GitHub Pages)

Abre **https://jabar-reda.github.io/vlc-web/** en cualquier navegador. Así de simple: funciona por HTTPS desde cualquier lugar.

###  Local (`file://`)

Haz doble clic en `index.html` (o ábrelo en cualquier navegador mediante `file://`). Sin dependencias, sin `npm install`, sin paso de compilación.

## Funciones

| Función | Descripción |
| --- | --- |
|  Vídeo /  Audio | Reproducción HTML5 de formatos web habituales (MP4, WebM, MP3, WAV, OGG, …) |
|  Imágenes | Ver PNG, JPG, GIF, WebP, SVG y más |
|  Texto y subtítulos | Leer TXT, MD, SRT, VTT, ASS, CSV, JSON, registros… |
|  Listas de reproducción | Abrir archivos `.m3u` / `.m3u8` / `.pls` (URLs locales y remotas) |
|  Transmisiones remotas | Suelta o carga un enlace HTTP(S) y reprodúcelo directamente |
|  Arrastrar y soltar | Suelta cualquier cantidad de archivos en cualquier parte de la página |
|  Lista de reproducción | Haz clic en cualquier elemento para reproducirlo, avance automático, borrar con un botón |
|  Aleatorio /  Bucle | Reproducción aleatoria o repetida |
| ⏯ Transporte | Reproducir / pausar, detener, anterior / siguiente, ±10 s de avance |
|  Volumen | Control deslizante de volumen con conmutador de silencio |
|  Pantalla completa | Pantalla completa con un clic e icono que se actualiza automáticamente |

## Atajos de teclado

| Tecla | Acción |
| --- | --- |
| `Space` | Reproducir / pausar |
| `` / `` | Retroceder / avanzar 10 s |
| `` / `` | Subir / bajar volumen |
| `N` / `P` | Siguiente / anterior |
| `M` | Silenciar / reactivar sonido |
| `F` | Alternar pantalla completa |
| `S` | Detener |

## Formatos admitidos

Todo lo que admite de forma nativa el sistema multimedia del navegador es aceptado por el selector de archivos y la zona de descarga:

- **Vídeo**: MP4 (H.264), WebM (VP8/VP9), MKV, AVI, MOV, OGV, MPEG, M2TS, TS, FLV, WMV, 3GP y más.
- **Audio**: MP3, WAV, M4A, AAC, FLAC, OGG, OPUS, WMA, AIFF, MIDI, AMR y más.
- **Imágenes**: PNG, JPG, GIF, WebP, SVG, BMP, ICO, AVIF, TIFF, JXL.
- **Texto / datos**: TXT, MD, SRT, VTT, ASS, CSV, JSON, XML, archivos de registro y cualquier extensión — los archivos desconocidos se abren como texto.
- **Listas de reproducción**: M3U, M3U8, PLS.

> **Nota**: el navegador solo puede reproducir lo que admite de forma nativa. Los contenedores poco comunes, como MKV, AVI o FLAC, se añaden a la lista de reproducción pero es posible que no se descodifiquen sin un plugin de códecs. Para ellos, usa la aplicación de escritorio de VLC. Del mismo modo, los enlaces remotos que no usan HTTP (rtsp, rtmp, mms, ftp) se añaden a la lista de reproducción pero no se pueden transmitir en el navegador.

## Diseño

- Paleta pura en blanco y negro con un gris sutil para los elementos secundarios.
- Tipografía monoespaciada para una sensación técnica, de terminal.
- Iconos lineales de **Lucide** (https://lucide.dev): SVGs basados en trazos incrustados en `index.html` que usan `currentColor`, de modo que se adaptan automáticamente al tema blanco sobre negro, incluidos los estados activos invertidos.

## Arquitectura

Todo se ejecuta desde un único `<script>` clásico en `app.js`, porque los navegadores bloquean los `import` de módulos ES en `file://`. Un único archivo agrupado mantiene el reproductor funcionando sin herramientas de compilación, sin dependencias y sin servidor. El estado de la interfaz se actualiza con un `setInterval(updateState, 100)` fijo, y los archivos se cargan mediante `URL.createObjectURL`, revocándose las URLs de objeto al cerrar la página.

## Estructura del proyecto

```
VLC/
├── index.html   # marcado de la página + iconos SVG
├── style.css    # estilos (interfaz monocroma, monoespaciada)
├── app.js       # toda la lógica del reproductor (un solo archivo, sin imports)
└── assets/      # logotipo, favicon, captura
```

## Compatibilidad con navegadores

- Funciona en Chrome, Edge, Firefox y Safari modernos — de escritorio y móviles.
- Se ejecuta por completo desde `file://` — sin necesidad de servidor.
- Reproduce todo lo que el sistema multimedia de tu navegador admite de forma nativa (consulta [Formatos admitidos](#formatos-admitidos)).

## Licencia

Este proyecto está licenciado bajo la **Licencia MIT** — consulta el archivo [LICENSE](LICENSE) para más detalles.
