# Aiden C 5.2.4 — language and compiler guide

Aiden C is DenOS's freestanding C-subset compiler. It translates a bounded source subset into **AEX6 bytecode**. The kernel VM interprets this image. It does not emit x86-64 machine code, ELF files, or Linux executables.

The language has been expanded substantially, but it is not a complete ISO C implementation. Its type model, built-ins, preprocessing, executable format, and runtime limits are deliberately smaller than hosted C.

## Quick example

```c
#include <stdio.h> /* accepted as a no-op; no hosted header is loaded */

#define INITIAL 4
#define MULTIPLIER 5

typedef unsigned long count_t;

enum Mode { MODE_IDLE = 0, MODE_ACTIVE = 2, MODE_DONE = 7 };

count_t total = INITIAL * MULTIPLIER;
int data[4] = { 2, 3, 5, 7 };

int sum(int *items, int length) {
    int result = 0;
    for (int i = 0; i < length; ++i) result += items[i];
    return result;
}

int main(void) {
    int *p = data;
    p++;
    switch (MODE_ACTIVE) {
        case MODE_IDLE: return 1;
        case MODE_ACTIVE: total += sum(data, 4); break;
        default: return 2;
    }
    printf("total=%d bytes=%d\n", total, sizeof(data));
    return total == 37 ? 0 : 3;
}
```

Compile inside DenOS:

```text
cc hello.c -o hello
run hello
cc --version
cinfo
```

## Supported language features

### Types and declarations

- `void` function return types and `void` parameter lists.
- Common integer spellings: `char`, `short`, `int`, `long`, `long long`, and signed/unsigned variants.
- All scalar integer declarations map to one signed 64-bit VM cell. This is not C's standard width, signedness, promotion, or overflow model.
- `enum` declarations with named integer constants and explicit/implicit values.
- File-scope scalar `typedef` aliases for supported integer/enum types.
- Local and file-scope scalar variables.
- Fixed-size, one-dimensional arrays, with brace initializers.
- Scalar pointers up to two `*` levels in declarations and parameters. Function pointers are not supported.
- Global scalar and array declarations. Uninitialized globals start at zero. Global initializers are constant expressions evaluated by the compiler.
- Local block scope and shadowing of file-scope names.

### Expressions

- Decimal, hexadecimal, octal, and binary integer constants, with `U`/`L` suffix characters accepted.
- Character and string literals with common C escapes.
- Parenthesized expressions and unary `+`, `-`, `!`, `~`, dereference `*`, and address-of `&`.
- Addition, subtraction, multiplication, division, modulo, comparisons, equality, logical operators, bitwise operations, shifts, and the conditional `?:` operator.
- Prefix/postfix `++` and `--`.
- Compound assignment: `+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `|=`, `^=`, `<<=`, and `>>=`.
- Array-to-pointer decay, pointer arithmetic measured in VM cells, pointer indexing, and pointer dereference/store.
- `sizeof(type)`, `sizeof(type[N])`, and `sizeof(object-name)`. Scalar and pointer size is 8 bytes in the Aiden VM model. `sizeof(expression)` is not implemented.
- Global initializers support integer constant expressions with parentheses, unary operators, arithmetic, comparisons, bitwise/logical operators, shifts, and `?:`.

### Statements and functions

- Compound blocks and local declarations.
- `if` / `else`, `while`, `do` / `while`, and `for`.
- `switch`, `case`, `default`, `break`, and `continue`. Case labels are integer or enum constants. Switches support up to 64 case labels.
- `return` with or without a value.
- User functions, prototypes, parameters, recursive and mutually recursive calls.
- `main` must have no parameters and must be defined.
- Up to 32 user-defined functions, 16 parameters per function, and 64 active VM call frames.

### Limited preprocessor

Supported directives:

- Object-like `#define NAME replacement` macros, recursively expanded up to 8 nested replacements.
- `#undef NAME`.
- `#if 0` and `#if 1` only.
- `#ifdef NAME`, `#ifndef NAME`, `#else`, and `#endif`.
- `#include` and `#pragma` lines are accepted but ignored. They do not load header contents or a standard library.

The preprocessor has fixed limits of 48 macros, 31 characters per macro name, and 127 replacement bytes. Recursive expansion is diagnosed. Function-like macros, `#elif`, `#error` semantics, `defined(...)`, token pasting (`##`), and stringification (`#`) are not implemented.

## Built-in functions

The VM provides a small set of console functions:

| Function | Supported behavior |
|---|---|
| `printf` | `%d`, `%i`, `%c`, `%s`, and `%%` |
| `puts` | Print one string and a newline |
| `putchar` | Print one character |
| `getchar` | Read one character |
| `scanf` | Line-based `%d`, `%i`, and `%c` conversions to scalar addresses |
| `strlen` | Length of a bounded NUL-terminated VM string |
| `strcmp`, `strncmp` | Lexical string comparison |
| `strcpy`, `strncpy`, `strcat` | Copy/concatenate into a writable character array |
| `strchr`, `strrchr`, `strstr` | Search for a character or substring; return a VM pointer handle |
| `atoi` | Parse a signed decimal integer with overflow detection |
| `abs`, `labs` | Absolute value; traps on signed minimum overflow |
| `isdigit`, `isalpha`, `isspace` | ASCII character classification |
| `toupper`, `tolower` | ASCII case conversion |

