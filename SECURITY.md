# Security Policy

VLC Web is a static, client-side media player. It has no server, no backend, no
database, and no build pipeline. All code ships as a single classic `<script>`
file (`app.js`) and runs entirely inside the user's browser sandbox.

## Supported Versions

Only the **latest release** is supported. Older releases are not patched, not
maintained, and should not be used in production or anywhere security matters.

| Version   | Supported          |
| --------- | ------------------ |
| Latest    | Yes                |
| < Latest  | No                 |

If a **critical security fix** is published, it is applied only to the newest
release. Upstream fixes for older releases are not backported — upgrade to the
latest release to receive them.

---

## Reporting a Vulnerability

Do **not** open a public GitHub issue for security vulnerabilities. Reports
filed as public issues expose the details prematurely and may be closed without
review. Please report privately instead.

### How to report

Contact the maintainers directly via a private channel:

- **Email:** `jabarreda82@gmail.com`
- **Private message:** to a maintainer on GitHub (if you have an existing
  relationship)

If neither channel is available, a private GitHub Security Advisory
(Repository > Security > Report a vulnerability) is an acceptable alternative.

### What to include

To get a fast, useful response, include:

1. **Description** — what the issue is and why it is a security concern.
2. **Steps to reproduce** — minimal, concrete steps, including any sample media
   or URL involved.
3. **Affected version** — the exact release (or commit hash) from
   `index.html` / `app.js`.
4. **Suggested fix** — any fix you already considered or prototyped.

### What to expect

- The maintainers will **acknowledge** your report within **3–5 business days**.
- You will be **updated on status** as the issue is triaged, investigated, and
  mitigated.
- Once resolved, you will be notified and, on request (opt-in), **thanked** in
  the release notes or commit.

Please allow a reasonable window before public disclosure, and coordinate with
the maintainers on timing.

---

## Scope of Coverage

VLC Web is an intentional, honest target: it is a zero-dependency page that
plays arbitrary third-party media (including HTTPS streams) in the user's
browser. Keep the following in mind:

- **What this project can and cannot protect against.** There is no server-side
  surface to attack — no endpoints, no storage, no auth. The security
  considerations are almost entirely client-side:
  - **Browser / tab safety** — behavior of the app and its media inside the
    browser's sandbox.
  - **Malformed file handling** — robustness of `readM3U`, `readPLS`, `classify`,
    and the parsing of user-supplied playlists and filenames.
  - **Stream handling** — the browser (not this project) enforces TLS and media
    decoding security for HTTPS streams.
- **What is out of scope.** Anything that depends on the host environment —
  browser sandbox escapes, browser/platform CVEs, or malicious media exploiting
  codecs in the underlying browser engine. Those belong with the browser vendor,
  not this project.
- **Trust model.** Local files are loaded via `URL.createObjectURL`; remote
  media is streamed over HTTPS. Malicious third-party media cannot compromise
  the project itself, but always be mindful of the sites you give media URLs to.