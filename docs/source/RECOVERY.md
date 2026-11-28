# DenOS data backup, migration, and recovery

DenOS is experimental software. Keep a second copy of important files outside the DenOS disk image. DenFS is not a journaling filesystem and does not provide crash-consistent transactions across power loss.

## Where personal data lives

The persistent QEMU disk is `denos-data.img` in the project directory. The current first-boot layout creates `/home/user/documents`, `downloads`, `projects`, `examples`, `utilities`, `pictures`, `music`, `videos`, `screenshots`, `games`, `bin`, and `tmp`, along with `/etc/denos` and `/var/log`. Existing capitalized legacy directories on older volumes are left untouched. Sample Aiden C sources are seeded into `examples/`, `games/`, and `utilities/` only when each destination is absent. The shell starts in `/home/user`; Notes uses `/home/user/documents/quick-notes.md`.

## Make a backup

Shut down DenOS cleanly with the shell command `halt`, or close the QEMU session only after the guest has stopped writing. Then copy the image:

```sh
cp -a denos-data.img denos-data.img.manual-backup
```

For extra protection, keep a copy on another physical device. A backup on the same host disk does not protect against host drive failure. Do not copy a live disk image while DenOS is writing to it.

## Upgrade a v1/v2/v3 image to v4

DenOS 0.5.7 recognizes v1, v2, and v3 fixed-slot directory layouts and migrates them to DenFS v4. V4 has 256 directory entries, 65,535 bytes maximum content per file, paths up to 255 bytes, and a 132-sector directory table. The minimum disk size is 16,845,312 bytes; the normal project image is 32 MiB.

1. Stop the VM.
2. Make a manual copy of `denos-data.img`.
3. If the image is smaller than 32 MiB, enlarge it with `truncate -s 32M denos-data.img` after backing it up.
4. Run `make build`, then `make run`.
5. Use `ls`, `cd`, and `cat` to inspect the home folders and important files.
6. Use `df` to inspect capacity.
7. Keep the backup until you have verified the important files.

The build never changes an existing data image. The run target refuses undersized images and prints the backup-and-resize commands rather than resizing them automatically.

## Unknown or malformed disks

The filesystem recognizes supported v1/v2/v3 superblock versions and migrates them to v4. If a disk has an unknown signature/version or malformed metadata, DenOS should refuse to treat it as an old supported volume and may use a RAM-backed fallback. Do not force-format the disk to make the warning disappear. Preserve the original image and report the boot log and serial output.

## Rebuild without deleting data

```sh
make clean
make build
```

`make clean` removes generated `build/` and `build-tls/` files. It does not remove `denos-data.img` or any backup.

To intentionally discard the persistent filesystem, stop the VM and manually remove the image only after verifying your backups:

```sh
rm -f denos-data.img
```

The next `make build` creates a new empty 32 MiB image.

## Recovery limitations

There is no fsck utility, journaling, snapshots, encryption, permission model, or guaranteed crash recovery in this release. A sudden power-off during a metadata update can damage the filesystem. The safest response to an unexpected mount failure is to stop using the original image, make a sector-level copy, and investigate the copy.
