# Contributing to VLC Web

First off, thank you for considering a contribution to VLC Web. This document describes how to set up the project, how to make a change, what conventions to follow, and how to get your work merged. Please read it fully before submitting anything.

---

## The sacred `file://` constraint

**VLC Web must keep working when opened directly from `file://`.** This is not a nice-to-have; it is the single most important design decision in the project and the one constraint that overrides everything else.

The application is intentionally zero-dependency vanilla JavaScript with no build tools and no package manager. A user should be able to download or clone the repository and double-click `index.html` in any modern browser and have a fully working player. No server. No `npm install`. No build step.

The reason: browsers block ES-module `import`/`export` statements and module loading on pages served from `file://`. That is exactly why all player logic lives in a **single** plain `<script>` in `app.js` (loaded with a classic `<script src>` tag, not `type="module"`).

> ### Rules that must not be broken
>
> - No `import` / `export` syntax. Ever. No ES modules, no `type="module"`.
> - No external module loading, no `node_modules`, no packages.
> - No build tools, bundlers, transpilers, or compilation steps.
> - No package managers — no `npm`, no `yarn`, no `pnpm` (and no `package.json`).
> - No features that require a web server. In particular: do not `fetch()` HTTP resources to load app assets, do not rely on any backend, and do not introduce cross-origin restrictions that only work over HTTP.
> - Nothing may rely on a domain, an origin, or being served — the app must behave identically from `file://`.

If a proposed change can only work when served over HTTP, it does not belong in this project. When in doubt, ask yourself: *will this still work if I close the server and double-click `index.html`?* If the answer is no, rethink the approach.

---

## Getting started

### Clone the repository

```sh
git clone https://github.com/jabar-reda/vlc-web.git
cd VLC-Web
```

### Open the app locally

There is no install step and no build step. Simply open `index.html`:

- **Windows:** double-click `index.html` in File Explorer, or run:

  ```sh
  start index.html
  ```

- **macOS:** `open index.html`

- **Linux:** `xdg-open index.html`

The app runs entirely from the local file system. You do not need a web server, and nothing about the workflow requires one. If you prefer to test over HTTP for your own convenience you may, but the app must also work from `file://` — remember the constraint above.

---

## Project structure

```
VLC/
├── index.html        # Page markup + inline SVG icons (<symbol> elements using currentColor)
├── style.css         # All styling — monochrome, monospace UI
├── app.js            # The entire application (see below)
├── assets/
│   ├── vlc512x512.png  # Logo
│   ├── favicon.ico     # Favicon
│   └── screenshot.png  # README screenshot
└── CONTRIBUTING.md   # This file
```

`app.js` is deliberately heavy. It contains, in order:

| Section | Contents |
| --- | --- |
| Constants | `EXT_PATTERNS` and similar module-level data |
| Helpers | `classify`, `readM3U`, `readPLS`, `formatTime`, and other plain functions |
| Services | `PlayerService`, `DragDropService`, `KeyboardService` |
| Wiring | DOM lookup and event binding for media events (`timeupdate`, `play`/`pause`, `loadedmetadata`/`durationchange`, `volumechange`) |

**Order matters.** Helpers, constants, and classes must be defined before the wiring code that uses them. The script runs top-to-bottom, so a function referenced too early will be unavailable at runtime. Keep the structure: constants → helpers → classes → wiring.

---

## Development workflow

1. **Check for an existing issue.** Before starting, search the issue tracker to see if the problem or feature is already being discussed.
2. **Create or claim an issue.** For anything beyond a trivial typo fix, open an issue first and outline your approach. This avoids wasted work and duplicated effort.
3. **Create a branch.** Branch from the latest `main`. Name it descriptively, e.g. `add-keyboard-mute-shortcut` or `fix-playlist-revocation.
4. **Make your change.** Follow the code style and conventions described below.
5. **Test manually.** There is no automated test suite by design (see *How to test manually*). Verify your change against the checklist.
6. **Open a pull request.** Reference the issue in the PR description, summarize what you changed and why, and note anything a reviewer should test.

Keep changes small and focused. A PR that does one thing well is far easier to review and merge than a large, sprawling diff.

---

## Code style & conventions

- **Plain `function`s and `class`es only.** No JSX, no TypeScript syntax, no arrow-function-heavy frameworks. The codebase is written in straightforward ES5/ES6-compatible vanilla JavaScript.
- **No `import` / `export`** anywhere, under any circumstances. See the constraint above.
- **Keep all logic in `app.js`.** Do not split the application into modules or files. The browser `file://` security model (and the single-`<script>` design) is exactly why everything lives in one file. Adding files or modules breaks that.
- **Keep helpers before wiring.** Define constants, helper functions, and classes before the wiring that consumes them. Order within the file matters and must be preserved.
- **No `node_modules`, no build tooling, no package manager artifacts.** If your change would require adding one, stop and reconsider.
- **Match the existing style.** When editing, mirror the surrounding code: naming conventions, formatting, indentation, and comment style (sparse; the project favors self-documenting code).
- **No emojis** in code, comments, or documentation.
- **Monochrome, technical tone** in any user-facing strings and documentation, consistent with the minimalist UI.

