# DenOS development status — 0.4.9

DenOS is an independent x86-64 hobby operating system. The phrase “modern OS” is a long-term target, not a claim that all facilities of a desktop/server operating system exist today.

## Implemented foundations

- GRUB Multiboot2 entry path, long-mode bootstrap, VGA text console, polled PS/2 keyboard, PIT timing, serial diagnostics, early CPU exception gates, TSS IST1 double-fault stack, a separate IST2 PIT IRQ stack, and complete GPR/x87/SSE preservation in the PIT IRQ path.
- Physical-memory map parsing, bounded page allocator, kernel heap and diagnostics.
- Checked active-CR3 four-level page-table manager with 4 KiB map/query/protect/unmap, explicit remap, 2 MiB/1 GiB huge-page query/splitting, NX/W^X checks, CR0.WP/PGE enablement, dynamic page-table allocation, OOM rollback, and empty dynamic table reclamation; PMM-backed 64 MiB kernel virtual allocation window with mapping verification, rollback and quarantine.
- DenFS v3 persistent ATA PIO storage with directories, migration checks, copy/move and VFS adapters.
- VFS mount routing with procfs/devfs-style pseudo-files, bounded path handling and read-only mount policy.
- Cooperative kernel task scheduler, event FIFO, IPC queues, service registry and device registry.
- PCI configuration discovery, QEMU E1000 receive/transmit, ARP, static IPv4 and ICMP echo handling.
- Aiden C compiler and AEX bytecode VM, plus the kernel graphics/framebuffer/mouse/QOI libraries.
- CLI shell with bounded command history, environment variables, file inspection utilities and an editor with source-aware code completion.

## Explicitly incomplete

- The page-table manager edits the single active kernel CR3 only. There are no per-process address spaces, user/kernel privilege boundary, ring-3 execution, process isolation, syscall ABI, preemptive scheduler, SMP support, or process lifecycle. `VMM_USER` is not a security boundary.
- The shell is not POSIX; no pipelines, redirection, job control or script interpreter exists.
- DenFS is a small fixed-slot filesystem over legacy ATA PIO, not a journaling filesystem. There is no AHCI/NVMe/USB mass storage stack.
- Networking is a static QEMU E1000 profile. DHCP, DNS, TCP/UDP sockets, IPv6, Wi-Fi and routing are not implemented.
- Aiden C is a bounded language subset interpreted in kernel context, not ISO C, GCC, native code, or a secure execution environment.
- The graphics code is a kernel API and test target. No GUI starts during default CLI boot, and no user-space graphics ABI exists.
- UEFI, modern interrupt-driven input, audio stack, power management, suspend/resume and hardware breadth remain future work.

## Release validation

`make test` runs 31 host regression executables; `make check-kernel-c` checks every kernel C translation unit with freestanding warning-as-error flags; `make check` runs both. These checks do not prove the NASM assembly, linker script, ISO builder, framebuffer hardware, or QEMU interaction. Boot validation requires NASM, GRUB utilities, Xorriso and QEMU on a Linux host.


## 9.5.1 userland C library foundation

A hosted, namespaced C support library prototype is available under `userland/libc` (22 modules). It is built and tested independently with `make libc-test`. It is not yet integrated into Aiden C: the current AEX VM has no header loader, separate compilation/linker, ring-3 process model, or syscall-backed libc ABI. See `AIDEN-LIBC-ROADMAP.md`.
