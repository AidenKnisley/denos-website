# DenOS 0.4.9 Terminal Guide

DenOS boots directly into its text shell. The console uses VGA 80×25 output and legacy PS/2 keyboard polling, with optional COM1 serial mirroring. No GUI terminal or graphical desktop is included.

## 1. Navigation and files

```text
pwd
ls
ls Documents
cd Documents
cd ..
mkdir Projects
touch ideas.txt
write ideas.txt My first DenOS note
cat ideas.txt
edit ideas.txt
```

`cp SOURCE DEST`, `mv SOURCE DEST`, `rm FILE`, and `rmdir EMPTY_DIRECTORY` manage files and empty directories. Quoted filenames are supported:

```text
edit "Meeting Notes.txt"
cp "Meeting Notes.txt" "Meeting Notes backup.txt"
```

## 2. History and environment

- Up/Down moves through the RAM-only command history.
- `history` prints stored commands.
- `!!` repeats the most recent command.
- `env` lists shell variables.
- `set KEY VALUE` and `unset KEY` change them.
- `$NAME` expands environment variables in a submitted command.

Default variables include `USER`, `HOME`, `HOSTNAME`, `SHELL`, `PATH`, and `PWD`. This is a small kernel-owned shell environment, not a process environment ABI.

## 3. System inspection

| Command | Description |
|---|---|
| `sysinfo` | CPU vendor, memory, storage, clock, and uptime summary |
| `date`, `uptime` | Hardware clock and monotonic time |
| `free`, `pmm` | Heap and physical page statistics |
| `df`, `diskinfo`, `partitions` | Storage capacity, disk details, and primary MBR entries |
| `devices`, `bootlog` | Registered hardware and boot diagnostics |
| `tasks`, `services` | Cooperative tasks and registered service state |
| `service start|stop NAME` | Start or stop a registered kernel service |
| `ipc`, `events` | Inspect IPC queues and drain queued kernel events |
| `mounts` | Show VFS mounts |
| `bootargs` | Show parsed Multiboot2 command-line arguments |
| `cat /proc/uptime`, `cat /proc/meminfo` | Read generated kernel status views |

## 4. Integrity and utility commands

```text
hash FILE
sha256 FILE
crc32 FILE
uuid
random
```

`random` and `uuid` use a fast non-cryptographic PRNG. They are not suitable for cryptographic secrets. SHA-256 and CRC32 are integrity checks, not signatures or proof of authenticity.

## 5. Experimental networking

```text
net
ping 10.0.2.2
```

`net` reports E1000 link, MAC, static IPv4, gateway, and frame counters. `ping` sends ICMP echo after ARP resolution. The default profile is for QEMU user-mode networking only; DHCP, DNS, TCP/UDP, IPv6, and Wi-Fi are not implemented.

## 6. System limits

The shell does not yet implement shell scripts, pipelines, redirection, job control, a POSIX syscall interface, or native ELF execution. Aiden C programs are stored as textual AEX bytecode and run inside the kernel VM; they are not isolated processes. The filesystem stores NUL-terminated text, not arbitrary binary files. The ELF64 validator is a structural utility and does not load or execute native programs.


## 9.4 shell line editing and tools

The prompt supports left/right arrows, Home/End, Delete/Backspace, Ctrl-A/E/U/K, Up/Down history, and Tab completion for built-in commands/current-directory entries. File inspection commands include `grep`, `wc`, `head`, `tail`, `stat`, `hexdump`, and `tree`. See `CLI-TOOLS.md` for syntax and limits.

Use `help editor` for the Vim-style editor keys and source completion controls.