`scanf` `%i` recognizes decimal, octal, and hexadecimal integer input. `scanf` accepts addresses such as `&number`. This is not a hosted stdio implementation: there is no format width/precision support, file stream, `fopen`, `fread`, or general libc.

`#include <stdio.h>`, `<string.h>`, and `<ctype.h>` are accepted as no-ops; the built-ins are implemented directly in the VM. A header line does not load declarations or link a hosted library. Additional `printf` integer conversions include `%u`, `%x`, `%X`, `%o`, and `%p`; flags, width, precision, and length modifiers are consumed but padding/precision semantics are not implemented. `%p` prints the VM's tagged pointer value, not a host or physical address.

## VM memory and pointer model

Aiden pointers are tagged addresses into the VM's bounded cell arrays. They are not physical/virtual x86-64 pointers and cannot access arbitrary hardware or kernel addresses. Global pointers resolve into the bounded global-cell table; local pointers resolve within live VM memory. Invalid/stale addresses fault. Direct array indexing has runtime bounds checks.

Each scalar occupies one 64-bit VM cell, including `char`. Character arrays therefore use one VM cell per character rather than C's one-byte object representation. String routines operate on those cells; `strncpy` lengths are cell/character counts. `sizeof` reports the VM cell representation (8 bytes per scalar/array element), not standard C target ABI sizes. Pointer arithmetic advances in VM cells, not bytes. The language does not yet model the standard C object representation, effective type, strict aliasing, byte-addressable object layout, or C's pointer provenance rules. It is safer than unchecked host pointer dereferencing, but it is not an ISO C memory model.

## Resource limits

| Resource | Limit |
|---|---:|
| Source file | 8,192 bytes |
| Emitted instructions | 768 |
| String, integer-constant, and global-initializer data combined | 2,048 bytes |
| Identifier | 31 characters |
| Active declarations per function | 160 symbols, including visible globals |
| File-scope variable names | 64 |
| File-scope data | 256 cells |
| VM local/temporary memory | 4,096 cells per active frame |
| Nested control-flow records | 32 |
| Switch labels | 64 per switch |
| Enum constants | 128 |
| Functions | 32 |
| Parameters | 16 per function |
| VM call frames | 64 |
| Macro definitions | 48 |
| Macro replacement | 127 bytes |
| Macro expansion depth | 8 |

The VM also enforces an instruction budget, stack bounds, call-frame limits, array bounds, executable size limits, and runtime division/modulo faults.

## AEX executable compatibility

Aiden C 5.2.4 emits textual-hex `AEX6` images. The AEX6 header contains code count, combined data byte count, global-cell count, and reserved flags. Each instruction is an opcode plus a 32-bit operand. The trailing data area holds strings/constants followed by the initialized global-cell bytes.

The VM accepts older AEX1, AEX2, AEX3, AEX4, and AEX5 images. AEX6 adds global load, store, and address operations while retaining the earlier opcodes. Do not load AEX6 images into an older DenOS VM.

## Not supported yet

Aiden C still does not implement:

- `struct`, `union`, bitfields, or user-defined aggregate layout.
- Floating-point types or floating-point operations.
- Function pointers, callbacks, or pointer-to-function declarations.
- Multidimensional arrays, variable-length arrays, flexible arrays, or general array parameter declarations.
- Full C declarator grammar, pointer typedefs, array typedefs, typedef scope, `extern`/linkage, translation-unit linking, or separate object files.
- Pointer-to-array types, arbitrary pointer casting, `void *` conversion rules, pointer subtraction/comparison semantics, or the standard byte-level object model.
- Full `const` correctness, `volatile`/`restrict`, atomic types, or standard integer promotion/conversion rules.
- `switch` with ranges or nonconstant case expressions; case labels are integer/enum constants.
- Function-like macros, `#elif`, macro expansion in all preprocessing contexts, `defined(...)`, complete conditional-expression preprocessing, header-file loading, macro include guards via loaded headers, or the full standard preprocessor.
- `sizeof(expression)`, `_Alignof`, designated initializers, compound literals, variadic functions, and the comma operator.
- The C standard library, hosted file I/O, `malloc`/`free`, `errno`, locale-aware character rules, time, or process APIs. The built-ins listed above are a small VM-specific subset, not a complete libc.
- Native x86-64 code generation, object files, relocations, ELF executable emission, or user-mode execution.

The compiler should be described as an expanded C subset, not “almost fully ISO C” or “GCC-compatible.” Its fixed resource limits and single-cell type model are intentional current constraints.

## Tests

Run `make test` from the project root. The compiler/VM tests cover legacy AEX1–AEX5 images, AEX6 global scalars/arrays/pointers, local shadowing, macros, conditionals, typedefs, switch/enums, function calls and recursion, arithmetic and pointer faults, array bounds, formatted I/O, string copy/search/compare functions, ASCII character helpers, malformed images, and instruction-budget enforcement. A separate host test compiles every bundled source under `userland/apps/`.
