# AGENTS.md — VLC Web

Guidance for coding agents working in this repository. The contributor-facing rules live in
[`CONTRIBUTING.md`](CONTRIBUTING.md) — it is the source of truth for conventions, the manual test
checklist, and the contribution flow. This file adds what you cannot infer from the files alone.

## What this is

A zero-dependency, no-build vanilla-JS media player in three files:

| File | Role |
| --- | --- |
| `index.html` | Markup + inline Lucide `<symbol>` icons (`currentColor`) |
| `style.css` | All styling — monochrome, monospace |
| `app.js` | The entire application, loaded as a classic `<script src>` at the end of `<body>` |

`READMEs/` holds five translated READMEs (`ar`, `fr`, `es`, `de`, `zh`). `assets/` holds the logo,
favicon, and the README screenshot.

## Hard constraints — violating these breaks the project

1. **The app must work when `index.html` is opened directly from `file://`.** Everything else follows
   from this: no `import`/`export`, no `type="module"`, no `package.json`, no npm/yarn/pnpm, no
   `node_modules`, no bundler/transpiler, no new source files (all logic stays in `app.js`), and no
   `fetch()` of app assets. Browsers block module loading on `file://` — that is *why* it is one file.
2. **No automated test suite, linter, formatter, or typechecker exists, by design.** Do not add one,
   and do not run `npm`/`npx`/`yarn` commands — there is nothing to install.
3. **No emojis** in code, comments, docs, or translations. Monochrome, technical tone everywhere.

## Verify before you finish

- `node --check app.js` — the **only** automated check, and it is a *syntax* check, not a behavior
  test. CI (`.github/workflows/ci.yml`, Node 20) runs exactly this on every push and PR.
- **Behavior is verified manually**: open `index.html` from `file://` and walk the relevant rows of
  the checklist in `CONTRIBUTING.md` → "How to test manually", with the DevTools console open.
  A local server (`python -m http.server 8123`) is a convenience only — never treat HTTP-only
  verification as sufficient, because HTTP hides exactly the failures this project cares about.
- For pure-logic changes, a throwaway Node script that loads `app.js` in a `vm` sandbox with a
  stubbed DOM works well (load the file, append `globalThis.__x = { ... }` to export the functions
  you need). Two traps: the sandbox must provide a **real `URL` constructor** (a stub without
  `new URL` makes pathname-based logic silently fall back), and `Element` must exist if any
  `instanceof Element` check runs. Keep such a script outside the repo — the owner does not want
  test infrastructure added.

## `app.js` map

Order is load-bearing: **constants → helpers → services → wiring** (a function referenced before its
definition is unavailable at runtime).

- Services: `PlayerService` (state + playback), `DragDropService`, `KeyboardService`.
- **The UI is event-driven, not polled.** Sources of truth: `timeupdate`, `play`, `pause`,
  `loadedmetadata`, `durationchange`, `volumechange`, `fullscreenchange`. A `setInterval(updateState)`
  poller existed and was deliberately removed — do not reintroduce polling.
- `renderPlaylist()` runs **only on state change**: `loadItem` (which also covers `addUrl`),
  `addFiles`, `clearPlaylist`. Adding a UI indicator means hooking an existing media event and
  calling `renderPlaylist()` where the state actually changes.

## Invariants that are easy to break

- **Playlist entry names are untrusted input** (they come from remote `.m3u`/`.pls` files). Build
  playlist rows and the now-playing line with `createElement` + `textContent`; `innerHTML` is only
  for static strings. `escapeHTML()` was deleted on purpose — do not re-add it.
- **Object URL split**: local files use `URL.createObjectURL` and must be revoked on playlist clear
  and on unload; remote entries are flagged `remote: true` and must **never** be revoked. Known
  pre-existing gap: the temporary base object URL created for playlist files in `addFiles()` is
  never revoked.
- **Dropped links (`addUrl`)**: `http`/`https` only — other protocols are rejected with a message.
  The media type is classified from the URL **pathname** (a `?query` or `#hash` in the URL breaks
  extension matching), and the display label is derived from the pathname too.
- **Keyboard handler**: keys are ignored while an `INPUT` has focus, and `Space`/`Enter` are ignored
  inside a `<button>` (otherwise a focused button fires both the shortcut and its own click).
- **Icons** are inline Lucide `<symbol>` elements in `index.html` using `currentColor` — no icon
  library, no icon font, no external asset.

## Docs

- `README.md` is the source of truth; the five files in `READMEs/` mirror it. When behavior changes,
  update **all six**, or the translations will document behavior that no longer exists.
- Files inside `READMEs/` need the `../` prefix for relative links (`../LICENSE`, `../app.js`,
  `../CONTRIBUTING.md`, `../CODE_OF_CONDUCT.md`, `../SECURITY.md`, `../assets/...`).
- **The owner rejected a badge row in the READMEs (October 2026)** — do not reintroduce badges or
  shields.io decorations without asking first.

## Git and delivery

- Commits: Conventional Commits, one concern per commit, English, concise (e.g.
  `fix: classify remote links by pathname`). Branches: `type/short-description`.
- A PR description must answer *what changed / why / how to test* and confirm the `file://`
  constraint still holds (see `.github/pull_request_template.md`).
- **Owner's own workflow**: small/docs-only changes are committed straight to `main`; behavior
  changes go through a branch + PR so CI and a review pass run first (PR #1 was merged that way).
  `CONTRIBUTING.md` still describes the contributor-facing issue → branch → PR flow; keep both in
  mind rather than assuming one replaces the other.
- Merging to `main` publishes the site via GitHub Pages → `https://jabar-reda.github.io/vlc-web/`.
- Environment notes: `gh` is authenticated as `jabar-reda`; in PowerShell, `gh api --jq` breaks
  when the jq expression contains spaces or `+` (it is split into several arguments) — parse the
  JSON with `ConvertFrom-Json` instead. After deleting a branch, `git remote prune origin` drops
  the stale remote-tracking ref.

## Working with the owner

- The owner is learning Clean Code and reviews changes closely; state the *why* briefly, in
  Arabic. Code, comments, commit messages, and documentation stay in English.
- Expected rhythm: plan → implement (a subagent may do the editing) → **review the diff yourself**
  before anything is pushed. That review step is not optional; it is what caught the real bugs
  (an inverted regex flag, an XSS sink, a query-string misclassification) in previous rounds.
