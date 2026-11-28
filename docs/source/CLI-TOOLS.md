# DenOS command-line tools

DenOS boots into a text shell. No desktop or graphical shell is started. The kernel graphics library remains in the build for graphics and framebuffer development, and its deterministic image corpus lives under `resources/graphics-lab/`.

## Editing the command line

The command editor supports insertion at the cursor, left/right, Home/End, Delete, Backspace, and history navigation. `Ctrl-A` and `Ctrl-E` move to the beginning/end; `Ctrl-U` clears the line; `Ctrl-K` clears from the cursor to the end. `Tab` completes a built-in command in the first word and a file/directory name in the current directory in later words. Completion is deliberately bounded to the current directory and does not yet parse shell quoting or path components.

## Native terminal apps

| Command | Behavior |
|---|---|
| `apps` | List built-in terminal applications |
| `browse [PATH]` | Keyboard file browser; arrows select, Enter opens folders/previews text files, Backspace moves up, Q exits |
| `calc [EXPR]` | Evaluate an integer expression; prompts when no expression is supplied |
| `notes [FILE]` | Open a note in the built-in editor; defaults to `home/user/documents/quick-notes.md` |
| `monitor` | Refresh heap, PMM, and DenFS statistics twice per second; Q exits |
| `arcade` | Launch Snake, Breakout, or Maze Runner using colored ASCII graphics and keyboard controls |

These apps use the same VGA text console as the shell; no desktop or mouse is involved.

## File inspection

| Command | Behavior |
|---|---|
| `grep PATTERN FILE` | Print matching lines and line numbers; case-sensitive |
| `wc FILE` | Count lines, words, and bytes |
| `head FILE` | Print the first ten lines |
| `head -n COUNT FILE` | Print the first COUNT lines (1..1000) |
| `tail FILE` | Print the last ten lines |
| `tail -n COUNT FILE` | Print the last COUNT lines (1..1000) |
| `stat PATH` | Show VFS type, size, and read-only status |
| `hexdump FILE` | Display the first 256 file bytes in hexadecimal and ASCII |
| `tree [PATH]` | Show a bounded directory tree (maximum depth six) |
| `find [PATH] PATTERN` | Find names recursively from the current directory or PATH; supports `*` and `?`, up to six levels |
| `du [PATH]` | Count files and sum their stored text bytes under a path (up to six levels) |
| `which PROGRAM` | Identify a shell built-in or resolve an `.ax` program through the current directory and `PATH` |
| `mkdir -p PATH` | Create missing parent directories and accept already-existing directories |

The build-time app seeder keeps source layout: `userland/apps/games/*.c`, `examples/*.c`, and `utilities/*.c` are installed under the matching `home/user/` folders on boot. It only creates a sample file when the destination does not exist, so edits made in DenOS are retained. Compile examples from the shell, e.g. `cc examples/hello.c -o hello`, then use `run hello` or `which hello`.

These commands operate on the DenFS/VFS text-file model. The current filesystem API stores NUL-terminated text, so the shell tools are not arbitrary-binary-safe. `hexdump` is a text-storage diagnostic, not a general block-device dump utility.

## System commands

`sysinfo`, `cpuinfo`, `uptime`, `free`, `pmm`, `tasks`, `services`, `service start|stop NAME`, `devices`, `bootlog`, `df`, `diskinfo`, `partitions`, `mounts`, `ipc`, `events`, `net`, `dhcp`, `dns HOST`, `ping HOST`, `web URL`, `sha256`, `crc32`, `uuid`, and `random` expose the currently implemented kernel subsystems. See `help system` and `help network` in the running system for concise descriptions.

## Network and text web client

| Command | Behavior |
|---|---|
| `net` | Show E1000 link, IPv4 settings and frame counters |
| `dhcp` | Request an IPv4 lease, router and DNS address |
| `dns HOST` | Resolve a hostname to an IPv4 A record |
| `ping HOST` | Send one ICMP echo request to an IPv4 address or resolved hostname |
| `web https://HOST[:PORT]/PATH` or `web http://HOST[:PORT]/PATH` | Fetch a page and page through HTML/plain text in the terminal (HTTPS uses the default BearSSL TLS 1.2 build) |

The browser is a bounded terminal text renderer with keyboard link navigation, `G` URL entry, `B`/`F` back/forward history, and an image gallery (`I`). It supports common HTML blocks, limited CSS visibility rules, literal-string `document.write()`/`document.writeln()`, and a graphics viewer for non-interlaced 8-bit PNG, QOI, and uncompressed BMP. It is not a full JavaScript engine or standards-compliant browser; JPEG/SVG/GIF, full CSS layout, external stylesheets/scripts, cookies, and form submission remain unsupported. HTTPS uses BearSSL TLS 1.2 in the normal build; see `NETWORKING.md` for protocol limits and security notes.

## Scope and limitations

This is not a POSIX shell. It currently lacks command pipelines, redirection, job control, process groups, shell scripts, glob expansion, and a Unix process model. The command history is RAM-only. The file inspection commands are built-ins and run in kernel context.
