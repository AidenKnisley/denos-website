# DenOS roadmap

This roadmap prioritizes memory safety, storage integrity, hardware support, and a real user/kernel boundary over decorative interface work. Checkmarks mean implemented and wired into the current kernel.

## 9.0.1 — kernel service foundation (retained)

- [x] Cooperative scheduler with priorities, intervals, task IDs, run counters, and bounded run budget.
- [x] E1000 network polling and periodic heap integrity check.
- [x] VFS mount namespace with DenFS root, read-only procfs, and basic devfs.
- [x] Per-task bounded IPC queues and timestamped kernel event queue.
- [x] DenFS v4 with 255-character paths and recognized v1/v2/v3 migration.
- [x] PCI discovery and QEMU E1000/ARP/IPv4/ICMP network baseline.

## 9.1.0 — command-line kernel expansion (retained)

- [x] Establish the original text-shell-only boot path and remove graphical app pages; the low-level renderer was later restored as an inactive kernel development library in 9.3.0.
- [x] Boot directly into VGA text console with COM1 diagnostics.
- [x] Add Multiboot2 boot argument parsing and `safe-mode` network suppression.
- [x] Add monotonic clock conversions and a non-cryptographic PRNG.
- [x] Add UUID v4 formatting, SHA-256, CRC32, integer/IPv4 parsing, UTF-8 validation, bitmaps, and ring buffers.
- [x] Add environment variables, `$NAME` expansion, command history, Up/Down history navigation, and `!!` repeat.
- [x] Add cooperative service registry with start/stop lifecycle.
- [x] Add MBR partition inspection and ELF64 structure validation libraries.
- [x] Add host tests for the new algorithms and services.

## 9.2.0 — Aiden C and execution hardening

- [x] Restore the Aiden C subset compiler and in-kernel AEX VM to the CLI branch.
- [x] Add user-defined functions, prototypes, parameters, recursion, and mutual recursion through AEX3-compatible execution.
- [x] Add AEX4 array index guards and reject truncated/trailing executable data.
- [x] Stop VM execution on signed division/modulo by zero and validate `scanf` pointers against the active function frame.
- [x] Integrate `cc`, `run`, `cinfo`, and topic-based help into the shell.
- [x] Compile every bundled C sample in the host regression suite.

## 9.3.0 — Aiden C and graphics library expansion

- [x] Upgrade compiler images to AEX6 with bounded global scalar/array storage and global address operations; retain AEX1–AEX5 VM compatibility.
- [x] Add object-like macros, `#undef`, basic `#if`/`#ifdef` conditionals, scalar typedefs, enums, `switch`, `sizeof(type/object)`, and global constant expressions.
- [x] Add bounded string/character built-ins: `strlen`, comparison/copy/concatenation/search routines, `atoi`, absolute-value and ASCII character helpers.
- [x] Extend `printf` with unsigned, hexadecimal, octal, and VM-pointer conversions; support `%s` with VM character-array pointers.
- [x] Restore the kernel graphics library, framebuffer/window/mouse helpers, UI font, QOI decoder, license, and host regression tests to the CLI source tree.
- [x] Add clipped polygon outlines/fills, scaled RGB/RGBA blits, and word-wrapped anti-aliased UI text.
- [x] Add regression tests for string APIs, character helpers, formatted output, polygons, and wrapped text.
- [ ] Add function-like macros, full `#if` expression parsing, actual header loading, and multiple translation units.
- [ ] Add `struct`/`union` layout, member access, standard object sizes/alignment, and stronger type checking.

## 9.4 — storage reliability and binary I/O

- [ ] Add a non-destructive filesystem checker and explicit read-only recovery mode.
- [ ] Add metadata checksums and crash-safe metadata updates.
- [ ] Add backup/export/import utility and restoration tests.
- [ ] Replace fixed-slot DenFS with variable-length block allocation and a free-space bitmap.
- [ ] Add binary-safe file I/O, timestamps, attributes, and a stable block-device abstraction.
- [ ] Add GPT parsing and stronger partition consistency checks.

## 9.5 — execution and memory protection

- [x] Add GDT/TSS, CPU exception reporting, page-fault decoding, and a #DF IST1 stack.
- [x] Give PIT IRQ0 a separate IST2 stack and preserve every GPR plus x87/SSE state.
- [ ] Add virtual memory mapping and per-task address spaces.
- [ ] Add saved CPU contexts, per-task kernel stacks, and preemptive process scheduling.
- [ ] Define a syscall ABI and privilege boundary.
- [ ] Add ring-3 user-mode execution and memory protection.
- [ ] Extend ELF64 validation into a loader with segment mapping, relocations, and user stack creation.
- [ ] Move device-independent utilities and shell programs into userspace.

## 9.6 — hardware and networking

- [ ] Add interrupt-safe locking and deferred work queues.
- [ ] Add USB host controller and USB HID.
- [ ] Add AHCI/NVMe storage drivers.
- [x] Add E1000/ARP/IPv4/ICMP QEMU networking.
- [x] Add bounded UDP, DHCP client, DNS A-record resolver/cache, synchronous TCP client and HTTP text page reader.
- [x] Add optional BearSSL TLS 1.2 HTTPS with certificate-chain, hostname and date validation.
- [ ] Add NIC abstraction, IPv6, automatic DHCP lease renewal, TLS 1.3/revocation checks, robust concurrent TCP sockets and TCP server support.
- [ ] Add modern audio hardware support.

## 10.x — application ecosystem

- [ ] Add a signed package format and package manager after the userspace ABI stabilizes.
- [ ] Add SDK and third-party program packaging.
- [ ] Reconsider a graphical environment only after process isolation, input abstractions, and a reliable graphics driver stack exist.

## Release gates

Before describing a release as suitable for everyday use:

1. Reproducible ISO build in a documented environment.
2. Repeated QEMU boot tests and kernel panic/recovery tests.
3. Storage power-loss and filesystem consistency testing.
4. Verified data backup and restoration.
5. Device and network tests beyond mocks.
6. User-mode isolation and a stable syscall ABI.
7. No destructive default cleanup behavior.


## 9.4.0 — CLI/editor and graphics validation

- [x] Add buffer-local C keyword/type/Aiden built-in and same-file identifier completion to the Vim-style editor.
- [x] Add completion acceptance/cycling and structural delimiter/comment/literal check.
- [x] Improve shell command-line editing, history, command/file Tab completion, and text-inspection commands.
- [x] Add reproducible QOI/RGBA graphics fixtures and per-pixel decoder regression coverage.
- [ ] Add syntax-aware diagnostics and project/header symbol indexing.
- [ ] Add protected user mode, address spaces, syscall ABI and isolated process execution.
- [ ] Add preemptive scheduling, SMP and interrupt-driven device I/O.
- [ ] Add a modern block storage stack and journaling filesystem; complete secure/concurrent networking, TLS 1.3/revocation checks and IPv6.


## 9.4.1 reliability baseline

- [x] Install CPU exception handlers before subsystem startup; capture GPRs, RIP/RSP/RFLAGS, error codes, and page-fault CR2/flags.
- [x] Add a 64-bit TSS with a dedicated #DF IST emergency stack.
- [x] Preserve all GPRs and x87/SSE state in the timer IRQ stub.
- Next: validated page-table management, kernel heap growth from PMM, and a protected user-mode ABI.


## 9.5.1 additive userland library milestone

The initial 22-module hosted support library prototype is under `userland/libc`. The next integration prerequisite is the protected user-process/syscall ABI. Until then, the modules must remain separate from the freestanding kernel and the AEX VM. Full ISO C conformance remains a distinct compiler and ABI project.
