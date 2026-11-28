# Building DenOS 0.5.7

The root Makefile intentionally has only three user commands: `build`, `run`, and `clean`. Running plain `make` is equivalent to `make build`.

## Build tools

The maintained build host is x86-64 Linux. Install the required tools on Debian or Ubuntu:

```sh
sudo apt update
sudo apt install build-essential nasm grub-pc-bin grub-common xorriso mtools qemu-system-x86 python3
```

## Build

From the project root:

```sh
make build
```

This compiles all kernel C files with freestanding warning-as-error flags, assembles the x86-64 entry/interrupt code with NASM, links `build-tls/denos.elf`, and creates `build-tls/denos.iso` with GRUB by default (`build/` when `TLS=0`). App examples are embedded automatically. HTTPS is included in the normal build. `make build TLS=0` is available only when an HTTP-only image is specifically needed.

`make` with no target also builds the ISO. Generated files are kept in `build-tls/` by default (`build/` when `TLS=0`).

## Run

```sh
make run
```

The run target builds first when necessary, then starts QEMU with 512 MiB RAM, the DenOS ISO, the persistent ATA data image, and an E1000 adapter connected to QEMU user networking. The default display is GTK. Select SDL with:

```sh
make run QEMU_DISPLAY=sdl
```

Serial diagnostics are written to `build-tls/serial.log` by default (`build/serial.log` when `TLS=0`). The guest boots directly into the DenOS text shell.

## Persistent data disk

On the first successful build, DenOS creates `denos-data.img` as a 32 MiB zero-filled disk if the file does not already exist. Existing disk images are never overwritten by `build` or `clean`.

DenFS v4 requires at least 16,845,312 bytes. `run` rejects a smaller existing image instead of silently changing user data. To enlarge an older image, stop the VM and make a backup first:

```sh
cp -a denos-data.img denos-data.img.backup
truncate -s 32M denos-data.img
```

Keep the backup until DenOS has booted and you have verified your files.

## HTTPS support

The normal `make build` and `make run` commands include BearSSL TLS 1.2 and generate certificate trust anchors from the host system CA bundle. The project includes the BearSSL source tree; when it is absent, fetch and verify it with:

```sh
./tools/fetch_bearssl.sh third_party/BearSSL
```

Build and run normally; no extra flag is needed:

```sh
make build
make run
```

A specific host CA bundle can be selected with `TLS_CA_BUNDLE=/path/to/ca-bundle.pem` for both commands. Use `TLS=0` to opt out of TLS. Otherwise the trust-root generator uses the system CA bundle. BearSSL is compiled freestanding with its Unix and Win32 clock backends disabled; DenOS supplies verification time from its RTC. HTTPS currently supports TLS 1.2 only, and certificate revocation checks are not implemented. Treat it as experimental, not suitable for sensitive activity.

## Clean

```sh
make clean
```

This removes generated `build/` and `build-tls/` files. It preserves `denos-data.img`, so your DenOS files remain intact.

## Developer regression tests

The root Makefile stays limited to the three normal workflow commands. The host regression and static checks live in a separate Makefile:

```sh
make -f tests/Makefile test
make -f tests/Makefile check
```

`test` builds and runs the host-side unit/integration suite. `check` additionally compiles every kernel C translation unit with freestanding warnings-as-errors, checks stack-frame usage, validates TLS adapter/freestanding configuration, and runs the userland library tests. These tests do not replace assembling the NASM sources, creating the ISO, or testing a real QEMU boot.

## Troubleshooting

- `nasm: command not found`: install the `nasm` package.
- `grub-mkrescue` or `xorriso` missing: install `grub-pc-bin`, `grub-common`, and `xorriso`.
- `qemu-system-x86_64` missing: install `qemu-system-x86`.
- Storage falls back to RAM: verify that QEMU attached `denos-data.img` as the primary IDE disk and that it is at least 16,845,312 bytes.
- Keyboard input does not work: the current kernel uses legacy PS/2/i8042 polling; USB HID is not implemented. Use QEMU's standard emulated keyboard.
