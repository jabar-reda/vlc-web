# VLC Web

<p align="center">
  <a href="https://jabar-reda.github.io/vlc-web/">
    <img src="assets/vlc512x512.png" alt="VLC Web" width="128">
  </a>
</p>

<p align="center">一款受 VLC 启发的极简黑白网页媒体播放器。</p>

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

[![VLC Web screenshot](assets/screenshot.png)](https://jabar-reda.github.io/vlc-web/)

---

## 使用方法

### ▶ 在线使用（GitHub Pages）

在任意浏览器中打开 **https://jabar-reda.github.io/vlc-web/** 即可。就这么简单——通过 HTTPS 从任何地方访问。

###  本地使用（file://）

双击 `index.html`（或通过 `file://` 在任意浏览器中打开）。无需依赖，无需 `npm install`，无需构建步骤。

## 功能特性

| 功能 | 说明 |
| --- | --- |
|  视频 /  音频 | HTML5 播放常见网页格式（MP4、WebM、MP3、WAV、OGG 等） |
|  图片 | 查看 PNG、JPG、GIF、WebP、SVG 等格式 |
|  文本与字幕 | 阅读 TXT、MD、SRT、VTT、ASS、CSV、JSON、日志等文件 |
|  播放列表 | 打开 `.m3u` / `.m3u8` / `.pls` 文件（本地及远程 URL） |
|  远程流 | 拖放或加载 HTTP(S) 链接，直接流式播放 |
|  拖放 | 将任意数量的文件拖放到页面任意位置 |
|  播放列表 | 点击任意项目播放，自动推进，一键清空 |
|  随机 /  循环 | 随机或重复播放 |
| ⏯ 播放控制 | 播放 / 暂停、停止、上一个 / 下一个、±10 秒跳转 |
|  音量 | 音量滑块及静音切换 |
|  全屏 | 一键全屏，图标自动更新 |

## 键盘快捷键

| 按键 | 操作 |
| --- | --- |
| `Space` | 播放 / 暂停 |
| `` / `` | 后退 / 前进 10 秒 |
| `` / `` | 增大 / 减小音量 |
| `N` / `P` | 下一个 / 上一个 |
| `M` | 静音 / 取消静音 |
| `F` | 切换全屏 |
| `S` | 停止 |

## 支持的格式

文件选择器和拖放区域接受浏览器媒体原生支持的所有格式：

- **视频**：MP4（H.264）、WebM（VP8/VP9）、MKV、AVI、MOV、OGV、MPEG、M2TS、TS、FLV、WMV、3GP 等。
- **音频**：MP3、WAV、M4A、AAC、FLAC、OGG、OPUS、WMA、AIFF、MIDI、AMR 等。
- **图片**：PNG、JPG、GIF、WebP、SVG、BMP、ICO、AVIF、TIFF、JXL。
- **文本 / 数据**：TXT、MD、SRT、VTT、ASS、CSV、JSON、XML、日志文件及任意扩展名——未知文件以文本方式打开。
- **播放列表**：M3U、M3U8、PLS。

> **注意**：浏览器只能原生播放其支持的格式。罕见容器格式（如 MKV、AVI 或 FLAC）会被添加到播放列表中，但在没有编解码器插件的情况下可能无法解码。如需播放这些格式，请使用桌面版 VLC 应用。同样，非 HTTP 远程链接（rtsp、rtmp、mms、ftp）会被添加到播放列表中，但无法在浏览器中流式播放。

## 设计

- 纯黑白配色，辅以微妙的灰色用于次要元素。
- 等宽字体排版，营造技术感和终端般的风格。
- **Lucide** 线性图标（https://lucide.dev）——基于描边的 SVG 内联于 `index.html` 中，使用 `currentColor`，自动适配白底黑字主题，包括反色的激活状态。

## 架构

所有功能均通过单个 `app.js` 经典 `<script>` 运行，因为浏览器在 `file://` 协议下会阻止 ES 模块 `import`。单文件打包使播放器在零构建工具、零依赖、无需服务器的环境下正常工作。UI 状态通过固定的 `setInterval(updateState, 100)` 刷新，文件通过 `URL.createObjectURL` 加载，对象 URL 在卸载时撤销。

## 项目结构

```
VLC/
├── index.html   # 页面标记 + 内联 SVG 图标
├── style.css    # 样式（单色、等宽字体 UI）
├── app.js       # 所有播放器逻辑（单文件，无 import）
└── assets/      # 标志、网站图标、截图
```

## 浏览器支持

- 支持现代 Chrome、Edge、Firefox 和 Safari——桌面端和移动端均可。
- 完全通过 `file://` 运行，无需服务器。
- 播放浏览器媒体原生支持的所有格式（参见[支持的格式](#支持的格式)）。

## 许可证

本项目基于 **MIT 许可证**发布——详见 [LICENSE](LICENSE) 文件。
