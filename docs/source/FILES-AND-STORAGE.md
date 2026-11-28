# Files and Storage — DenFS v4

DenOS 0.5.7 uses DenFS v4, a fixed-slot persistent filesystem with nested directories and long readable paths. It is designed for small local text files and settings, not large binary files or high-throughput storage.

## 1. Storage model

DenFS stores a directory table and one fixed-size data slot for each entry. A directory consumes a metadata entry but no file-data slot content. Files and directories use normalized relative paths such as `home/user/documents/Project Notes.md`.

| Property | DenFS v4 |
|---|---:|
| Directory entries | 256 |
| Maximum stored path/name | 255 bytes plus NUL |
| File data slot | 65,536 bytes |
| Maximum file contents | 65,535 bytes |
| Data sectors per slot | 128 × 512 bytes |
| Directory record | 264 bytes |
| Directory table | 132 sectors |
| First data LBA | 133 |
| Required disk size | 32,901 sectors (16,845,312 bytes) |
| Default QEMU data image | 32 MiB |

The usable file-content pool is `256 × 65,535` bytes (approximately 16 MiB). The fixed-slot design is simple and predictable but wastes space inside partially filled slots. The filesystem has no extents, journal, permissions, timestamps, symbolic links, sparse files, or crash-recovery log.

## 2. First-boot directory layout

First boot creates a lowercase home layout. The Aiden C sample installer places source files in matching `examples/`, `utilities/`, and `games/` folders. Existing capitalized legacy folders on older volumes are left untouched and are not duplicated on a fresh volume:

```text
home/
└── user/
    ├── documents/
    │   ├── welcome.md
    │   └── quick-notes.md
    ├── downloads/
    ├── projects/
    │   └── hello.c
    ├── examples/       # bundled Aiden C learning examples
    ├── utilities/      # bundled Aiden C utility programs
    ├── games/          # bundled Aiden C game sources
    ├── pictures/
    ├── music/
    ├── videos/
    ├── screenshots/
    ├── bin/
    └── tmp/
etc/
└── denos/
var/
└── log/
```

The shell starts in `home/user`. Paths are case-sensitive. Relative paths resolve against the current working directory; leading `/` paths are rooted at the DenOS filesystem namespace.

## 3. Path safety

The path layer accepts printable ASCII names and spaces, up to 255 bytes for a complete stored path. It rejects empty path components, `.` and `..` in stored names, control bytes, backslashes, colons, leading/trailing separators, parent components that are not directories, and attempts to remove non-empty directories. The normalizer can process `.` and `..` in user input but refuses traversal above the root.

## 4. File and directory operations

The kernel filesystem API includes:

```c
int fs_write(const char *path, const char *data);
const char *fs_read(const char *path);
int fs_touch(const char *path);
int fs_mkdir(const char *path);
int fs_mkdir_p(const char *path);
int fs_remove(const char *path);
int fs_copy(const char *source, const char *destination);
int fs_move(const char *source, const char *destination);
int fs_rename(const char *source, const char *destination);
int fs_exists(const char *path);
int fs_is_file(const char *path);
int fs_is_directory(const char *path);
usize fs_entry_count_in_dir(const char *directory);
int fs_get_entry_in_dir(const char *directory, usize index,
                        char *name, usize name_capacity,
                        usize *size, int *entry_type);
```

`fs_touch` is idempotent for an existing file but rejects an existing directory with `FS_ERROR_IS_DIRECTORY`. `fs_copy`, `fs_move`, and `fs_rename` operate on files, not whole directory trees. `fs_remove` removes files and empty folders. A directory with children is rejected with `FS_ERROR_DIRECTORY_NOT_EMPTY`.

The read API returns a pointer into the filesystem's in-memory cache. Treat it as read-only and do not retain it across another filesystem read if stable contents are needed. `fs_write` writes a NUL-terminated text buffer; arbitrary binary files are not yet a supported public feature. ELF validation and checksum utilities operate on buffers supplied by kernel code; this does not make DenFS a binary-safe filesystem.

## 5. Persistence and mount behavior

When the ATA disk is available, DenFS reads metadata and file data from the attached image. The kernel keeps an in-memory cache for lookup and editing, then persists changes to the ATA disk. When no disk is attached, the filesystem runs in RAM fallback mode. `df` reports current backing and capacity information.

The standard QEMU image is named `denos-data.img`. The `make run` target attaches it as the primary IDE master (`if=ide,index=0`), which is the legacy PIO controller supported by the current ATA driver. The current driver does **not** support AHCI/SATA controllers or NVMe. In VirtualBox or another VM manager, attach a disk to an IDE controller; a SATA-only disk will not be detected and the kernel will correctly report RAM fallback. Booting an ISO without attaching the data image creates only a temporary RAM session.

When persistent storage is mounted, a file write is reported as committed only after ATA data and directory writes complete. If an ATA write or flush fails, DenFS rolls back the in-memory entry, disables further persistent writes for that boot, and exposes the storage fault through `diskinfo`, `bootlog`, and the save error. A failed file-data read aborts the mount instead of presenting a partially loaded directory as healthy. Files saved in RAM fallback are temporary.

Troubleshooting a RAM fallback:

1. Run `make run` from the project directory; do not boot the ISO with a bare `-cdrom` command.
2. Check that `denos-data.img` exists beside the Makefile and is at least 16,845,312 bytes (back it up and enlarge it manually when necessary; see `docs/RECOVERY.md`).
3. In DenOS, run `diskinfo` and `bootlog` to see the ATA probe or mount failure reason.
4. The root Makefile has no destructive data-removal target. `make clean` preserves the data image; remove it manually only after a verified backup.

## 6. v1/v2/v3 migration to v4

DenOS 0.5.7 recognizes three previous superblock layouts:

- v1: 48 entries, 16 KiB data slots, 7 directory sectors, flat file names.
- v2: 128 entries, 32 KiB data slots, 18 directory sectors, nested file and directory paths.
- v3: 256 entries, 64 KiB data slots, 36 directory sectors, up to 63-byte stored paths.

On mount, recognized v1/v2/v3 entries are loaded into RAM, the v4 metadata/data layout is created, and existing file contents and directory entries are copied to their new slots. Legacy names are preserved within their original supported lengths. Unknown filesystem formats are not reformatted. If migration fails, DenOS falls back to RAM; retain the backup.

Migration is not a substitute for a backup. Always preserve a copy of the raw image until you have booted the new release and verified your files.

## 7. Expanding an older disk image

The v4 layout requires at least 16,845,312 bytes. The recommended image is 32 MiB. An older or undersized image may be expanded before `make run`. Stop the VM, create and verify a backup, then extend the image to 32 MiB:

```bash
cp -a denos-data.img denos-data.img.backup
truncate -s 32M denos-data.img
```

The build does not resize existing images automatically, and `run` refuses an undersized image. This avoids modifying a filesystem image without an explicit backup.

## 8. Capacity and future work

The current maximums are deliberately modest. The next filesystem milestone should move to variable-length extents or a block allocator, use a free-space bitmap, add checksums/journaling, and support larger files. Metadata should eventually include timestamps, attributes, and permissions. A recovery utility should verify metadata before an in-place migration.
