# VLC Web

<p align="center">
  <a href="https://jabar-reda.github.io/vlc-web/">
    <img src="../assets/vlc512x512.png" alt="VLC Web" width="128">
  </a>
</p>

<p align="center">Un lecteur multimédia web minimaliste, en noir et blanc, inspiré de VLC.</p>

<p align="center">
  <a href="../LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"></a>
  <a href="https://jabar-reda.github.io/vlc-web/"><img alt="Live demo" src="https://img.shields.io/website?url=https%3A%2F%2Fjabar-reda.github.io%2Fvlc-web%2F&label=live%20demo&style=flat-square"></a>
  <a href="../app.js"><img alt="JS: vanilla" src="https://img.shields.io/badge/JS-vanilla%20zero%20deps-yellow?style=flat-square"></a>
</p>

<p align="center">
  <a href="../README.md">English</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.zh.md">中文</a>
</p>

[![VLC Web screenshot](../assets/screenshot.png)](https://jabar-reda.github.io/vlc-web/)

---

## Utilisation

###  En ligne (GitHub Pages)

Ouvrez **https://jabar-reda.github.io/vlc-web/** dans n'importe quel navigateur. C'est tout — fonctionne via HTTPS depuis n'importe où.

###  En local (file://)

Double-cliquez sur `index.html` (ou ouvrez-le dans un navigateur via `file://`). Aucune dépendance, pas de `npm install`, pas de build.

## Fonctionnalités

| Fonctionnalité | Description |
| --- | --- |
|  Vidéo /  Audio | Lecture HTML5 des formats web courants (MP4, WebM, MP3, WAV, OGG, …) |
|  Images | Affichage de PNG, JPG, GIF, WebP, SVG et plus |
|  Texte & sous-titres | Lecture de TXT, MD, SRT, VTT, ASS, CSV, JSON, logs… |
|  Listes de lecture | Ouverture de fichiers `.m3u` / `.m3u8` / `.pls` (locaux et URLs distants) |
|  Flux distants | Déposez ou chargez un lien HTTP(S) et diffusez-le directement |
|  Glisser-déposer | Déposez un nombre quelconque de fichiers n'importe où sur la page |
|  Liste de lecture | Cliquez sur un élément pour lire, avancement automatique, effacement en un clic |
|  Aléatoire /  Boucle | Lecture aléatoire ou en boucle |
|  Contrôles | Lecture / pause, arrêt, précédent / suivant, avance/recul de ±10 s |
|  Volume | Curseur de volume avec bouton muet |
|  Plein écran | Plein écran en un clic avec icône mise à jour automatiquement |

## Raccourcis clavier

| Touche | Action |
| --- | --- |
| `Space` | Lecture / pause |
| `` / `` | Reculer / avancer de 10 s |
| `` / `` | Volume haut / bas |
| `N` / `P` | Suivant / précédent |
| `M` | Couper / rétablir le son |
| `F` | Basculer le plein écran |
| `S` | Arrêter |

## Formats supportés

Tout ce que la pile multimédia du navigateur prend en charge est accepté par le sélecteur de fichiers et la zone de dépôt :

- **Vidéo** : MP4 (H.264), WebM (VP8/VP9), MKV, AVI, MOV, OGV, MPEG, M2TS, TS, FLV, WMV, 3GP et plus.
- **Audio** : MP3, WAV, M4A, AAC, FLAC, OGG, OPUS, WMA, AIFF, MIDI, AMR et plus.
- **Images** : PNG, JPG, GIF, WebP, SVG, BMP, ICO, AVIF, TIFF, JXL.
- **Texte / données** : TXT, MD, SRT, VTT, ASS, CSV, JSON, XML, fichiers log, et toute extension — les fichiers inconnus s'ouvrent en texte.
- **Listes de lecture** : M3U, M3U8, PLS.

> **Remarque** : Le navigateur ne peut lire que ce qu'il supporte nativement. Les conteneurs rares comme MKV, AVI ou FLAC sont ajoutés à la liste de lecture mais peuvent ne pas être décodés sans un plugin de codecs. Pour ceux-là, utilisez l'application desktop VLC. De même, les liens distants hors HTTP (rtsp, rtmp, mms, ftp) sont ajoutés à la liste de lecture mais ne sont pas diffusables dans le navigateur.

## Design

- Palette strictement noire et blanche avec du gris subtil pour les éléments secondaires.
- Typographie à chasse fixe pour un rendu technique, à la manière d'un terminal.
- Icônes **Lucide** en ligne fine (https://lucide.dev) — SVG à trait inclinés, intégrés dans `index.html` et utilisant `currentColor`, ce qui les adapte automatiquement au thème blanc sur noir, y compris pour les états actifs inversés.

## Architecture

Tout s'exécute depuis un seul `<script classique>` dans `app.js`, car les navigateurs bloquent les `import` ES modules en mode `file://`. Un fichier unique permet au lecteur de fonctionner sans aucun outil de build, aucune dépendance et aucun serveur. L'état de l'interface est rafraîchi via un `setInterval(updateState, 100)` fixe, et les fichiers sont chargés via `URL.createObjectURL` avec révocation des URLs objet au déchargement.

## Structure du projet

```
VLC/
├── index.html   # balisage de la page + icônes SVG inline
├── style.css    # style (interface monochrome, police à chasse fixe)
├── app.js       # toute la logique du lecteur (fichier unique, sans import)
└── assets/      # logo, favicon, capture d'écran
```

## Support des navigateurs

- Fonctionne dans les versions modernes de Chrome, Edge, Firefox et Safari — desktop et mobile.
- S'exécute entièrement depuis `file://` — aucun serveur requis.
- Lit tout ce que la pile multimédia de votre navigateur supporte nativement (voir [Formats supportés](#formats-supportés)).

## Licence

Ce projet est distribué sous la **licence MIT** — consultez le fichier [LICENSE](../LICENSE) pour plus de détails.
