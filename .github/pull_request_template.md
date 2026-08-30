# Pull Request

## Description

<!-- Describe the problem this PR solves and the changes it introduces. Be concise and specific. -->

## Summary of changes

- <!-- e.g. Fixed keyboard seek not working with arrow keys -->
- <!-- e.g. Added drag-and-drop reordering for playlist entries -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] UI/style change
- [ ] Docs
- [ ] Refactor
- [ ] Other

## file:// constraint check

> VLC Web is a zero-dependency vanilla JS app that must keep working when opened
> directly from `file://`. All runtime logic lives in a single file, `app.js`,
> loaded as a classic `<script>` (NOT `type="module"`).

Please confirm:

- [ ] I did NOT add any `import`/`export` syntax or ES modules.
- [ ] I did NOT add a build step, `node_modules`, or `package.json`.
- [ ] I kept all runtime logic in `app.js` and did not split it into modules.
- [ ] I did NOT introduce any dependency on a web server (no fetching app assets over HTTP).

## Testing performed

There are no automated tests by design. Please describe the manual verification you performed:

- [ ] Opened `index.html` directly via `file://` (not a server) and it loaded without errors.
- [ ] Opened video/audio files and dragged files onto the player.
- [ ] Loaded M3U/PLS playlists and verified navigation between tracks.
- [ ] Verified keyboard shortcuts behave as expected.
- [ ] Confirmed no browser console errors.

## Checklist

- [ ] I read CONTRIBUTING.md.
- [ ] My code matches the existing conventions (plain functions and classes, no `import`/`export`).
- [ ] If I changed the UI, I used inline `<symbol>` icons with `currentColor` (no JS icon library).
- [ ] I have not committed any secrets or credentials.
- [ ] My commit messages are concise and match the repository style.
