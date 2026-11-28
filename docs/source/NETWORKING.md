# DenOS 0.5.7 networking and terminal web reader

DenOS 0.5.7 contains an early, bounded IPv4 client stack for the supported Intel E1000 device. It is designed for learning and QEMU networking, not as a complete or security-hardened Internet stack.

## Supported hardware and link

- PCI configuration-space discovery and the QEMU Intel 82540EM-compatible E1000 (`8086:100E`).
- 32-bit MMIO BAR, PCI memory decoding/bus mastering, fixed DMA RX/TX rings, and cooperative polling.
- Ethernet II, ARP request/reply, an eight-entry expiring ARP cache, IPv4 header/checksum validation, and ICMP echo.
- IPv4 UDP checksums and a bounded datagram receive queue for kernel clients.
- Static QEMU user-network defaults: guest `10.0.2.15/24`, gateway `10.0.2.2`, DNS server `10.0.2.3`.

The NIC is polled rather than interrupt-driven. IPv4 fragments are dropped; there is no fragment reassembly. The maintained hardware target is QEMU's E1000 model, not every physical NIC.

## Getting online

`make run` attaches an E1000 device to QEMU's user-mode NAT network. The static defaults are suitable for that QEMU network:

```text
net
ping 10.0.2.2
ping example.com
```

On another Ethernet network, request a lease explicitly:

```text
dhcp
net
ping example.com
```

The DHCP client performs Discover/Offer/Request/Ack, checks the transaction ID and client MAC, validates option lengths, offered address/netmask, and selected-server identity, and applies router and DNS options. Lease renewal, release, expiry tracking, option overload, and persistent lease storage are not implemented. A DHCP failure leaves the previous configuration in place.

## DNS and diagnostics

```text
dns example.com
ping example.com
```

The resolver asks the configured DNS server for IPv4 A records, validates the transaction and question, follows up to eight CNAME aliases (including compressed names), and caches successful answers using the minimum TTL across the alias chain (capped at one day). TTL-zero answers are not cached. Numeric IPv4 strings bypass DNS. AAAA/IPv6, search domains, DNS-over-TLS/HTTPS, and configurable resolver lists are not implemented.

`net` displays link state, MAC, address, netmask, gateway, DNS, RX/TX counters, and whether the current configuration came from DHCP or the built-in static profile.

## Terminal web reader

The `web` command fetches pages and renders readable text in the terminal:

```text
web https://example.com/
web http://example.com/
```

HTTPS is compiled into the normal build through the vendored BearSSL source. It uses TLS 1.2 only and offers ECDHE with AES-128-GCM or ChaCha20-Poly1305. The client sends SNI and checks the server name against the certificate, validates the certificate chain against a static trust-anchor list generated from the build host's system CA bundle, and checks certificate validity dates against the hardware RTC. If RDRAND is unavailable or fails, the clock is invalid, the CA list is empty, or any TLS/certificate check fails, the connection is rejected. It never retries the URL as unencrypted HTTP.

### Build and run HTTPS support

The normal `make build` image includes HTTPS. The DenOS archive includes the pinned BearSSL source. When the source tree is absent, fetch it and verify its SHA-256 with `./tools/fetch_bearssl.sh third_party/BearSSL`. The build generates trust anchors from the host CA bundle automatically:

```bash
make build
make run
```

To use a specific PEM/CRT CA bundle with the normal build:

```bash
make build TLS_CA_BUNDLE=/path/to/ca-bundle.pem
make run TLS_CA_BUNDLE=/path/to/ca-bundle.pem
```

BearSSL objects are built freestanding with fortification disabled and both BearSSL host clock backends explicitly disabled (`BR_USE_UNIX_TIME=0`, `BR_USE_WIN32_TIME=0`). DenOS supplies the verification date from its RTC with `br_x509_minimal_set_time()`, so the BearSSL object must not import the host `time()` API. The build host needs a C compiler, GNU Make, an archiver, and a system CA bundle. `curl` or `wget`, `sha256sum`, and `tar` are needed only when fetching BearSSL in a checkout where the vendored source tree is absent. The target CPU must implement a working x86 RDRAND instruction. The RTC is expected to be set to UTC and to a correct current date/time; an inaccurate clock can cause valid certificates to fail or, more seriously, weaken expiry checks. QEMU is launched with `+rdrand` and `-rtc base=utc` for the virtual CPU and UTC hardware clock.

BearSSL 0.6 supports TLS 1.2 but not TLS 1.3. Its minimal X.509 engine validates signatures, issuer/subject relationships, key usage, basic constraints, critical extensions, certificate dates, and the requested server name, but it does not perform certificate revocation checks. This implementation is an experimental OS integration, not a production-hardened browser or TLS stack. Do not use it for banking, passwords, or other sensitive activity until it has been independently reviewed and tested against real servers.

The vendored BearSSL 0.6 source is distributed under the MIT License; its copyright and license notices remain in `third_party/BearSSL`. Upstream describes this version as beta-quality, and its minimal X.509 verifier omits revocation checks. Treat this OS integration as experimental and not suitable for sensitive use. See `docs/THIRD-PARTY-NOTICES.md`.

