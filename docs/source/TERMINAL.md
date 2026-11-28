# DenOS 0.5.7 Terminal Guide

DenOS always boots directly into its VGA 80×25 text console. There is no GUI, window manager, framebuffer boot mode, or `desktop` command. The shell uses legacy PS/2 keyboard polling and optionally mirrors output to COM1.

## 1. Navigation and files

```text
pwd
ls
ls documents
cd documents
cd ..
mkdir scratch-project
touch ideas.txt
write ideas.txt My first DenOS note
cat ideas.txt
edit ideas.txt
```

`cp SOURCE DEST`, `mv SOURCE DEST`, `rm FILE`, and `rmdir EMPTY_DIRECTORY` manage files and empty directories. DenFS v4 supports paths and filenames up to 255 bytes; quoted filenames are supported:

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

## 5. Networking and text browser

```text
net
dhcp
dns example.com
ping example.com
web http://HOST/PATH
```

QEMU starts with a static `10.0.2.x` profile. `dhcp` requests a lease on another Ethernet network. `dns` resolves an IPv4 A record, `ping` accepts an address or hostname, and `web` reads HTTP or verified HTTPS pages as text in the normal build; HTTPS uses TLS 1.2 only. Use PageUp/PageDown or Up/Down to scroll; Home/End jump to the ends, `L` opens links, `1`-`9` opens a quick link, `G` enters a URL, `B`/`F` navigate history, `I` opens the image gallery, and `Q` exits. The limited HTML renderer supports common text blocks, basic CSS visibility rules, literal-string `document.write()` calls, and non-interlaced 8-bit PNG/QOI/uncompressed BMP images; it does not implement full CSS layout or a general JavaScript engine. IPv6, Wi-Fi, cookies, forms, and multiple concurrent TCP connections are unsupported. See `NETWORKING.md` for security and build details.

## 6. System limits

The shell does not yet implement shell scripts, pipelines, redirection, job control, a POSIX syscall interface, or native ELF execution. Aiden C programs are stored as textual AEX bytecode and run inside the kernel VM; they are not isolated processes. The filesystem stores NUL-terminated text, not arbitrary binary files. The ELF64 validator is a structural utility and does not load or execute native programs.


## 9.4 shell line editing and tools

The prompt supports left/right arrows, Home/End, Delete/Backspace, Ctrl-A/E/U/K, Up/Down history, and Tab completion for built-in commands/current-directory entries. File inspection commands include `grep`, `wc`, `head`, `tail`, `stat`, `hexdump`, and `tree`. See `CLI-TOOLS.md` for syntax and limits.

Use `help editor` for the Vim-style editor keys and source completion controls.
