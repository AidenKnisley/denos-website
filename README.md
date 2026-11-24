# DenOS Website — Studio Edition

A complete static-site redesign for the DenOS operating-system project.

## Run locally

From this directory:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

No Node.js, package manager, framework, or build step is required. The page uses local HTML/CSS/JavaScript. Google Fonts are an optional enhancement; system-font fallbacks are included.

## Publish

Upload the **contents** of this folder to the root of a static hosting repository. Keep the relative paths intact:

- `index.html`, `styles.css`, `script.js`
- `assets/`
- `files/source/`
- `docs/`
- `404.html`, `robots.txt`, and `site.webmanifest`

The relative download and documentation links work on a normal static host and GitHub Pages project sites.

## Included

- A new editorial visual identity with light/dark themes.
- Responsive navigation and page reading progress.
- Interactive architecture map and a browser-side command-tour simulation.
- Searchable source release archive with SHA-256 values.
- Copyable build commands and explicit data-image safety notes.
- Development status split into implemented, limited, and roadmap areas.
- 30 readable HTML manuals generated from the DenOS 0.4.9 documentation.
- Original Markdown/text manuals in `docs/source/`.
- Original DenOS 0.3, 0.3.1, and 0.4.9 ZIP source archives in `files/source/`.
- Searchable documentation library, keyboard command palette (`Ctrl+K`), and reduced-motion support.

## Source archive integrity

The three source archives were copied byte-for-byte from the supplied website ZIP. Their SHA-256 digests are listed in `files/SHA256SUMS.txt`; the values are also shown in the release section of the site.

The DenOS 0.4.9 archive is a source release, not a prebuilt ISO. Its own documentation describes the project as experimental and not a daily-driver replacement. The site preserves those caveats rather than implying production readiness.

## Build guide accuracy

The setup and build commands shown on the site are based on the `docs/BUILDING.md` file included in the 0.4.9 source archive. The website does not build or emulate DenOS; its console tour is explicitly a static browser-side simulation.