---

## UI & icon conventions

- **Icons are raw inline Lucide SVGs** defined as `<symbol>` elements in `index.html`.
- Icons use `currentColor` so they inherit the theme automatically. When adding or modifying an icon, edit the inline `<symbol>` in `index.html` — do **not** add a JavaScript icon library, icon font, or external asset.
- Keep the UI monochrome and monospace. Styling lives in `style.css`; do not introduce color themes, images, or non-monospace fonts as a normal part of the UI.
- UI state updates from media events (`timeupdate`, `play`/`pause`, `loadedmetadata`/`durationchange`, `volumechange`), and `renderPlaylist()` runs only when the playlist changes (`loadItem` — which also covers `addUrl` — `addFiles`, and `clearPlaylist`). Follow this pattern rather than introducing a one-off rendering mechanism for new UI.

### Media-file and resource handling

- Locally dropped or opened files are loaded via `URL.createObjectURL`. These object URLs must be revoked (`URL.revokeObjectURL`) on unload and when the playlist is cleared, to avoid memory leaks.
- Remote URLs (`http`, `rtsp`, and similar) must be flagged with `remote: true` and are **never** revoked.
- Any new path that handles local files must respect this revoke/never-revoke split.

---

## How to test manually

There is **no automated test suite, linter, or typechecker** — the project is intentionally minimal, and this is by design. Verification is manual. After any change, run through the relevant parts of this checklist by opening `index.html` from `file://` (not a server).

> ### Manual testing checklist
>
> | Test area | What to verify |
> | --- | --- |
> | Opening files | Clicking open loads local media and it plays/pauses/seeks correctly. |
> | Dragging files | Dragging one or more files onto the window adds them to the playlist and plays as expected. |
> | Playlists | `.m3u` and `.pls` files are parsed correctly (`readM3U` / `readPLS`); entries appear in order with correct titles. |
> | Keyboard shortcuts | All documented shortcuts work; nothing throws in the console. |
> | Remote streams | Opening an `http(s)` link works; other protocols are rejected with a message. Playlist entries carry `remote: true` and are never revoked on clear. |
> | UI refresh | Time, position, and state indicators update from media events (`timeupdate`, `play`/`pause`, `loadedmetadata`/`durationchange`, `volumechange`). |
> | Clear playlist | Clearing revokes object URLs for local files and does not error on remote ones. |
> | Icons | Any new/edited SVG `<symbol>` renders with `currentColor` in both light and (if present) dark contexts. |
> | `file://` from scratch | Start from a clean state by double-clicking `index.html`; nothing depends on a server or origin. |
> | Basic playback | Load, play, pause, seek, volume, mute, and playlist navigation behave correctly end to end. |

If a change touches JavaScript, keep the browser DevTools console open and confirm there are no errors or warnings introduced by your change.

---

## Submitting changes

The canonical flow is **issue → branch → pull request**.

1. **Issue first.** File a bug report or feature request describing the problem or desired behavior. Many contributors find it useful to propose the approach there before writing code.
2. **Branch from `main`.** Give the branch a short, descriptive name describing the change.
3. **Commit in logical pieces** with concise, descriptive messages (see below).
4. **Open a pull request** against `main`. In the description:
   - Reference the issue it closes (e.g. `Closes #12`).
   - Summarize the change and the reasoning.
   - Describe how you tested it, and flag any manual-test areas a reviewer should re-verify.
   - Explicitly confirm the `file://` constraint is respected.

### Commit message style

Keep commit messages concise and matching the repo's tone — a short imperative summary of what the change does, optionally with a brief body explaining why. Follow the project's existing history for style. Example:

```sh
Add mute keyboard shortcut
```

```sh
Fix object URL revocation on playlist clear
```

Avoid vague messages like `update files` or `stuff`.

---

## Don't forget

A quick checklist before you submit:

- [ ] The app still works when opened directly from `file://` — no server, no origin.
- [ ] No `import`/`export`, no ES modules, no `type="module"`.
- [ ] No `node_modules`, build tools, or package manager files added.
- [ ] No HTTP `fetch` of app assets introduced.
- [ ] All new logic lives in `app.js`, in the correct order (helpers before wiring).
- [ ] New/modified icons are inline `<symbol>` SVGs using `currentColor` in `index.html`.
- [ ] Local object URLs are revoked where required; remote URLs are flagged `remote: true` and never revoked.
- [ ] Ran through the relevant manual testing checklist with no console errors.
- [ ] No emojis or color-theme additions.
- [ ] Commit message is concise and matches the repo's style.
- [ ] Created a focused branch and PR referencing the issue.

---

Thank you for contributing to VLC Web — a small, dependency-free media player that just works from a file.

## License

VLC Web is released under the MIT License. See the `LICENSE` file in the repository for details. By contributing, you agree that your contributions are licensed under the same terms.
