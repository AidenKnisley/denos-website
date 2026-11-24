# DenOS virtual filesystem namespace

DenOS now has a small VFS routing layer between path-based kernel clients and
filesystem backends. It gives the kernel one absolute-path namespace and uses
longest-prefix mount selection, so `/proc/net/dev` resolves to procfs instead
of the root DenFS volume.

## Built-in mounts

| Mount | Backend | Access |
|---|---|---|
| `/` | DenFS v3 (ATA persistent storage or RAM fallback) | Read/write |
| `/proc` | Kernel-generated procfs views | Read-only |
| `/dev` | Minimal pseudo-device filesystem | Read/write where supported |

The shell exposes the namespace through `mounts`, `ls /proc`, and `cat` with
absolute paths. Examples:

```sh
mounts
cat /proc/uptime
cat /proc/meminfo
cat /proc/tasks
cat /proc/devices
cat /proc/ipc
cat /proc/events
cat /proc/mounts
cat /proc/net/dev
ls /dev
write /dev/null ignored
```

`/proc/uptime` reports PIT ticks as seconds. `meminfo`, `tasks`, `ipc`, `events`, `mounts`, `devices`, and
`net/dev` are generated from live kernel subsystem state. `/dev/null` discards
writes. `/dev/zero` returns a bounded zero-filled text buffer for safe
inspection; this is not yet a general binary file-descriptor API.

## Backend contract

A filesystem backend supplies callbacks for read, write, mkdir, remove, stat,
and directory enumeration. Read/write and mutation callbacks are optional;
stat and list are required for a mount. Mount paths are absolute, normalized,
and limited to the existing 63-character path representation. The VFS rejects
mount-prefix lookalikes (for example `/proc-old` is not under `/proc`) and
uses the most-specific mount when paths overlap.

This is a pathname routing layer, not a POSIX file-descriptor implementation.
There are no open file descriptions, permissions/ownership, symlinks, hard
links, rename semantics across mount points, or asynchronous I/O yet. DenFS
still owns the existing storage format and limits.
