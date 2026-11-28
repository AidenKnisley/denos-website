# Adding a DenOS system component

New kernel code should be a small freestanding C subsystem with a public header, bounded resource use, clear failure paths, and host-side tests where hardware access is not required.

## File organization

- CPU/platform support belongs in `kernel/arch/x86_64/`.
- Startup, boot arguments, clock, and logging belong in `kernel/core/`.
- Hardware access belongs in `kernel/drivers/`.
- Reusable algorithms belong in `kernel/lib/`.
- Physical memory and heap code belong in `kernel/mm/`.
- Kernel-wide services belong in `kernel/sys/`.
- Filesystem backends belong in `kernel/fs/`.

Add the `.c` and `.h` files in the corresponding folders. The Makefile discovers kernel C files recursively, so no source list update is required. Add explicit host test targets and include them in `make -f tests/Makefile test`.

## Startup integration

If a subsystem needs initialization, call it from `kernel/kernel.c` after its dependencies are initialized. Validate optional Multiboot2 tags before parsing. Treat absent devices or malformed input as recoverable whenever possible. Register devices and services through the existing registries; keep interrupt handlers bounded and do not call blocking shell functions from interrupt context.

## API expectations

- Validate all pointers, sizes, capacities, and integer arithmetic.
- Avoid unbounded loops on hardware state; use timeouts or iteration budgets.
- Keep allocations and queues bounded.
- Document whether an API is safe in interrupt context.
- Do not describe structural validation as execution, or a cooperative task as a process.
- Keep cryptographic claims precise: the current PRNG is not cryptographically secure.

## Verification

Run the specific host test and then `make -f tests/Makefile test`. Compile every kernel C file with the project freestanding `-Wall -Wextra -Werror` flags. A passing host suite is not equivalent to an ISO build or QEMU boot test; report those separately.
