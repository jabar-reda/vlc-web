# VLC Web

<p align="center">
  <a href="https://jabar-reda.github.io/vlc-web/">
    <img src="assets/vlc512x512.png" alt="VLC Web" width="128">
  </a>
</p>

<p align="center">A minimalist, black-and-white web media player inspired by VLC.</p>

<p align="center">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"></a>
  <a href="https://jabar-reda.github.io/vlc-web/"><img alt="Live demo" src="https://img.shields.io/website?url=https%3A%2F%2Fjabar-reda.github.io%2Fvlc-web%2F&label=live%20demo&style=flat-square"></a>
  <a href="app.js"><img alt="JS: vanilla" src="https://img.shields.io/badge/JS-vanilla-lightgrey?style=flat-square"></a>
  <a href="https://github.com/jabar-reda/vlc-web/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/jabar-reda/vlc-web/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://jabar-reda.github.io/vlc-web/"><img alt="Deploy" src="https://github.com/jabar-reda/vlc-web/actions/workflows/dynamic/pages/pages-build-deployment/badge.svg"></a>
</p>

<p align="center">
  <img alt="Dependencies" src="https://img.shields.io/badge/dependencies-0-lightgrey?style=flat-square">
  <img alt="No build step" src="https://img.shields.io/badge/build-none%20required-lightgrey?style=flat-square">
  <img alt="Runs fully local" src="https://img.shields.io/badge/runs%20fully%20local-lightgrey?style=flat-square">
  <img alt="Browsers" src="https://img.shields.io/badge/browsers-chrome%20firefox%20safari%20edge-lightgrey?style=flat-square">
  <a href="https://github.com/jabar-reda/vlc-web/tree/main/READMEs"><img alt="Languages" src="https://img.shields.io/badge/README-5%20languages-lightgrey?style=flat-square"></a>
  <a href="https://github.com/jabar-reda/vlc-web/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/jabar-reda/vlc-web?style=flat-square"></a>
  <a href="https://github.com/jabar-reda/vlc-web/network/members"><img alt="Forks" src="https://img.shields.io/github/forks/jabar-reda/vlc-web?style=flat-square"></a>
  <a href="https://github.com/jabar-reda/vlc-web/issues"><img alt="Issues" src="https://img.shields.io/github/issues/jabar-reda/vlc-web?style=flat-square"></a>
  <a href="https://github.com/jabar-reda/vlc-web/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/jabar-reda/vlc-web?style=flat-square"></a>
  <a href="CONTRIBUTING.md"><img alt="Contributing" src="https://img.shields.io/badge/contributions-welcome-blue?style=flat-square"></a>
  <a href="CODE_OF_CONDUCT.md"><img alt="Code of conduct" src="https://img.shields.io/badge/code%20of%20conduct-Contributor%20Covenant%202.1-blue?style=flat-square"></a>
  <a href="SECURITY.md"><img alt="Security policy" src="https://img.shields.io/badge/security-policy-blue?style=flat-square"></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="READMEs/README.ar.md">العربية</a> |
  <a href="READMEs/README.fr.md">Français</a> |
  <a href="READMEs/README.es.md">Español</a> |
  <a href="READMEs/README.de.md">Deutsch</a> |
  <a href="READMEs/README.zh.md">中文</a>
</p>

[![VLC Web screenshot](assets/screenshot.png)](https://jabar-reda.github.io/vlc-web/)

---

## How to use

###  Online (GitHub Pages)

Open **https://jabar-reda.github.io/vlc-web/** in any browser. That's it — works over HTTPS from anywhere.

###  Local (file://)

Double-click `index.html` (or open it in any browser via `file://`). No dependencies, no `npm install`, no build step.

## Features

| Feature | Description |
| --- | --- |
|  Video /  Audio | HTML5 playback of common web formats (MP4, WebM, MP3, WAV, OGG, …) |
|  Images | View PNG, JPG, GIF, WebP, SVG and more |
|  Text & subtitles | Read TXT, MD, SRT, VTT, ASS, CSV, JSON, logs… |
|  Playlists | Open `.m3u` / `.m3u8` / `.pls` files (local and remote URLs) |
|  Remote streams | Drop or load an HTTP(S) link and stream it directly (http/https, media extension required) |
|  Drag & drop | Drop any number of files anywhere on the page |
|  Playlist | Click any item to play, auto-advance, clear with one button |
|  Shuffle /  Loop | Randomized or repeated playback |
|  Transport | Play / pause, stop, previous / next, ±10s seeking |
|  Volume | Volume slider with mute toggle |
|  Fullscreen | One-click fullscreen with an auto-updating icon |

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `` / `` | Rewind / forward 10s |
| `` / `` | Volume up / down |
| `N` / `P` | Next / previous |
| `M` | Mute / unmute |
| `F` | Toggle fullscreen |
| `S` | Stop |

## Supported formats

Everything the browser's media stack supports is accepted by the file picker and the drop zone:

- **Video**: MP4 (H.264), WebM (VP8/VP9), MKV, AVI, MOV, OGV, MPEG, M2TS, TS, FLV, WMV, 3GP and more.
- **Audio**: MP3, WAV, M4A, AAC, FLAC, OGG, OPUS, WMA, AIFF, MIDI, AMR and more.
- **Images**: PNG, JPG, GIF, WebP, SVG, BMP, ICO, AVIF, TIFF, JXL.
- **Text / data**: TXT, MD, SRT, VTT, ASS, CSV, JSON, XML, log files, and any extension — unknown files open as text.
- **Playlists**: M3U, M3U8, PLS.

> **Note**: The browser can only play what it supports natively. Rare containers such as MKV, AVI or FLAC are added to the playlist but may not decode without a codec plugin. For those, use the desktop VLC application. Dropping a link directly accepts `http(s)` only — the link is classified by its path extension, so it needs a supported media extension; other protocols are rejected with a message. Non-HTTP entries found *inside* playlist files are added to the list but cannot be streamed in the browser.

## Design

- Pure black & white palette with subtle grey for secondary elements.
- Monospace typography for a technical, terminal-like feel.
- **Lucide** line icons (https://lucide.dev) — stroke-based SVGs inlined in `index.html` that use `currentColor`, so they adapt automatically to the white-on-black theme, including inverted active states.

## Architecture

Everything runs from a single `app.js` classic `<script>`, because browsers block ES module `import`s on `file://`. One bundled file keeps the player working with zero build tools, zero dependencies and no server. UI state is updated from media events (`timeupdate`, `play`/`pause`, `loadedmetadata`/`durationchange`, `volumechange`), the playlist re-renders when its contents or the current item change, and files are loaded through `URL.createObjectURL` with object URLs revoked on unload.

## Project structure

```
vlc-web/
├── index.html   # page markup + inline SVG icons
├── style.css    # styling (monochrome, monospace UI)
├── app.js       # all player logic (single file, no imports)
└── assets/      # logo, favicon, screenshot
```

## Browser support

- Works in modern Chrome, Edge, Firefox and Safari — desktop and mobile.
- Runs fully from `file://` — no server required.
- Plays whatever your browser's media stack supports natively (see [Supported formats](#supported-formats)).

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
