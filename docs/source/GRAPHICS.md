# DenOS graphics internals — inactive on normal boot

DenOS 0.5.7 is terminal-only. The Multiboot2 header no longer requests a framebuffer, `kernel_main` does not parse or configure a display mode, and no desktop/window manager or mouse-driven app is started. All normal interaction happens in the VGA text console and keyboard shell. The three arcade games use colored ASCII characters in that console.

The low-level software renderer remains in the source tree because its drawing, framebuffer, mouse-event, and QOI code still has host regression coverage and may be useful for kernel development. It is not initialized during normal boot and is not exposed as a userspace graphics ABI.

## Retained source and tests

- Renderer: `kernel/drivers/graphics.c`
- Mouse helper: `kernel/drivers/mouse.c` (not started by normal boot)
- QOI image decoder: `kernel/lib/qoi.c`
- Graphics declarations: `kernel/include/gfx.h`
- UI font data: `kernel/include/font_ui.h`
- Deterministic development fixtures: `resources/graphics-lab/`

`make -f tests/Makefile test` continues to validate the renderer and QOI decoder as isolated kernel libraries. Those tests do not imply that DenOS boots a GUI. For interactive apps, see `docs/TERMINAL.md` and `docs/USER-GUIDE.md`.
