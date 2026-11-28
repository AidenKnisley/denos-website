# DenOS performance notes

DenOS 0.5.7 boots directly to the VGA text console and does not request or initialize a framebuffer desktop. The software renderer remains compiled for development/tests but is not part of normal runtime startup.

## Main runtime costs

- DenFS v4 keeps fixed-size file slots and directory metadata in kernel memory. Its fixed layout simplifies lookup but reserves much more memory than a variable-length block allocator would. The expanded path table is larger than v3.
- The physical page manager tracks usable pages parsed from the Multiboot2 memory map. The kernel heap is separate and provides the small allocations used by current services.
- The cooperative scheduler checks registered callbacks from normal kernel context. Each scheduler pass has a fixed run budget; callbacks must remain short and must not block for long periods.
- E1000 receive is polled. Network polling is registered as a cooperative service; it is not an interrupt-driven network stack.
- The text editor, compiler, and filesystem use bounded static buffers. Larger Aiden C limits increase compiler/VM memory use but remain statically bounded.
- The terminal file browser, calculator, monitor, and ASCII games execute on the kernel main path. They are single-session and cooperative; blocking app work can delay other kernel work.

## Current optimization priorities

Prioritize a variable-length block allocator or storage cache, stronger filesystem integrity checks and journaling, shorter critical sections, interrupt-safe synchronization, network RX scheduling, and measurable scheduler/allocator/render benchmarks. A future process scheduler and separate address spaces will require a different memory and execution model; the current shell, terminal apps, and callback scheduler are not process isolation.
