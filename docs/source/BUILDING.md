# Building DenOS 0.4.9

This guide covers host regression tests, the freestanding kernel build, and running the text-console OS in QEMU.

## Supported build host

The maintained build recipe targets x86-64 Ubuntu or Debian. Equivalent toolchains may work on other Linux distributions. Native Windows builds are not supported; use Linux or a VM.

Required tools:

- GCC and GNU binutils
- NASM
- GRUB utilities with Multiboot2 support
- Xorriso and mtools
- GNU Make
- QEMU x86 system emulator

On Ubuntu/Debian:

```sh
sudo apt update
sudo apt install build-essential nasm grub-pc-bin grub-common \
    xorriso mtools qemu-system-x86
```

## Build and test

```sh
make test
make
```

`make test` runs 31 host-side test executables covering Aiden C/AEX1-AEX6 compatibility, Vim-style C completion and high-resolution QOI golden images, global storage/pointers, string and character built-ins, array bounds traps, user-defined functions, recursion, formatted I/O, compiler diagnostics, and every bundled C sample, plus IPC, events, VFS routing, cooperative scheduling, ATA PIO and DenFS migration, calculator arithmetic, core services, hardware mocks, PMM, keyboard polling, E1000 packet protocol handling, SHA-256/CRC32/UUID utilities, parsers, UTF-8 validation, bitmaps, ring buffers, environment and history, Multiboot2 boot arguments, MBR partition parsing, ELF64 structural validation, and service lifecycle management. These tests do not boot the kernel.

`make` compiles every kernel C source (including `graphics.c`, `mouse.c`, and the QOI decoder) with freestanding warning-as-error flags, assembles the x86-64 entry/interrupt code, links `build/denos.elf`, and creates `build/denos.iso` with GRUB. The graphics library is linked but the default CLI boot does not initialize a desktop.

Build output is kept under `build/`. `make clean` removes build output but preserves personal disk images.

## Data disk

A successful default build creates a 32 MiB `denos-data.img` if no image exists. DenFS v3 requires at least 16,796,160 bytes. Expand an older image before booting:

```sh
make storage-upgrade
```

The command creates an adjacent `.backup` before extending an existing smaller image. Keep that backup until the new kernel has mounted the data and the important files have been checked.

## Run in QEMU

```sh
make run
# Optional display override:
make run QEMU_DISPLAY=sdl
```

The run target launches a separate QEMU GTK window by default (`-display gtk`), with 512 MiB guest RAM, standard VGA text output, the GRUB ISO, and `denos-data.img` on the primary IDE controller. It attaches an E1000 network adapter to QEMU user-mode networking. The guest boots directly to an ANSI-capable 80×25 text console; COM1 diagnostics are saved to `build/serial.log`. Use `make run QEMU_DISPLAY=sdl` to select SDL when GTK is unavailable.

## Useful targets

| Target | Meaning | Data safety |
|---|---|---|
| `make` | Build ISO; create a new data image if absent | Preserves existing image |
| `make test` | Run all host regression tests | Does not touch guest data |
| `make run` | Start QEMU with ISO, data disk, and E1000 | Writes to guest disk |
| `make clean` | Remove generated build directory | Preserves data images |
| `make storage-upgrade` | Back up and expand an older image | Retains backup |
| `make clean-data` | Delete data images | Destructive |

## Troubleshooting

### `nasm: command not found`

Install NASM. Host-side tests do not require the assembler, but the bootable kernel does.

### GRUB cannot create the ISO

Check `grub-mkrescue`, `xorriso`, `mtools`, and the GRUB PC binaries.

### Storage falls back to RAM

Check that QEMU attached `denos-data.img` as the primary IDE disk and that it is at least 16,796,160 bytes. The kernel will not automatically format unknown or malformed volumes.

### Keyboard input does not work

The current kernel uses legacy PS/2/i8042 polling. USB keyboards and USB HID are not implemented. Use QEMU's standard emulated keyboard.

### A host test fails

Run the failing binary under `build/` directly. Do not use `make clean-data` as a troubleshooting step.


`make paging-test` runs the active-CR3 page-table suite; `make vmalloc-test` runs PMM-backed virtual-allocation tests. `make check-kernel-c` checks every kernel C translation unit with freestanding warning-as-error flags. `make check` runs the full host regression suite followed by the kernel C check. None of these commands replaces assembling NASM, linking the kernel, building the ISO, or launching a QEMU boot test.
