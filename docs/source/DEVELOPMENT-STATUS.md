# DenOS development status — 0.5.7

DenOS is an independent x86-64 hobby operating system. The phrase “modern OS” is a long-term target, not a claim that all facilities of a desktop/server operating system exist today.

## Implemented foundations

- GRUB Multiboot2 entry path, long-mode bootstrap, VGA text console, polled PS/2 keyboard, PIT timing, serial diagnostics, early CPU exception gates, TSS IST1 double-fault stack, a separate IST2 PIT IRQ stack, and complete GPR/x87/SSE preservation in the PIT IRQ path.
- Physical-memory map parsing, bounded page allocator, kernel heap and diagnostics.
- Checked active-CR3 four-level page-table manager with 4 KiB map/query/protect/unmap, explicit remap, 2 MiB/1 GiB huge-page query/splitting, NX/W^X checks, CR0.WP/PGE enablement, dynamic page-table allocation, OOM rollback, and empty dynamic table reclamation; PMM-backed 64 MiB kernel virtual allocation window with mapping verification, rollback and quarantine.
- DenFS v4 persistent ATA PIO storage with directories, migration checks, copy/move and VFS adapters.
- VFS mount routing with procfs/devfs-style pseudo-files, bounded path handling and read-only mount policy.
- Cooperative kernel task scheduler, event FIFO, IPC queues, service registry and device registry.
- PCI configuration discovery, E1000 receive/transmit, ARP/IPv4/ICMP, UDP, manual DHCP, DNS A/CNAME-chain caching, a single synchronous TCP client and an HTTP/HTTPS terminal text reader (HTTPS via the default BearSSL TLS 1.2 build).
- Aiden C 5.3.0 compiler and AEX bytecode VM with expanded source/code/data/function/frame limits, bounded string/search routines and deterministic PRNG helpers; kernel graphics/framebuffer/mouse/QOI libraries.
- Terminal-only shell with 512-byte input/history, file inspection utilities, PATH-aware Aiden C execution, recursive name search, disk-usage summaries, recursive directory creation, a keyboard file browser, calculator, notes shortcut, live text system monitor, and colored-ASCII Snake/Breakout/Maze Runner. Kernel apps and game modules are organized into dedicated subdirectories; bundled Aiden C source samples install under matching home folders without overwriting user edits. The kernel does not request or initialize a framebuffer desktop.

## Explicitly incomplete

- The page-table manager edits the single active kernel CR3 only. There are no per-process address spaces, user/kernel privilege boundary, ring-3 execution, process isolation, syscall ABI, preemptive scheduler, SMP support, or process lifecycle. `VMM_USER` is not a security boundary.
- The shell is not POSIX; no pipelines, redirection, job control or script interpreter exists.
- DenFS is a small fixed-slot filesystem over legacy ATA PIO, not a journaling filesystem. There is no AHCI/NVMe/USB mass storage stack.
- Networking is a bounded E1000 client stack. HTTPS is enabled by default with BearSSL TLS 1.2 with X.509 trust anchors, SNI, hostname/date checks, and fail-closed RDRAND/RTC prerequisites. TLS 1.3, revocation checks, IPv6, concurrent sockets, TCP server, automatic DHCP renewal, fragment reassembly, Wi-Fi, and general routing/firewall services are not implemented.
- Aiden C is a bounded language subset interpreted in kernel context, not ISO C, GCC, native code, or a secure execution environment.
- There is no GUI or window manager in the current boot path. Native text apps and Aiden C programs run in kernel context; there is no user-space process isolation or syscall ABI.
- UEFI, modern interrupt-driven input, audio stack, power management, suspend/resume and hardware breadth remain future work.

## Release validation

`make -f tests/Makefile test` runs 35 host regression executables plus the generated-app installer integration test; `make -f tests/Makefile check-kernel-c` checks every kernel C translation unit and generated installer source with freestanding warning-as-error flags; `make -f tests/Makefile check-stack-usage` enforces an 8 KiB per-function-frame budget; `make -f tests/Makefile check` runs both plus host and TLS adapter tests. These checks do not prove the NASM assembly, linker script, ISO builder, framebuffer hardware, or QEMU interaction. Boot validation requires NASM, GRUB utilities, Xorriso and QEMU on a Linux host.


## 9.5.1 userland C library foundation

A hosted, namespaced C support library prototype is available under `userland/libc` (22 modules). It is built and tested independently with `make -f tests/Makefile libc-test`. It is not yet integrated into Aiden C: the current AEX VM has no header loader, separate compilation/linker, ring-3 process model, or syscall-backed libc ABI. See `AIDEN-LIBC-ROADMAP.md`.
