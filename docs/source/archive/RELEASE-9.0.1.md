# DenOS 9.0.1 — Kernel Services and Desktop Refinement

## Release direction

DenOS 9.0.1 builds on the 9.0.0 Cinnamon-inspired desktop shell. This release focuses on real kernel infrastructure instead of adding decorative mock applications. It adds a VFS mount namespace, cooperative kernel-service scheduling, bounded IPC queues, a kernel event queue, and a refreshed wallpaper set.

## Kernel infrastructure

- Longest-prefix VFS routing for the DenFS root, read-only procfs, and minimal devfs.
- Live procfs status views for uptime, memory, tasks, IPC, events, mounts, devices, and network counters.
- Cooperative service scheduler with bounded per-pass work, priority ordering, periodic deadlines, task IDs, run counters, and stop/restart lifecycle.
- E1000 receive polling moved into a scheduled service; heap metadata is checked periodically.
- Fixed-capacity FIFO IPC queues associated with scheduler task IDs, with payload limits and overflow accounting.
- Bounded timestamped event queue with task lifecycle events and drop accounting.
- Shell commands `tasks`, `ps`, `ipc`, `events`, and `mounts`, plus absolute-path VFS access for `cat`, `ls`, `write`, `mkdir`, and `rm`.

## Desktop refinements

- Rebuilt the home workspace with legible shortcut tiles, a live date/time and network/session widget, and a forest-green default wallpaper.
- Expanded the bottom panel with pinned launchers, an active-task control, storage/network status, clock, notifications, and session actions.
- Reworked the searchable Menu with a larger search field, category rail, clearer application list, and consistent app-specific window glyphs.
- Refined light/dark neutral surfaces, green accent contrast, shadows, borders, and corner radii.
- Removed stale invisible home-screen click areas so blank wallpaper is no longer an accidental launcher.
- Simplified application chrome to compact square window controls and restrained neutral launcher surfaces.
- System Monitor now shows cooperative service counters and network link state.
- Eight new wallpaper designs are supplied as lossless 2560×1440 masters, with compact 640×360 PNG/QOI previews used by the current kernel renderer.
- Added a reproducible wallpaper generation tool and optional `make wallpapers` target (requires Pillow and NumPy).

## Verification

`make test` covers the event queue, IPC queues, VFS path routing, scheduler, storage/migration, calculator, core services, hardware mocks, physical memory, graphics, mouse/window interaction, keyboard polling, framebuffer, QOI, wallpaper integrity, and ARP/IPv4/ICMP protocol behavior. All kernel C translation units compile with the freestanding warning-as-error flags.

A complete ISO build and QEMU boot/network smoke test were not performed in the current build environment because NASM, GRUB rescue tooling, and QEMU are not installed. Host tests do not validate E1000 DMA operation or real boot behavior.

## Still not a full OS

The scheduler is cooperative and has no saved CPU contexts or task stacks. All built-in apps remain in one kernel address space. There is no ring-3 userspace, preemptive process scheduler, syscall ABI, ELF loader, memory protection, TCP/UDP/DNS/DHCP stack, USB support, or general-purpose driver ecosystem. DenFS remains a small fixed-slot filesystem without journaling. DenOS is an experimental hobby OS, not a daily-driver replacement for Linux Mint.