The terminal reader sends an HTTP/1.0 GET, supports one absolute HTTP or HTTPS redirect, accepts basic HTTP response framing including chunked transfer encoding, rejects duplicate/conflicting `Content-Length` and `Transfer-Encoding` headers and checks `Content-Length` for short responses. It renders common block-level HTML (headings, paragraphs, lists, tables, preformatted blocks, quotes, and separators), decodes a small safe subset of entities, wraps output for the 80-column console, and pages long documents. Use PageUp/PageDown or Up/Down to scroll, Home/End to jump, `L` to browse links, `1`-`9` to open a quick link, `G` to enter a URL, `B`/`F` to move backward/forward, `I` to browse images, and `Q` to exit. Relative, parent-directory (`../`), query-only, root-relative, protocol-relative, and absolute HTTP(S) links are resolved; a bounded back/forward history is kept. HTML entities are decoded in URL attributes. HTTPS-to-HTTP redirects are refused.

The HTML renderer supports common text-oriented block structure (headings, paragraphs, lists, tables, quotes, preformatted blocks, separators, and inline emphasis/link markers). Its CSS subset handles `display:none` and `visibility:hidden` rules for simple tag, `.class`, and `#id` selectors, plus matching inline styles and the HTML `hidden` attribute; it does not perform full browser layout or style calculation. Inline scripts support only literal-string `document.write()`/`document.writeln()` calls; this is not a general JavaScript engine and does not run expressions, variables, loops, event handlers, or external scripts. Image references are collected in the `I` gallery; the graphics viewer decodes non-interlaced 8-bit PNG (grayscale, RGB, indexed/palette, grayscale-alpha, and RGBA), QOI, and uncompressed 24-bit/32-bit BMP, compositing transparency over white. JPEG, SVG, animated formats, interlaced/high-bit-depth PNG, external stylesheets, cookies, and form submission are not implemented. Image response data is capped at about 60 KiB and decoded images at 640×480. Response storage is bounded; oversized or interrupted pages are marked as truncated.

A TCP/TLS idle operation waits up to six seconds before reporting a transport timeout. BearSSL error 31 is `BR_ERR_IO`; DenOS writes an additional `TLS transport detail` line to COM1/`build-tls/serial.log` (or `build/serial.log` when `TLS=0`) so it can be distinguished from certificate or TLS protocol failures. The detail identifies receive timeout, peer reset, peer EOF without `close_notify`, failed/unacknowledged send, or a closed peer receive window. A TLS error still aborts the connection and never disables verification.

This remains a limited terminal text web client, not a graphical or standards-compliant browser. It supports one synchronous TCP client connection at a time, keyboard-operated links, a limited text renderer, and the documented image formats. There is no general JavaScript runtime, CSS box layout, mouse interaction, cookies, form submission, external CSS/JavaScript, JPEG/SVG/GIF decoding, fragment navigation, or multi-tab support.

## Protocol and security limits

- E1000 only; no Wi-Fi, USB NIC, VLAN, IPv6, or other network drivers.
- ARP/IPv4/ICMP/UDP and a deliberately small DHCP/DNS/TCP client subset.
- One synchronous TCP connection; no listening sockets, concurrent sockets, retransmission queue, SACK, window scaling, congestion control, or out-of-order reassembly.
- No IPv4 fragment reassembly, ICMP error handling, routing daemon, firewall, NAT, packet-filter API, or network configuration UI.
- DHCP lease renewal/expiry is not managed automatically.
- DNS supports IPv4 A lookup and bounded CNAME-chain following; AAAA/IPv6 remains unsupported.
- TLS 1.2 only in the normal BearSSL-enabled build; no TLS 1.3, certificate revocation (CRL/OCSP), client certificates, or secure time synchronization.
- The normal `make build`/`make run` workflow includes BearSSL HTTPS; use `TLS=0` only to make an HTTP-only image.
- Fixed buffers, bounded queues, and polling are used throughout. This code is not a security boundary and has not been validated against hostile Internet traffic.
- DMA buffers rely on the current identity-mapped physical-memory setup. An IOMMU-aware DMA allocator is future work.

## Implementation map

| Source | Responsibility |
|---|---|
| `kernel/drivers/pci.c` | PCI discovery and command-register setup |
| `kernel/drivers/e1000.c` | E1000 MMIO, DMA descriptor rings, polling and frame I/O |
| `kernel/net.c` | Ethernet, ARP cache, IPv4 and ICMP |
| `kernel/net/udp.c` | UDP checksums, send and bounded receive queue |
| `kernel/net/dhcp.c` | DHCP client and lease validation |
| `kernel/net/dns.c` | A/CNAME resolver, compressed-name validation and TTL cache |
| `kernel/net/tcp.c` | Single synchronous TCP client connection |
| `kernel/net/tls.c` | BearSSL TLS 1.2 transport, SNI and X.509 validation |
| `kernel/net/bearssl_compat.c` | Minimal freestanding C runtime symbols required by BearSSL |
| `kernel/net/http.c` | HTTP/HTTPS GET, response parsing and HTML-to-text rendering |
| `kernel/include/net.h` | Public network status and client API |
| `kernel/include/net_internal.h` | Internal protocol interfaces |
| `tools/fetch_bearssl.sh` | Pinned source download and SHA-256 verification |
| `tools/generate_tls_roots.sh` | Generate static trust anchors from the build host CA bundle |
| `tests/net_protocol_test.c` | ARP, IPv4, ICMP and checksum tests |
| `tests/net_transport_test.c` | Emulated DHCP, DNS, TCP and HTTP peer tests |

Host tests exercise packet logic with an emulated peer. The TLS adapter syntax check uses a test-only BearSSL API stub; it does not prove a real certificate handshake. `make -f tests/Makefile check-stack-usage` also compiles each kernel C unit with GCC stack-usage reports and enforces an 8 KiB per-function-frame budget. A real TLS smoke test requires an ISO build and live QEMU/Internet testing.
