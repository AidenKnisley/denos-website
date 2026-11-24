# DenOS data backup, migration, and recovery

DenOS is experimental software. Keep a second copy of important files outside the DenOS disk image. DenFS is not a journaling filesystem and does not provide crash-consistent transactions across power loss.

## Where personal data lives

The persistent QEMU disk is `denos-data.img` in the project directory. The current first-boot layout creates:

- `/home/user/Documents`
- `/home/user/Downloads`
- `/home/user/bin`
- `/home/user/tmp`
- `/var/log`
- `/etc`

The default shell working directory is `/home/user`. Configuration and system files live under `/etc`; there is no desktop-preferences directory in this command-line release.

## Make a backup

Shut down DenOS cleanly with the shell command `halt`, or close the QEMU session only after the guest has stopped writing. Then copy the image:

```sh
cp -a denos-data.img denos-data.img.manual-backup
```

For extra protection, keep a copy on another physical device. A backup on the same host disk does not protect against host drive failure.

To inspect the size:

```sh
ls -lh denos-data.img denos-data.img.manual-backup
```

Do not copy a live disk image while DenOS is writing to it.

## Upgrade a v1/v2 image to v3

DenOS 0.4.9 recognizes earlier v1 and v2 fixed-slot directory layouts. The v3 format has 256 directory entries, 65,535 bytes maximum content per file, and a 36-sector directory table. Before migration, the raw image must be at least 16,796,160 bytes. The normal project image is 32 MiB.

1. Stop the VM.
2. Make a manual copy of `denos-data.img`.
3. Run `make storage-upgrade`.
4. Boot DenOS 0.4.9.
5. Use `ls`, `cd`, and `cat` to inspect the home folders and important files.
6. Use `df` to inspect capacity.
7. Keep the backup until you have verified the important files.

The upgrade target preserves an adjacent `.backup` copy if one does not already exist, then expands the image. If that backup file already exists, the command does not overwrite it; create a separately named manual backup first if you are unsure which copy it contains.

## Unknown or malformed disks

The filesystem recognizes supported old superblock versions and migrates them. If a disk has an unknown signature/version or malformed metadata, DenOS should refuse to treat it as an old supported volume and may use a RAM-backed fallback. Do not force-format the disk to make the warning disappear. Preserve the original image and report the boot log and serial output.

## Rebuild without deleting data

Use:

```sh
make clean
make
```

`make clean` removes only `build/`. It does not remove `denos-data.img` or the adjacent migration backup.

`make clean-data` is intentionally destructive. It deletes the raw and VDI data images. Use it only when you explicitly want to discard all persistent DenOS files.

## Recovery limitations

There is no fsck utility, journaling, snapshots, encryption, permission model, or guaranteed crash recovery in this release. A sudden power-off during a metadata update can damage the filesystem. The safest response to an unexpected mount failure is to stop using the original image, make a sector-level copy, and investigate the copy.
