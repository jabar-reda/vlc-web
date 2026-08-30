# VLC Web

A minimalist, black-and-white **web media player** inspired by VLC. It plays video, audio, images, text files, subtitles and playlists entirely in the browser — no installation, no server, no build tools. Just open `index.html`.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## How to run

Double-click `index.html` (or open it in any browser via `file://`). That's it. No dependencies, no `npm install`, no build step.

Everything runs client-side with plain HTML + CSS + JavaScript:
- `index.html` — the page and inline SVG icons
- `style.css` — the styling
- `app.js` — all the player logic (single file, no imports)
- `assets/` — the logo and favicon

## Features

| Feature | Description |
| --- | --- |
| 🎬 Video / 🎵 Audio | HTML5 playback of common web formats (MP4, WebM, MP3, WAV, OGG, …) |
| 🖼️ Images | View PNG, JPG, GIF, WebP, SVG and more |
| 📄 Text & subtitles | Read TXT, MD, SRT, VTT, ASS, CSV, JSON, logs… |
| 📃 Playlists | Open `.m3u` / `.m3u8` / `.pls` files (local and remote URLs) |
| 🧲 Drag & drop | Drop any number of files anywhere on the page |
| 📝 Playlist | Click any item to play, auto-advance, clear with one button |
| 🔀 Shuffle / 🔁 Loop | Randomized or repeated playback |
| ⏯️ Transport | Play / pause, stop, previous / next, ±10s seeking |
| 🔊 Volume | Filled volume slider, mute toggle, keyboard control |
| ⛶ Fullscreen | One-click fullscreen with an auto-updating icon |
| ⌨️ Shortcuts | Space, arrows, N/P, M, F, S — no mouse needed |

## Supported formats

Everything the browser's media stack supports is accepted by the file picker and the drop zone:

- **Video**: MP4 (H.264), WebM (VP8/VP9), OGV, MPEG, and whatever else your browser can decode.
- **Audio**: MP3, WAV, OGG, M4A, and more.
- **Images**: PNG, JPG, GIF, WebP, SVG, BMP, AVIF.
- **Text / data**: TXT, MD, SRT, VTT, ASS, CSV, JSON, XML, log files, and any extension — unknown files open as text.
- **Playlists**: M3U, M3U8, PLS.

> **Note**: The browser can only play what it supports natively. Rare containers such as MKV, AVI or FLAC will be added to the playlist but may not decode without a codec plugin. For those, use the desktop VLC application.

## Design

- Pure black & white palette with subtle grey for secondary elements.
- Monospace typography for a technical, terminal-like feel.
- **Lucide** line icons (https://lucide.dev) — stroke-based SVGs inlined in `index.html` that use `currentColor`, so they adapt automatically to the white-on-black theme, including inverted active states.

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
