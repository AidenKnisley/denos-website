# DenOS userland C library foundation

This directory introduces a hosted, namespaced support-library prototype under
`userland/libc`. It is deliberately separate from the kernel. The current Aiden
VM does not load headers, link external object files, or provide a POSIX process
ABI, so these modules are **not yet callable from Aiden C programs running in
the kernel VM**.

## Modules

The tree currently contains 22 modules:

| Module | Purpose |
|---|---|
| assert | Explicit assertion-result helper |
| args | Command-line argument lookup |
| base64 | Bounded Base64 encoder |
| bitmap | Bounded bit access |
| crc32 | CRC-32/ISO-HDLC |
| csv | Bounded CSV field reader with quoted-field support |
| ctype | ASCII character classification and case conversion |
| datetime | Gregorian leap-year and date validation |
| format | Integer-to-string conversion |
| hashmap | Open-addressed string-key map |
| ini | INI section/key lookup |
| json | Bounded JSON string-token decoder |
| locale | C-locale baseline |
| math | Basic floating-point helpers |
| memory | Memory set/copy/move/compare |
| path | Path traversal check and basename |
| ringbuf | Bounded byte ring buffer |
| stdlib | Integer parsing, absolute value and bounded-size sorting |
| string | Length, comparison, search and bounded copy |
| tokenizer | In-place delimiter splitting |
| utf8 | Strict UTF-8 scalar decoder |
| vector | Dynamically growing generic vector |

All public symbols use the `den_` prefix to avoid collisions with host libc.
The modules are ordinary hosted C11/GNU11 source and currently use the host
allocator for dynamic containers. They must not be linked into the freestanding
kernel as-is.

## Test

Run:

```sh
make -f tests/Makefile libc-test
```

The test is compiled with `-Wall -Wextra -Werror`. Run the complete regression
suite with `make -f tests/Makefile check`.

## Important limitations

This is a practical first userland library layer, not a complete ISO C standard
library. The JSON module currently decodes JSON strings, not complete JSON
documents. CSV and INI parsers are bounded and intentionally small. The
floating-point helpers are elementary and are not a replacement for libm.
The sorting routine uses a bounded temporary element buffer. The map currently
has no deletion/rehash API. The Base64 module currently encodes but does not
decode.

The next integration milestone is a stable ring-3 syscall ABI and a process
loader. Once that exists, the allocator, file I/O, terminal I/O, process and
time APIs can be bound to DenOS rather than host facilities.
