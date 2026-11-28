# DenOS Website — Studio Edition

Static website for the DenOS 0.5.7 experimental x86-64 operating-system project.

## Run locally

From this directory:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. No Node.js, package manager, framework, or build step is required. Google Fonts are optional; system-font fallbacks are included.

## Publish

Upload the **contents** of this folder to the root of the static hosting repository. Keep relative paths intact: `index.html`, `styles.css`, `script.js`, `assets/`, `files/source/`, `docs/`, `404.html`, `robots.txt`, and `site.webmanifest`.

## Current release content

- DenOS 0.5.7 is the highlighted current source release; 0.4.9, 0.3.1, and 0.3 remain historical downloads.
- The 0.5.7 source archive contains the terminal-first x86-64 kernel, DenFS v4, E1000 networking, UDP/DHCP/DNS/TCP client components, BearSSL TLS 1.2, the terminal HTTP/HTTPS reader, image decoders, Aiden C 5.3.0, tests, and documentation.
- The terminal web reader supports scrolling, keyboard-operated links, URL entry, back/forward history, a bounded HTML text renderer, a small CSS visibility subset, literal `document.write()` strings, and PNG/QOI/BMP image viewing. It is not a full graphical or standards-compliant browser and has no general JavaScript engine.
- The normal `make build` and `make run` workflow enables HTTPS by default. The root Makefile exposes only `build`, `run`, and `clean`; host/developer checks live in `tests/Makefile`.
- The 28 current HTML manuals are generated from the Markdown files in the 0.5.7 source tree. Historical 9.x notes are separated from the current documentation.
- The source download intentionally excludes `denos-data.img`, which is a persistent data disk rather than source code. `make build` creates a fresh 32 MiB data image when one is absent. Generated BearSSL build/cache artifacts are also omitted; the vendored BearSSL source is included.
- No prebuilt ISO is included. The site’s browser/console illustrations are explanatory previews, not live DenOS sessions.

## Archive integrity

`files/SHA256SUMS.txt` lists SHA-256 digests for every downloadable source ZIP. `files/release-manifest.json` records the byte size and checksum for each archive.

DenOS is experimental hobby software, not a daily-driver replacement. HTTPS is TLS 1.2 only and lacks certificate revocation checking. The terminal browser does not provide full CSS layout, general JavaScript, forms, cookies, or modern image formats. Read the current `docs/` manuals before experimenting.
