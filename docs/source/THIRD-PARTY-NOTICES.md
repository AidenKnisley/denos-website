# Third-party notices

## Cantarell-derived UI raster data

`kernel/include/font_ui.h` contains a compact 2-bit-coverage rasterization of printable ASCII glyphs derived from Cantarell. The source font was created by Understanding Limited and Jakub Steiner. Copyright © 2009–2011, Understanding Limited; Copyright © 2010–2011, Jakub Steiner. The raster data is distributed under the SIL Open Font License, Version 1.1. The complete license text is provided in `OFL-1.1.txt`.

The embedded glyph data is a modified representation of the font; it is not a bundled TTF or OTF file. DenOS application code and the font data retain their respective licensing terms.

## BearSSL (optional HTTPS build dependency)

The normal build includes HTTPS using BearSSL 0.6. BearSSL 0.6 source is included under `third_party/BearSSL`; if it is missing in another checkout, `./tools/fetch_bearssl.sh third_party/BearSSL` downloads the official archive and verifies its SHA-256. BearSSL is distributed under the MIT License; its copyright and license notices remain in the vendored source. See the upstream project at `https://bearssl.org/`.

