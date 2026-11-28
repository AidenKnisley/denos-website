# Everyday use of DenOS 0.5.7

DenOS boots directly to a VGA 80×25 text console and keyboard-driven shell. There is no GUI boot path or mouse-driven desktop.

## First session

After kernel initialization, type `apps` to list native terminal apps. `browse` opens a keyboard file manager, `notes` opens the notes file in the built-in editor, `calc` evaluates integer expressions, `monitor` refreshes kernel/storage counters, and `arcade` runs three colored-ASCII games. The first mount creates `/home/user` with lowercase `documents`, `downloads`, `projects`, `examples`, `utilities`, `pictures`, `music`, `videos`, `screenshots`, `games`, `bin`, and `tmp` folders. Bundled Aiden C examples, games, and utilities are installed in their matching folders without overwriting user edits.

## Navigate and manage files

```text
pwd
ls
cd documents
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
dns example.com
web http://HOST/PATH
```

The PRNG behind `random` and `uuid` is non-cryptographic. Do not use it to create secrets, private keys, or authentication tokens. Networking targets the QEMU E1000 user-network setup and includes ARP/IPv4/ICMP/UDP, manual DHCP, DNS A lookups, one synchronous TCP client, and an HTTP/HTTPS text reader. HTTPS is included in the normal BearSSL-enabled build; see `NETWORKING.md` for TLS 1.2, clock, entropy, and certificate-validation limits.

## Compile and run C programs

Aiden C is a small C subset that compiles to AEX bytecode interpreted by the kernel. For example:

```text
edit examples/hello.c
cc examples/hello.c -o hello
run hello
```

Use `help programming` or `cinfo` for the supported grammar, built-ins, and limits. Aiden C supports global/local values, one-dimensional arrays with runtime bounds checks, bounded scalar pointers, functions/prototypes/recursion, `switch`, enums, scalar typedefs, object-like macros and limited conditionals. Its VM includes bounded string copy/compare/search/span functions, ASCII `ctype`, formatted console I/O, `atoi`, `abs`/`labs`, and deterministic `rand`/`srand`. It does not produce native x86-64 code and is not a complete ISO C implementation; see `docs/AIDEN-C.md` for details.

## Editing and shutdown

`edit FILE` opens the small built-in text editor. The filesystem is text-oriented, so AEX bytecode is saved as hexadecimal text rather than a raw binary. AEX programs execute in kernel context and are not isolated; only run trusted programs. Use `halt` to stop QEMU or `reboot` to restart it.

## Backups

DenFS has no journal. Back up `denos-data.img` while QEMU is shut down. See [Recovery](RECOVERY.md) before changing an existing data image.

## Native terminal apps

Run `apps` for the app list. The `browse` app navigates directories with arrow keys and previews text files with Enter. `notes` opens `home/user/documents/quick-notes.md` in the editor. `calc 4*(8+2)` evaluates an expression. `monitor` refreshes heap, physical-page, and DenFS usage twice per second (Q quits). `arcade` runs Snake, Breakout, and Maze Runner using colored ASCII characters and keyboard controls. All apps execute in kernel context, not isolated ring-3 processes.
