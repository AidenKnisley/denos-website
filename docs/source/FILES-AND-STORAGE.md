# Files and Storage — DenFS v3

DenOS 0.4.9 uses DenFS v3, a fixed-slot persistent filesystem with directory paths. It is designed for small local text files and settings, not large binary files or high-throughput storage.

## 1. Storage model

DenFS stores a small directory table and one fixed-size data slot for each entry. A directory consumes a directory-table entry but no file-data slot content. Files and directories are addressed by normalized relative paths such as `home/user/Documents/notes.txt`.

| Property | DenFS v3 |
|---|---:|
| Directory entries | 256 |
| Maximum stored path/name | 63 bytes plus NUL |
| File data slot | 65,536 bytes |
| Maximum file contents | 65,535 bytes |
| Data sectors per slot | 128 × 512 bytes |
| Directory record | 72 bytes |
| Directory table | 36 sectors |
| First data LBA | 37 |
| Required disk size | 32,805 sectors (16,796,160 bytes) |
| Default QEMU data image | 32 MiB |

The usable file-content pool is `256 × 65,535` bytes (approximately 16 MiB). The fixed-slot design is simple and predictable but wastes space inside partially filled slots. The filesystem has no extents, journal, file permissions, timestamps, symbolic links, sparse files, or crash-recovery log.

## 2. First-boot directory layout

First boot creates:

```text
home/
└── user/
    ├── Documents/
    ├── Downloads/
    ├── bin/
    └── tmp/
etc/
var/
└── log/
```

The shell starts in `home/user`. Relative paths are resolved against the current working directory; leading `/` paths are rooted at the DenOS filesystem namespace.

## 3. Path safety

The path layer rejects empty path components and repeated separators, `.` or `..` components in stored filenames, control bytes and device/path separator characters inside names, names longer than the 63-byte path limit, parent components that are not directories, and attempts to remove a non-empty directory. The normalizer rejects attempts to escape above the filesystem root.

## 4. File and directory operations

The kernel filesystem API includes:

```c
int fs_write(const char *path, const char *data);
const char *fs_read(const char *path);
int fs_touch(const char *path);
int fs_mkdir(const char *path);
int fs_remove(const char *path);
int fs_copy(const char *source, const char *destination);
int fs_move(const char *source, const char *destination);
int fs_is_directory(const char *path);
usize fs_entry_count_in_dir(const char *directory);
int fs_get_entry_in_dir(const char *directory, usize index,
                        char *name, usize name_capacity,
                        usize *size, int *entry_type);
```

`fs_copy` and `fs_move` currently support files, not whole directory trees. `fs_remove` removes files and empty folders. A directory with children is rejected with `FS_ERROR_DIRECTORY_NOT_EMPTY`.

The read API returns a pointer into the filesystem's in-memory cache. Treat it as read-only and do not retain it across another filesystem read if stable contents are needed. `fs_write` writes a NUL-terminated text buffer; arbitrary binary files are not yet a supported public feature. ELF validation and checksum utilities operate on buffers supplied by kernel code; this does not make DenFS a binary-safe filesystem.

## 5. Persistence and mount behavior

When the ATA disk is available, DenFS reads metadata and file data from the attached image. The kernel keeps an in-memory cache for lookup and editing, then persists changes to the ATA disk. When no disk is attached, the filesystem runs in a RAM fallback mode. `df` reports the filesystem's current backing/capacity information.

The standard QEMU image is named `denos-data.img`. The `make run` target attaches it explicitly as the primary IDE master (`if=ide,index=0`), which is the legacy PIO controller supported by the current ATA driver. The current driver does **not** support AHCI/SATA controllers or NVMe. In VirtualBox or another VM manager, attach a disk to an IDE controller; a SATA-only disk will not be detected and the kernel will correctly report RAM fallback. Booting an ISO without attaching the data image creates only a temporary RAM session.

When persistent storage is mounted, a file write is only reported as committed after the ATA data and directory writes complete. If an ATA write or flush fails, DenFS rolls back the in-memory entry, disables further persistent writes for that boot, and exposes the storage fault through `diskinfo`, `bootlog`, and the save error. If the disk fails while booting, a failed file-data read now aborts the mount instead of presenting a partially loaded directory as healthy. Files saved while the system is in RAM fallback are explicitly labelled **RAM only** by the editor and `write` command.

Troubleshooting a RAM fallback:

1. Run `make run` from the DenOS project directory; do not boot the ISO with a bare `-cdrom` command.
2. Check that `denos-data.img` exists beside the Makefile and is at least 16,796,160 bytes (`make storage-upgrade` expands an older image safely, making a `.backup`).
3. In DenOS, run `diskinfo` and `bootlog`. The boot log gives the ATA probe or mount failure reason.
4. Do not use `make clean-data` unless you intentionally want to remove the persistent filesystem image. `make clean` preserves it.

## 6. v1/v2 migration to v3

DenOS 0.4.9 recognizes two previous superblock layouts:

- v1: 48 entries, 16 KiB data slots, 7 directory sectors, flat file names.
- v2: 128 entries, 32 KiB data slots, 18 directory sectors, nested file and directory paths.

On mount, recognized v1 or v2 entries are loaded into RAM, the v3 metadata/data layout is created, and existing file contents and v2 directory entries are copied into the new slot positions. Unknown filesystem formats are not reformatted. If migration fails, DenOS falls back to RAM and reports that a backup should be retained.

Migration is not a substitute for a backup. Always preserve a copy of the raw image until you have booted the new release and verified your files.

## 7. Expanding an older disk image

The v3 layout requires at least 16,796,160 bytes. The recommended image is 32 MiB. An older image may be only 8 MiB; expand it before `make run`:

```bash
make storage-upgrade
```

This target copies an existing image to `denos-data.img.backup` if that backup does not already exist, then extends the image to 32 MiB without shortening the existing sectors. If the file is already at least 32 MiB, it is left unchanged.

## 8. Capacity and future work

The current maximums are deliberately modest. The next filesystem milestone should move to variable-length extents or a block allocator, use a free-space bitmap, add checksums/journaling, and support larger files. Metadata should eventually include timestamps, attributes, and permissions. A real recovery utility should verify metadata before performing an in-place migration.
