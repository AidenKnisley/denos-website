# DenOS graphics library — 9.4.0

The CLI Edition keeps the graphics subsystem as a compiled, tested **kernel library**. The regular boot path remains the VGA text console; it does not start the old desktop or a graphical event loop. The graphics routines can be used by future in-kernel display components, but there is no process-isolated userspace graphics ABI.

## Source and display model

- Implementation: `kernel/drivers/graphics.c`
- Public declarations: `kernel/include/gfx.h`
- Mouse input: `kernel/drivers/mouse.c` and `kernel/include/mouse.h`
- QOI image decoder: `kernel/lib/qoi.c` and `kernel/include/qoi.h`
- Anti-aliased UI font: `kernel/include/font_ui.h`
- Host regression tests: `tests/graphics_test.c`, `tests/framebuffer_test.c`, `tests/graphics_mouse_test.c`, and `tests/qoi_test.c`

The library uses a 640×360 logical 32-bit RGB surface when a supported 1280×720 RGB framebuffer is configured, with a VGA compatibility path for tests/recovery. It is CPU software rendering; it does not use a GPU, OpenGL, Vulkan, hardware page flipping, or a hardware cursor plane. The normal 9.3 CLI boot does not configure/start this graphics output path.

## Drawing API

Include `gfx.h` from kernel code. Important API groups include:

- **Lifecycle and display:** `gfx_start`, `gfx_stop`, `gfx_configure_framebuffer`, `gfx_width`, `gfx_height`, `gfx_display_width`, `gfx_display_height`, `gfx_using_framebuffer`.
- **Pixels and images:** `gfx_pixel`, `gfx_get_pixel`, `gfx_blit_rgb32`, `gfx_blit_rgba32`, `gfx_blit_scaled_rgb32`, `gfx_blit_scaled_rgba32`. Image blits are clipped to the target; source pitch is expressed in 32-bit pixels. RGBA uses `0xAARRGGBB` alpha blending.
- **Geometry:** lines, rectangles, circles, ellipses, triangles, rounded rectangles, gradient rectangles, plus `gfx_polygon` and `gfx_fill_polygon` for 3–64 interleaved x/y vertices. Polygon drawing clips scanline spans to the logical surface.
- **Text:** compact `gfx_text`, anti-aliased `gfx_text_ui` and bold/scale variants, `gfx_text_width`, `gfx_text_centered`, and `gfx_text_wrapped`. Wrapped text returns its rendered height and accepts an explicit line height.
- **Controls/composition:** buttons, progress bars, up to four buffered windows, desktop icon helpers, focus/minimize controls, and bounded event queue.
- **Input:** polled PS/2 mouse state, button edges, keyboard helpers, and queued input/window events.
- **Frame grouping:** `gfx_begin_frame`, `gfx_end_frame`, and `gfx_present` batch updates to reduce flicker and unnecessary framebuffer copies.

The header is the source of truth for signatures and constants. Coordinates and dimensions are logical pixels; query `gfx_width()` and `gfx_height()` rather than assuming a mode.

## Fonts and image decoding

The regular/bold anti-aliased UI raster data is based on Cantarell and is distributed under the SIL Open Font License. Attribution is in `docs/THIRD-PARTY-NOTICES.md`, and the license text is in `docs/OFL-1.1.txt`. QOI decoding validates dimensions, output capacity, run lengths, and the end marker before returning decoded pixel data.

## Validation

`make test` builds and runs the graphics primitive test, the high-resolution framebuffer test, mouse/window interaction tests, and QOI decoding tests. They check RGB precision, clipping, damage updates, alpha blending, scaled blits, ellipses, rounded rectangles, gradients, polygons, text rendering/wrapping, framebuffer pitch, mouse state, windows/events, and malformed images.

These tests do not boot a visual desktop. The source library is preserved and included in the kernel C source list, but the 9.3 command-line boot intentionally stays text-only.

## Current limitations

- No GPU acceleration, arbitrary mode switching, shader API, or hardware page flipping.
- No font shaping, full Unicode text shaping, vector path/stroke engine, video decoding, or general image file browser.
- Mouse support is polled PS/2 only; no USB HID or hotplug.
- Window and desktop helpers are kernel-owned composition code, not isolated processes or a userspace window-system protocol.
- The renderer is not initialized by the default CLI boot path.
