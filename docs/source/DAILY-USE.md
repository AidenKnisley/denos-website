# Everyday use of DenOS 0.4.9

DenOS starts directly in a keyboard-driven VGA text console. There is no graphical desktop or mouse-driven session in this release. The kernel graphics library remains available in source/build for future kernel display work; it is not started during the CLI session.

## First session

After the kernel initializes its memory, storage, VFS, timer, scheduler, and optional network adapter, it prints a shell prompt. Type `help` for the built-in command reference. The first mount creates `/home/user`, `Documents`, `Downloads`, `bin`, and `tmp`, plus a short welcome file.

## Navigate and manage files

```text
pwd
ls
cd Documents
touch notes.txt
write notes.txt My DenOS notes
cat notes.txt
edit notes.txt
```

Paths may be relative to the current directory or absolute within the DenOS namespace. Quote filenames containing spaces. `cp` and `mv` currently operate on files; folder deletion only succeeds when the folder is empty.

## Shell history and environment

Use Up/Down to browse the current boot's command history. `!!` repeats the most recent command. History is held in RAM and is not persistent across reboot.

```text
env
set PROJECT DenOS
 echo $PROJECT
unset PROJECT
```

Variable expansion uses `$NAME`. The environment is a small fixed table; it is not a POSIX process environment. `HOSTNAME`, `USER`, `HOME`, `SHELL`, and `PATH` are seeded at startup.

## Inspect system state

```text
sysinfo
bootlog
devices
services
tasks
mounts
cat /proc/meminfo
cat /proc/net/dev
```

`services` lists cooperative kernel services. `service stop network-poll` and `service start network-poll` control the registered network polling task when it exists. Stopping it stops background RX polling; `ping` still performs its own bounded polling while waiting.

## Checksums and network diagnostics

```text
sha256 notes.txt
crc32 notes.txt
net
ping 10.0.2.2
```

The PRNG behind `random` and `uuid` is non-cryptographic. Do not use it to create secrets, private keys, or authentication tokens. Networking currently targets the QEMU E1000 user-network setup and supports ARP/IPv4/ICMP only.

## Compile and run C programs

Aiden C is a small C subset that compiles to AEX bytecode interpreted by the kernel. For example:

```text
edit hello.c
cc hello.c -o hello
run hello
```

Use `help programming` or `cinfo` for the supported grammar, built-ins, and limits. Aiden C supports global/local values, one-dimensional arrays with runtime bounds checks, bounded scalar pointers, functions/prototypes/recursion, `switch`, enums, scalar typedefs, object-like macros and limited conditionals. The VM also provides `strlen`, `strcmp`, `strcpy`, `strcat`, `strstr`, `atoi`, absolute-value and ASCII `ctype` helpers. It does not produce native x86-64 code and is not a complete ISO C implementation; see `docs/AIDEN-C.md` for details.

## Editing and shutdown

`edit FILE` opens the small built-in text editor. The filesystem is text-oriented, so AEX bytecode is saved as hexadecimal text rather than a raw binary. AEX programs execute in kernel context and are not isolated; only run trusted programs. Use `halt` to stop QEMU or `reboot` to restart it.

## Backups

DenFS has no journal. Back up `denos-data.img` while QEMU is shut down. See [Recovery](RECOVERY.md) before changing an existing data image.

## Graphics source

Use `help graphics` for a quick overview of the retained kernel renderer. Its expanded API is declared in `kernel/include/gfx.h`; it is not a command-line desktop program.
