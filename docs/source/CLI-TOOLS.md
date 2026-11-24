# DenOS command-line tools

DenOS boots into a text shell. No desktop or graphical shell is started. The kernel graphics library remains in the build for graphics and framebuffer development, and its deterministic image corpus lives under `resources/graphics-lab/`.

## Editing the command line

The command editor supports insertion at the cursor, left/right, Home/End, Delete, Backspace, and history navigation. `Ctrl-A` and `Ctrl-E` move to the beginning/end; `Ctrl-U` clears the line; `Ctrl-K` clears from the cursor to the end. `Tab` completes a built-in command in the first word and a file/directory name in the current directory in later words. Completion is deliberately bounded to the current directory and does not yet parse shell quoting or path components.

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

These commands operate on the DenFS/VFS text-file model. The current filesystem API stores NUL-terminated text, so the shell tools are not arbitrary-binary-safe. `hexdump` is a text-storage diagnostic, not a general block-device dump utility.

## System commands

`sysinfo`, `cpuinfo`, `uptime`, `free`, `pmm`, `tasks`, `services`, `service start|stop NAME`, `devices`, `bootlog`, `df`, `diskinfo`, `partitions`, `mounts`, `ipc`, `events`, `net`, `ping`, `sha256`, `crc32`, `uuid`, and `random` expose the currently implemented kernel subsystems. See `help system` and `help network` in the running system for concise descriptions.

## Scope and limitations

This is not a POSIX shell. It currently lacks command pipelines, redirection, job control, process groups, shell scripts, glob expansion, and a Unix process model. The command history is RAM-only. The file inspection commands are built-ins and run in kernel context.
