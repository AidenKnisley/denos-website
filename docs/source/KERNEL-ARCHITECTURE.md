# DenOS kernel architecture

DenOS 0.4.9 is an experimental single-address-space x86-64 operating system written in freestanding C and NASM. It boots through GRUB Multiboot2 and enters a keyboard-driven VGA text shell. The default boot is text-only; a kernel graphics library and PS/2 mouse helpers are retained in the build but are not started by the CLI boot path.

## Source layout

- `kernel/arch/x86_64/` — 32-bit Multiboot2 entry, long-mode transition, full GPR-preserving timer IRQ stub, CPU exception stubs, CPU helpers.
- `kernel/core/` — boot-argument parser, monotonic clock conversion, PRNG seed/state, logging, panic, boot status.
- `kernel/drivers/` — ATA PIO, PCI configuration, E1000 Ethernet, MBR parser, PIC, PIT, RTC, serial/VGA text console, PC speaker, software graphics renderer, and PS/2 mouse helper.
- `kernel/exec/` — ELF64 structural validator only; no program loader.
- `kernel/fs/` — DenFS v3, path normalization, VFS routing.
- `kernel/lib/` — string/format helpers, checksums, SHA-256, CRC32, parsing, UTF-8, bitmap, ring buffer, UUID, and QOI decoding.
- `kernel/mm/` — physical page manager, active-CR3 four-level page-table manager, and general kernel heap.
- `kernel/sys/` — device registry, service manager, cooperative scheduler, IPC, event queue, shell environment, command history.
- `kernel/kernel.c` — subsystem startup and service registration.
- `kernel/shell.c` — command parser and interactive text shell.
- `kernel/editor.c` — bounded text-mode editor.

## Startup sequence

1. `boot.asm` validates the Multiboot2 entry path, builds the low 4 GiB identity map, enables long mode, and calls `kernel_main`.
2. `interrupt_init()` installs CPU exception vectors and the TSS before any device/console initialization; #DF uses a dedicated IST1 emergency stack and PIT IRQ0 uses a separate IST2 stack. `serial_init()` then initializes the VGA text console, COM1 if available, and the legacy keyboard controller.
3. Kernel validates the Multiboot2 info block and parses the command-line tag. `safe-mode` suppresses E1000 startup.
4. The physical page manager parses the Multiboot2 memory map when available.
5. The kernel heap is initialized and checked. The VMM then attaches to the active CR3, enables NXE/CR0.WP/PGE when supported, and leaves the bootstrap identity map intact.
6. DenFS is mounted or placed in RAM fallback mode; the VFS adds `/`, `/proc`, and `/dev` mounts.
7. PIT/IDT timer IRQ, monotonic clock, event queue, IPC endpoints, cooperative scheduler, service registry, PRNG, environment, and shell history are initialized. Timer IRQ saves/restores every GPR and x87/SSE state on its dedicated IST2 stack.
8. Hardware is registered; heap-watch starts, then E1000 and network-poll are started when the adapter is available and safe mode is not enabled.
9. `shell_run()` owns the console until the machine halts or reboots.

## Memory and storage

The physical page manager is separate from the heap. It allocates individual physical pages from Multiboot2-provided usable memory. The general heap uses a fixed 1 MiB kernel arena and exposes diagnostics. A separate `kvalloc`/`kvfree` allocator manages a 64 MiB high-half virtual window backed by PMM frames; it verifies mappings/ownership, rolls back partial failures, and quarantines ranges on failed rollback. This allocator is not yet the backing store for `kmalloc`. The four-level page-table manager attaches to the active CR3 and provides checked 4 KiB map/remap/query/protect/unmap APIs. It queries existing 2 MiB and 1 GiB mappings, splits them while preserving sibling translations, allocates new page-table levels from PMM, and reclaims empty dynamic page-table pages. New writable mappings are required to be NX when supported. Unmapping does not free the mapped data frame. DenFS is a fixed-slot local filesystem with 256 metadata entries; its file API is text-oriented. VFS path routing chooses the longest mount-prefix match and exposes generated procfs content as read-only reads.

## Scheduler, services, IPC, and events

The scheduler is cooperative. It does not save/restore execution contexts or switch kernel stacks. Kernel callbacks are checked from normal kernel execution with a bounded run budget. The service manager records a named callback, priority, interval, task ID, running state, and start count, and routes start/stop to the scheduler.

Each scheduler task can have a fixed-size IPC endpoint. Messages are bounded and non-blocking. The event queue is a bounded FIFO with timestamps, source IDs, type/code, and a scalar value. These facilities are kernel service infrastructure, not a userspace ABI.

## Text console and input

The console writes ANSI-like cursor/color control to the VGA text buffer and optionally mirrors it to COM1. The keyboard is polled from the legacy i8042 controller. The shell includes bounded line editing, Up/Down history navigation, `!!` repeat, environment variable storage, and `$NAME` expansion. PS/2 mouse helpers are retained for graphics consumers, but the default CLI boot does not initialize the mouse or start a GUI loop. The graphics API is kernel-owned, not a userspace ABI.

## Networking

The PCI layer discovers supported devices and the E1000 driver configures QEMU's Intel 82540EM-style adapter using MMIO and DMA descriptor rings. The network layer implements Ethernet, ARP, IPv4 header validation, and ICMP echo for a fixed QEMU user-mode profile. It is not a complete TCP/IP stack.

## Executables and protection boundary

The ELF64 validator checks basic header and program-header bounds, x86-64 machine type, segment file/memory sizes, and alignment. It does not map segments, resolve relocations, create a user stack, or transfer control. There is no ring-3 process model, address-space isolation, syscall ABI, or security boundary.

## Current limitations

No per-process address spaces, demand paging, swap, page-fault recovery, TLB shootdowns, SMP page-table locks, preemptive process scheduling, context switching, ring-3 execution, syscall ABI, dynamic growth of the existing `kmalloc` heap, interrupt-safe general locks, binary-safe filesystem API, executable loader, TCP/UDP/DNS/DHCP, USB host controller, AHCI/NVMe, package manager, or POSIX compatibility is provided. DenOS should be treated as an experimental hobby kernel.

## CPU exceptions and panic diagnostics

CPU vectors 0–31 are installed before the other subsystems. Exceptions are fatal but produce a register/error-code report; #PF additionally records CR2 and decodes its access flags. TSS IST1 is reserved for #DF and IST2 provides a separate stack for PIT IRQ0. The stack trace is a bounded frame-pointer walk and is diagnostic only. It does not provide user-process recovery or demand paging. See `docs/EXCEPTIONS-AND-PANICS.md`.
