# DenOS hardware drivers

The maintained target is a QEMU PC machine with an x86-64 CPU, legacy PS/2 keyboard, IDE disk, PIT/RTC, VGA text console, PC speaker, and emulated Intel E1000 NIC.

## Console and keyboard

The serial driver initializes an 80×25 VGA text console at `0xB8000`, controls the hardware cursor, handles basic ANSI cursor/color/erase sequences, and mirrors output to COM1 when the UART scratch-register test succeeds. Keyboard input is polled from the legacy i8042 controller. Shift, caps lock, extended navigation keys, and auxiliary-byte filtering are supported. USB HID and mouse input are not used by this release.

## Timer and interrupts

The PIT is configured to 100 Hz. The timer driver installs IRQ0 in the IDT and routes the interrupt through the PIC. Current scheduled callbacks execute later from normal kernel context, not inside the IRQ handler.

## Storage

The ATA driver probes legacy IDE positions, issues IDENTIFY DEVICE, and performs bounded 28-bit LBA PIO transfers. DenFS uses ATA sector operations when a supported disk is available. AHCI, SATA native mode, NVMe, USB mass storage, and removable media are not implemented.

## PCI and Ethernet

PCI configuration mechanism 1 provides device discovery and I/O BAR/command setup. The E1000 driver supports the QEMU Intel 82540EM-compatible device (`8086:100E`) with MMIO registers and DMA RX/TX rings. The network stack layers ARP/IPv4/ICMP, UDP, DHCP client, DNS A-record resolver/cache, one synchronous TCP client, and an HTTP/HTTPS text reader over the E1000 driver. HTTPS is included by default (BearSSL TLS 1.2) with chain/hostname/date checks; see `NETWORKING.md`. QEMU starts with a static user-network profile; `dhcp` requests a lease elsewhere. TLS 1.3, revocation checks, IPv6, Wi-Fi, concurrent sockets, a TCP server, and fragment reassembly are not implemented. See `NETWORKING.md`.

## RTC, speaker, and diagnostics

The CMOS RTC uses stable double sampling, BCD/binary conversion, and range checking. The PC speaker produces bounded PIT channel-2 tones. Boot records, kernel logs, device status, and panic output are available in the text console; COM1 mirrors diagnostics when present.

## Safety notes

Drivers use polling and fixed hardware assumptions appropriate to the QEMU target. They are not a broad physical-hardware support claim. Continue to test with QEMU and keep a host-side backup of the data image.
