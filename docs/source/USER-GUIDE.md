# DenOS 0.5.7 — User Guide

DenOS is an experimental 64-bit OS that boots directly to its VGA text console and keyboard-driven shell. The normal boot path is terminal-only: it does not request a framebuffer, start a desktop, or initialize mouse-driven windows.

## 1. First boot

The kernel initializes the serial/VGA text console, validates Multiboot2 information, attempts to initialize the physical page manager, starts the heap, mounts DenFS and the VFS namespace, configures the PIT clock, and starts cooperative kernel services. An Intel E1000 network adapter is initialized when present unless `safe-mode` was supplied in the boot arguments.

First mount creates a home directory with `documents`, `downloads`, `projects`, `examples`, `utilities`, `games`, `pictures`, `music`, `videos`, `screenshots`, `bin`, and `tmp`. It seeds a welcome document, `projects/hello.c`, `documents/quick-notes.md`, and bundled Aiden C source programs in `examples/`, `games/`, and `utilities/`. Existing legacy folders and user files are not overwritten.

Use `apps` to list native text-mode apps. `browse` navigates DenFS and previews files, `notes` opens the quick-notes document, `calc` evaluates integer expressions, `monitor` shows live system counters, and `arcade` launches Snake, Breakout, or Maze Runner in colored ASCII.

There is no login or password model. All current commands run in the same kernel address space.

## 2. Shell use

The prompt shows the configured user, host name, and current directory. Enter `help` for commands. Up/Down browses command history and `!!` repeats the latest command. History is RAM-only.

Basic navigation:

```text
pwd
ls
cd documents
cd /home/user
```

Text files:

```text
touch notes.txt
write notes.txt Notes for my project
cat notes.txt
edit notes.txt
```

`cp`, `mv`, `rm`, `mkdir`, and `rmdir` provide file and empty-directory management. DenFS v4 uses fixed-size metadata and text content slots, supports 255-character paths, and migrates recognized v1/v2/v3 volumes; it is not a POSIX or binary-safe filesystem.

## 3. Environment and boot configuration

`env` lists variables. `set KEY VALUE` creates or changes a value. `unset KEY` removes it. `$NAME` expands during command processing. The environment is a fixed-size kernel shell table rather than a per-process POSIX environment.

`bootargs` shows the Multiboot2 kernel command line. Add `safe-mode` to the GRUB kernel line to skip E1000 initialization. Key/value arguments such as `loglevel=debug` are preserved for inspection; not every key has a subsystem consumer yet.

## 4. Kernel services

`services` lists the registered background kernel services. `service stop NAME` and `service start NAME` control them. The current scheduler is cooperative: it runs callbacks in the shell/normal-kernel path, does not switch CPU stacks, and does not isolate tasks.

Other inspection commands include `tasks`, `ipc`, `events`, `devices`, `mounts`, `bootlog`, `free`, `pmm`, `df`, and `diskinfo`. The VFS exposes read-only generated status files under `/proc` and small pseudo-devices under `/dev`.

## 5. Networking

The network path targets the emulated Intel E1000 adapter. QEMU starts with `10.0.2.15/24`, gateway `10.0.2.2`, and DNS `10.0.2.3`; `dhcp` requests a lease on another Ethernet network. Use `dns HOST` to resolve a name, `ping HOST` to test ICMP, and `web https://HOST/PATH` to read a verified HTTPS page in the normal build, or `web http://HOST/PATH` for unencrypted HTTP. HTTPS uses TLS 1.2. The terminal browser supports PageUp/PageDown and arrow-key scrolling, keyboard-operated link navigation (`L`, then select), URL entry (`G`), back/forward navigation (`B`/`F`), basic HTML text blocks, a small CSS visibility subset, literal `document.write()` strings, and non-interlaced 8-bit PNG/QOI/uncompressed BMP image viewing (`I`). It is not a full graphical, JavaScript, or standards-compliant browser; see `NETWORKING.md` for exact limits.

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
edit examples/hello.c
cc examples/hello.c -o hello
run hello
```

The compiler supports global/local scalar variables, one-dimensional fixed arrays, bounded pointers, block scopes, `if`/`else`, loops, `switch`, enums, scalar typedefs, object-like macros and conditional directives, function declarations/prototypes, recursion, and the VM built-ins described in [Aiden C](AIDEN-C.md). The standard-style string/character helpers are implemented by the VM rather than linked from libc. AEX1 through AEX5 files remain readable by the newer VM.

The implementation is still a subset: all scalar values use signed 64-bit VM cells; headers are not loaded, preprocessing is limited, and there are no structs/unions, floating point, function pointers, native code generation, byte-addressable C object layout, or hosted standard library. Arrays are one-dimensional and bounds-checked at runtime. Functions have fixed limits. Programs run with kernel privilege and are not isolated.

## 8. Native terminal apps

Use `apps` to list the built-in terminal applications. `browse [PATH]` navigates DenFS with the keyboard and previews text files; `notes [FILE]` opens the notes document in the native editor; `calc [EXPR]` evaluates integer expressions; `monitor` displays live heap/page/storage counters; and `arcade` launches colored-ASCII Snake, Breakout, or Maze Runner. These apps run in kernel context and are not protected user processes. The lower-level renderer is retained for development/tests but is not initialized by normal boot; see [Graphics internals](GRAPHICS.md).

## 9. Shutdown and recovery

Use `halt` or `reboot`. DenFS does not have journaling or power-loss recovery. Shut down the VM before copying `denos-data.img`. Do not treat the system as a daily-driver OS while its storage and driver paths remain experimental.


## Virtual-memory diagnostics

Use `paging` or `vmstat` to inspect the active four-level page-table manager, NX/WP/PGE availability, dynamically allocated page-table pages, mapping operations, and failures. The command reports the current kernel mapping manager; it does not indicate that DenOS has isolated processes or a ring-3 userspace.
