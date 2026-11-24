# CPU exceptions and kernel panic diagnostics

DenOS 0.4.9 installs CPU exception gates at the first instruction-level entry to `kernel_main`, before serial/console
initialization and before memory, filesystem, or device subsystems are started.

## Captured state

The common assembly entry normalizes the optional CPU error-code slot and
captures all general-purpose registers plus the architectural return frame.
The C diagnostic prints the vector/name, error code, RIP, RSP, RBP, RFLAGS,
CS/SS, and GPR values. Page faults additionally report CR2 and decode the
present/write/user/reserved/instruction/protection-key/shadow-stack/SGX bits.

The stack walker follows at most eight frame-pointer links and validates each
link against the bootstrap kernel stack bounds. Kernel C is compiled with
`-fno-omit-frame-pointer` so these links can be useful. The trace prints return
addresses, not symbol names; use the linker's map/debug information to resolve
them.

## Double-fault stack

The bootstrap GDT now includes a 64-bit TSS. Its IST1 points to a dedicated
16 KiB emergency stack, and IDT vector 8 uses IST1. The regular RSP0 is the
existing bootstrap stack top. The descriptor is installed and loaded only
after ordinary exception gates are live, so a TSS setup fault can itself be
reported.

## Dedicated timer IRQ stack and register preservation

PIT IRQ0 is configured to use TSS IST2, a separate 16 KiB stack. It does not
consume the interrupted shell or kernel stack while saving its state and calling
the C handler. IST1 remains reserved for double fault. The PIT IRQ stub now
preserves every general-purpose register across the asynchronous interrupt. It continues to save/restore the x87/SSE state with
FXSAVE/FXRSTOR and to issue the PIC EOI after incrementing the tick count.

## Limits

This is fatal-kernel diagnostics, not process recovery. There is no user-mode
fault isolation or page-fault demand pager yet. An exception during the 32-bit Multiboot/long-mode bootstrap before
`kernel_main` installs the IDT (for example, during the 32-bit Multiboot bootstrap) can still
reset the machine. The emergency IST1 is dedicated to double fault and IST2 is dedicated to PIT IRQ0;
NMI and machine-check recovery are not implemented. Stack traces depend on an
intact frame chain and may be incomplete after stack corruption.

## Validation

Run:

```sh
make exception-test
make test
make
```

The host test validates vector names, architectural error-code classification,
and page-fault error-bit decoding. `make` also assembles the stubs, links the
TSS/IDT path, and builds the ISO. A QEMU fault-injection boot test should then
trigger `ud2` in a disposable debug build and verify the #UD report, and trigger
a controlled unmapped access to verify CR2/#PF. Do not place those faults in
normal release startup.
