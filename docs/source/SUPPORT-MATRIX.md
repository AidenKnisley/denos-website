# DenOS 0.4.9 support matrix

This matrix distinguishes implemented behavior from unsupported or planned features. DenOS is an experimental independent x86-64 OS, not a Linux distribution and not Linux-compatible.

## Boot and hardware

| Area | Current support | Limits |
|---|---|---|
| CPU | x86-64 long mode | Maintained QEMU `qemu64` target |
| Bootloader | GRUB Multiboot2 | Memory map and optional command-line tags; no default framebuffer request in CLI path |
| Console | VGA 80×25 text + optional COM1 mirror | Default boot is text-only |
| Graphics library | Software renderer, framebuffer output, geometry, text, window/event helpers, QOI decoder | Included/compiled and host-tested, but not initialized by CLI boot; kernel API only |
| Keyboard | Legacy PS/2/i8042 polling | No USB HID |
| Pointer | PS/2 mouse helper/driver retained | Not started by default CLI path; no USB HID |
| Storage | ATA PIO IDE | QEMU IDE is the maintained setup |
| Filesystem | DenFS v3 | 256 fixed slots, nested paths, 65,535-byte text-file cap, no journal or binary-safe public API |
| Virtual filesystem | Mount routing for `/`, `/proc`, and `/dev` | No POSIX file descriptors, permissions, symlinks, or cross-mount rename |
| Clock | CMOS RTC + PIT monotonic ticks | No time sync or timezone database |
| Audio | PC speaker | Simple tones only |
| Ethernet | Intel E1000 / QEMU | Cooperative polling; ARP, IPv4 validation, ICMP; static QEMU user-network profile |
| Kernel services | Cooperative scheduler, service registry, fixed IPC queues, event FIFO | No context switch, per-task stacks, process isolation, or interrupt-safe synchronization |
| Utilities | SHA-256, CRC32, UUID formatting, non-crypto PRNG, UTF-8 validation, parsers | PRNG not cryptographic; checksums do not verify signatures |
| Executable format | AEX1–AEX6 bytecode interpreter; Aiden C emits AEX6 | Runs in kernel context; no user-mode isolation or native ELF loader |
| Debug | COM1 serial, boot log, panic output | No remote debugger integration |

## Aiden C 5.2.4

Aiden C supports global/local scalar storage, one-dimensional arrays, bounded scalar pointers, functions/prototypes/recursion, `switch`, enums, scalar typedefs, `sizeof(type/object)`, object-like macros and basic conditional directives, plus a growing set of VM-provided string and character helpers. The VM keeps compatibility with AEX1–AEX5.

The language remains a subset rather than a complete ISO C compiler. Scalar types all occupy signed 64-bit VM cells; headers are not loaded; function-like macros, aggregates (`struct`/`union`), floats, native code generation, general libc, and a userspace process ABI are absent. See `docs/AIDEN-C.md` for exact details.

## Kernel namespace

- `/proc/uptime`, `/proc/meminfo`, `/proc/tasks`, `/proc/ipc`, `/proc/events`, `/proc/mounts`, `/proc/devices`, and `/proc/net/dev` are generated read-only status views.
- `/dev/null` discards writes; `/dev/zero` returns a bounded zero-filled text buffer.
- Shell commands `tasks`, `services`, `service`, `ipc`, `events`, `mounts`, and `devices` inspect/manage kernel services and devices.

## Not yet supported

- Ring-3 user apps, per-process page tables, preemptive process scheduling, syscall ABI, isolated AEX/native executable execution.
- Full ISO C: struct/union layout, floating point, complete preprocessor/header loading, separate translation units, full libc, native compiler backend.
- DHCP, DNS, TCP/UDP sockets, IPv6, Wi-Fi, Bluetooth, browser, or package manager.
- USB host controller, USB storage/HID, AHCI, NVMe, SD cards, broad laptop peripherals.
- GUI startup by default, GPU acceleration, OpenGL/Vulkan, audio codec/HDA/USB audio, media playback.
- POSIX/Linux ABI, glibc/musl, Linux application compatibility, third-party application SDK.
- Multi-user accounts, permissions, encryption, secure boot, filesystem journal, production recovery.

## Daily-driver status

DenOS is **not a daily-driver replacement** for Mint, Ubuntu, Windows, or macOS. It is an experimental single-address-space kernel with a narrow device set and a non-journaled filesystem. Keep independent backups and use QEMU until repeated ISO boot, storage-recovery, and hardware testing are complete.

## 9.4 editor and CLI additions

| Area | Implemented | Limitations |
|---|---|---|
| C completion | Keywords, types, Aiden VM built-ins, same-file identifiers; comment/string aware | Lexical and buffer-local; no semantic types, header indexing or LSP protocol |
| Editor check | Parentheses/brackets/braces, block comments and quoted literal balance | Not a full grammar parser or compiler diagnostic pass |
| Shell line editor | Cursor movement, insertion, delete, history, basic Tab completion | No quoting-aware shell parser, path-component completion or scripting |
| File inspection | grep, wc, head, tail, stat, hexdump, tree | DenFS text-file API is NUL-terminated; hexdump is not a block-device tool |
| Graphics test corpus | Ten deterministic QOI inputs and RGBA golden surfaces | Developer tests/resources, not boot-loaded assets |


## Virtual memory (DenOS 0.4.9)

| Capability | Status | Notes |
|---|---|---|
| Four-level x86-64 page-table manager | Implemented | Attaches to active CR3; bootstrap identity map retained. |
| 4 KiB map/remap/query/protect/unmap | Implemented | Caller owns mapped physical frames; explicit replacement API. |
| 2 MiB / 1 GiB large-page query and split | Implemented | Splits preserve sibling translations. |
| NXE, supervisor WP, PGE | Conditional | Enabled only when supported by the CPU. |
| Per-process address spaces / ring 3 | Not implemented | `VMM_USER` must not be treated as isolation. |
| Demand paging / swap / COW / SMP TLB shootdown | Not implemented | Future memory milestones. |

| PMM-backed kernel virtual allocator | Implemented | 64 MiB contiguous-VA window backed by separate PMM frames; independent of fixed `kmalloc`. |
| Virtual allocator rollback/quarantine | Implemented | Fails closed on partial unmap/remap/ownership inconsistencies; quarantines uncertain ranges. |
| Dynamic `kmalloc` growth | Not implemented | `kvalloc` is a separate explicit allocation API. |
