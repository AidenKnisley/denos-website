# DenOS experimental networking

DenOS 9.0.0 adds an intentionally narrow Ethernet path for the maintained QEMU PC configuration. This is an initial driver and protocol milestone, not a complete Internet stack.

## Supported target

- PCI configuration mechanism 1 discovery (I/O ports `0xCF8` / `0xCFC`).
- Intel 82540EM-compatible E1000 device (`8086:100E`).
- 32-bit MMIO BAR, PCI memory decoding and bus mastering.
- Fixed, statically allocated DMA descriptor rings and 2 KiB packet buffers.
- Ethernet frame transmit/receive, ARP request/reply, IPv4 header/checksum validation, and ICMP echo request/reply.
- Static QEMU user-network profile: guest `10.0.2.15/24`, gateway `10.0.2.2`.

The driver uses polling. It does not install an E1000 interrupt handler. Receive-ring polling runs as a bounded cooperative kernel service; the `ping` wait loop also services pending packets. The service scheduler runs from the kernel shell wait loop and from the bounded `ping` wait loop.

## Run it

The supplied `make run` target attaches an E1000 device to QEMU's user-mode network backend. From the DenOS terminal:

```text
net
ping 10.0.2.2
```

`net` reports adapter/link state, MAC address, configured IPv4 address, gateway, and frame counters. `ping` resolves the target using ARP and sends one ICMP echo request.

If the E1000 device is absent, uses an unsupported BAR layout, or cannot be initialized, the adapter remains offline and the rest of the OS continues booting.

## Important limits

- No DHCP; the address is a QEMU-specific static profile.
- No DNS resolver, UDP socket API, TCP, IPv6, Wi-Fi, Bluetooth, VLAN, routing, firewall, or network configuration application.
- ARP cache currently holds one peer entry.
- IPv4 processing currently accepts ICMP only; there is no general-purpose socket layer.
- The driver supports the QEMU 82540EM/E1000 target, not every Intel NIC revision or arbitrary physical hardware.
- DMA buffers are identity-mapped kernel memory under the bootstrap's 4 GiB mapping. A future virtual-memory/IOMMU design must replace this assumption.
- The interface is not a security boundary and must not be used to process untrusted traffic on a real network.

## Implementation map

| File | Responsibility |
|---|---|
| `kernel/drivers/pci.c` | PCI configuration-space discovery and bus-master enablement |
| `kernel/drivers/e1000.c` | E1000 MMIO registers, descriptor rings, DMA, polling and frame I/O |
| `kernel/net.c` | Ethernet, ARP, IPv4 validation, ICMP echo and static QEMU profile |
| `kernel/include/net.h` | Network status and ping interface |
| `tests/net_protocol_test.c` | Host tests for ARP replies, IPv4 validation and ICMP checksums |

The host protocol tests do not validate DMA operation or QEMU packet exchange. Those require an emulator smoke test after the ISO is built and booted.
