# DenOS 0.4.9 — User Guide

DenOS is an experimental 64-bit command-line OS. It boots to a VGA text console. The kernel graphics library, mouse helpers, UI font, and QOI decoder are retained and expanded in source/build, but the desktop is not started by normal CLI boot.

## 1. First boot

The kernel initializes the serial/VGA text console, validates Multiboot2 information, attempts to initialize the physical page manager, starts the heap, mounts DenFS and the VFS namespace, configures the PIT clock, and starts cooperative kernel services. An Intel E1000 network adapter is initialized when present unless `safe-mode` was supplied in the boot arguments.

First mount creates:

```text
/home/user/
├── Documents/
│   └── Welcome to DenOS.txt
├── Downloads/
├── bin/
└── tmp/
/var/log/
/etc/
```

There is no login or password model. All current commands run in the same kernel address space.

## 2. Shell use

The prompt shows the configured user, host name, and current directory. Enter `help` for commands. Up/Down browses command history and `!!` repeats the latest command. History is RAM-only.

Basic navigation:

```text
pwd
ls
cd Documents
cd /home/user
```

Text files:

```text
touch notes.txt
write notes.txt Notes for my project
cat notes.txt
edit notes.txt
```

`cp`, `mv`, `rm`, `mkdir`, and `rmdir` provide file and empty-directory management. DenFS uses fixed-size metadata and text content slots; it is not a POSIX or binary-safe filesystem.

## 3. Environment and boot configuration

`env` lists variables. `set KEY VALUE` creates or changes a value. `unset KEY` removes it. `$NAME` expands during command processing. The environment is a fixed-size kernel shell table rather than a per-process POSIX environment.

`bootargs` shows the Multiboot2 kernel command line. Add `safe-mode` to the GRUB kernel line to skip E1000 initialization. Key/value arguments such as `loglevel=debug` are preserved for inspection; not every key has a subsystem consumer yet.

## 4. Kernel services

`services` lists the registered background kernel services. `service stop NAME` and `service start NAME` control them. The current scheduler is cooperative: it runs callbacks in the shell/normal-kernel path, does not switch CPU stacks, and does not isolate tasks.

Other inspection commands include `tasks`, `ipc`, `events`, `devices`, `mounts`, `bootlog`, `free`, `pmm`, `df`, and `diskinfo`. The VFS exposes read-only generated status files under `/proc` and small pseudo-devices under `/dev`.

## 5. Networking

The experimental network path targets QEMU's emulated Intel E1000 adapter with a static user-network IPv4 configuration. `net` prints link/MAC/IP/counters. `ping 10.0.2.2` tests ARP and ICMP with QEMU's user-mode gateway. DHCP, DNS, TCP, UDP sockets, IPv6, Wi-Fi, and arbitrary physical NIC support are not implemented.

## 6. Utilities

- `hash FILE` — FNV-1a 32-bit hash.
- `sha256 FILE` — SHA-256 digest for text stored in DenFS.
- `crc32 FILE` — CRC32 checksum.
- `uuid` — formats a UUID v4 using the kernel's non-cryptographic PRNG.
- `random` — displays a non-cryptographic pseudo-random value.
- `partitions` — reads and validates primary MBR partition entries when an ATA disk is present.

The ELF64 module validates the structure of a byte buffer, but DenFS and the shell do not yet provide a binary-safe executable loader. Validation is not execution.

## 7. Aiden C compiler

Aiden C compiles a documented subset of C to AEX6 bytecode, interpreted by the in-kernel VM. The shell workflow is:

```text
edit hello.c
cc hello.c -o hello
run hello
```

The compiler supports global/local scalar variables, one-dimensional fixed arrays, bounded pointers, block scopes, `if`/`else`, loops, `switch`, enums, scalar typedefs, object-like macros and conditional directives, function declarations/prototypes, recursion, and the VM built-ins described in [Aiden C](AIDEN-C.md). The standard-style string/character helpers are implemented by the VM rather than linked from libc. AEX1 through AEX5 files remain readable by the newer VM.

The implementation is still a subset: all scalar values use signed 64-bit VM cells; headers are not loaded, preprocessing is limited, and there are no structs/unions, floating point, function pointers, native code generation, byte-addressable C object layout, or hosted standard library. Arrays are one-dimensional and bounds-checked at runtime. Functions have fixed limits. Programs run with kernel privilege and are not isolated.

## 9. Shutdown and recovery

Use `halt` or `reboot`. DenFS does not have journaling or power-loss recovery. Shut down the VM before copying `denos-data.img`. Do not treat the system as a daily-driver OS while its storage and driver paths remain experimental.

## 8. Graphics library

The source retains an expanded kernel graphics library in `kernel/drivers/graphics.c`, declared by `kernel/include/gfx.h`. It includes framebuffer output, alpha/scaled image blits, polygons, rounded geometry, gradients, anti-aliased text, word wrapping, mouse/event helpers, and QOI decoding. It is compiled and host-tested, but this CLI release does not start the desktop at boot. See [Graphics](GRAPHICS.md).


## Virtual-memory diagnostics

Use `paging` or `vmstat` to inspect the active four-level page-table manager, NX/WP/PGE availability, dynamically allocated page-table pages, mapping operations, and failures. The command reports the current kernel mapping manager; it does not indicate that DenOS has isolated processes or a ring-3 userspace.
