# DenOS performance notes

DenOS 0.4.9 boots to a text console and does not start its graphics renderer during the normal shell path. The software renderer, framebuffer presentation code, UI font, mouse helpers, and QOI decoder are present and compiled for kernel display components. The primary active display path still writes character/attribute cells to VGA text memory.

## Main runtime costs

- DenFS keeps fixed-size file slots and directory metadata in kernel memory. Its fixed layout simplifies lookup but reserves much more memory than a variable-length block allocator would.
- The physical page manager tracks usable pages parsed from the Multiboot2 memory map. The kernel heap is separate and provides the small allocations used by current services.
- The cooperative scheduler checks registered callbacks from normal kernel context. Each scheduler pass has a fixed run budget; callbacks must remain short and must not block for long periods.
- E1000 receive is polled. Network polling is registered as a cooperative service; it is not an interrupt-driven network stack.
- The text editor and filesystem are bounded by fixed buffers and current DenFS limits.
- The graphics library uses static logical/presentation/window buffers; its memory footprint is reserved by the linked kernel even though the CLI path does not initialize a desktop. Inspect `kernel/drivers/graphics.c` before increasing surface or window dimensions.

## Current optimization priorities

Prioritize storage cache and integrity checks, shorter critical sections, interrupt-safe synchronization, network RX scheduling, and measurable scheduler/allocator benchmarks. A future process scheduler and separate address spaces will require a different memory and execution model; performance work on the current callback scheduler should not be mistaken for process isolation.
