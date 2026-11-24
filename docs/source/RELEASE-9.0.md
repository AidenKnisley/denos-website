# DenOS 9.0.0 — Release notes

## Product direction

Version 9.0.0 is a desktop-shell redesign. It moves away from the previous top-bar/left-rail workspace and adopts a conventional desktop layout inspired by Linux Mint Cinnamon interaction patterns. The design uses a persistent bottom panel, desktop shortcuts, a searchable application menu, categorized application list, status/clock area, and standard application chrome. It remains an independent DenOS kernel and is not a Linux distribution.

## Desktop features

- Wallpaper-backed desktop with Home, Documents, Photos, and Terminal shortcuts.
- Persistent bottom panel with Menu, Files/Terminal/Settings quick launchers, current application label, storage/input state, clock, notifications, and session/power control.
- Searchable Menu supporting ten built-in apps, categories, keyboard navigation, and Enter-to-launch.
- Menu categories: All apps, Accessories, System, Settings, and Places.
- Application frame with app icon, title, maximize/restore, minimize-to-desktop, and close controls.
- Notification/status card and session menu for text console, restart, and shutdown.
- A welcome dashboard with quick favorites and a recent Documents entry.

## Included applications

1. Files — nested folders, bounded file list, create, open, copy, move, paste, and delete.
2. Text Editor — small plain-text files, cursor navigation, Ctrl+S, and unsaved-change confirmation.
3. Terminal — built-in filesystem/system commands and GUI/text-session switching.
4. Calculator — integer expression evaluation with error handling.
5. Calendar — RTC-based month view.
6. Image Viewer — gallery for the eight bundled QOI wallpaper assets, previous/next, and Set wallpaper.
7. System Monitor — CPU vendor, heap, PMM, storage, and display information.
8. Settings — light/dark, accent, and wallpaper preferences.
9. About — system/version details.
10. Help — interaction instructions.

## Appearance system
- Added small vector-style app symbols for Files, documents, Terminal, Calculator, Calendar, Image Viewer, System Monitor, Settings, About, and Help; the Menu and app catalog use the same icon language.

- Calm green is the default accent; blue, violet, and amber are alternatives.
- Light/dark surfaces share common spacing, cards, borders, and button treatment.
- Anti-aliased bundled regular/bold UI font remains in use.
- Default wallpaper selection is the Orchid image (index 4), while a saved setting takes precedence.
- App windows, desktop shortcuts, panel, Menu, notifications, and power menu now share one component vocabulary.

## Input model

- Click Menu to open the launcher.
- Type to filter application names/descriptions.
- Up/Down changes selection; Enter opens the selected app; Escape closes Menu.
- Click categories to filter results.
- The bottom panel launches Files, Terminal, and Settings.
- Click the system area to open notifications; click the power control for console/restart/shutdown options.
- Application green control toggles a near-fullscreen frame; yellow minimizes to the desktop; red closes the active page.
- The text-only shell remains accessible using `cli` or `shell` from Terminal; `gui` or `desktop` returns.

## Storage and migration

DenFS v3 remains the storage layer. It supports 256 fixed metadata entries, nested path names, files up to 65,535 bytes, and a 32 MiB default QEMU data image. Recognized v1/v2 layouts can be migrated after expanding the disk image. The filesystem is not journaled, and normal build cleanup preserves data images.

## Verification

Host-side tests cover storage and migration, calculator, core services, mocked hardware, physical page manager, framebuffer/compositor, mouse/window interaction, keyboard polling, QOI decode, and wallpaper asset integrity. Freestanding kernel C compilation uses warnings-as-errors. A real ISO/boot verification must be recorded separately; host tests alone are insufficient.

## Not included / not yet supported

- Linux ABI compatibility or use of the Linux kernel.
- User-mode processes, process isolation, preemptive scheduling, system-call boundary, or independent application loader.
- Complete network services (DHCP, DNS, TCP/UDP sockets, IPv6), browser, Wi-Fi, Bluetooth, USB storage, broad audio, GPU acceleration, package installation, third-party apps, or POSIX toolchain. The experimental E1000/ARP/IPv4/ICMP path is QEMU-focused.
- General PNG/JPEG decoding, full photo management, rich-text editing, spreadsheet/office suite, or calendar reminders.
- Drag-resizable application windows and multiple independently running apps.

Version 9.0.0 is a substantial interface and shell milestone, not a declaration of Linux feature parity or production readiness.
