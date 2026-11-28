# Aiden C 5.3.0 — language and compiler guide

Aiden C is DenOS's freestanding C-subset compiler. It parses a deliberately bounded subset of C, emits textual-hex AEX6 bytecode, and executes that bytecode in the kernel's AEX virtual machine. It is substantially more capable than a toy expression evaluator, but it is not a complete ISO C compiler, does not emit native x86-64 code, and does not provide process isolation.

## Quick start

```c
#include <stdio.h>

int sum(int a, int b) {
    return a + b;
}

int main(void) {
    int values[4] = { 3, 5, 7, 11 };
    int total = 0;
    for (int i = 0; i < 4; ++i) {
        total += values[i];
    }
    printf("sum=%d total=%d\\n", sum(12, 30), total);
    return 0;
}
```

Compile and execute from the DenOS shell:

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
- All scalar integer declarations map to a signed 64-bit VM cell. This is not C's standard width, signedness, promotion, or overflow model.
- `enum` declarations with named integer constants and explicit or implicit values.
- File-scope scalar `typedef` aliases for supported integer and enum types.
- Local and file-scope scalar variables, fixed-size one-dimensional arrays, and brace initializers.
- Scalar pointers up to two `*` levels in declarations and parameters. Array decay, pointer indexing, pointer arithmetic, address-of, and checked dereference/store are implemented.
- Global scalar and array declarations. Uninitialized globals start at zero; global initializers are integer constant expressions.
- Block scope and shadowing of file-scope names.

### Expressions and statements

- Decimal, hexadecimal, octal, and binary integer constants; `U`/`L` suffix characters are accepted.
- Character and string literals with common C escapes.
- Parentheses; unary `+`, `-`, `!`, `~`, dereference `*`, and address-of `&`.
- Arithmetic, comparisons, equality, logical and bitwise operations, shifts, conditional `?:`, and prefix/postfix `++` and `--`.
- Compound assignments: `+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `|=`, `^=`, `<<=`, and `>>=`.
- `sizeof(type)`, `sizeof(type[N])`, and `sizeof(object-name)`. `sizeof(expression)` is not implemented.
- Compound blocks, local declarations, `if`/`else`, `while`, `do`/`while`, and `for`.
- `switch`, `case`, `default`, `break`, and `continue`; case labels are integer or enum constants.
- User functions, prototypes, parameters, recursion, and mutually recursive calls. `main` must be defined with no parameters.

### Limited preprocessor

Supported directives are object-like `#define`, `#undef`, `#if 0`/`#if 1`, `#ifdef`, `#ifndef`, `#else`, and `#endif`. Object-like macros are recursively expanded up to 16 nested replacements. `#include` and `#pragma` lines are accepted as no-ops: they do not load files, declarations, headers, or library code.

Function-like macros, `#elif`, `#error` semantics, `defined(...)`, token pasting (`##`), stringification (`#`), and the full C preprocessor are not implemented.

## VM built-ins

The VM implements these functions directly:

| Group | Functions | Behavior and limits |
|---|---|---|
| Console output | `printf`, `puts`, `putchar` | Integer/string/character output; `printf` supports `%d`, `%i`, `%u`, `%x`, `%X`, `%o`, `%p`, `%c`, `%s`, and `%%` |
| Console input | `scanf`, `getchar` | Line-based input; `scanf` supports `%d`, `%i`, and `%c` conversions |
| String length/compare | `strlen`, `strnlen`, `strcmp`, `strncmp` | Bounded reads over VM character arrays |
| String copy/append | `strcpy`, `strncpy`, `strcat`, `strncat` | Destination writes are checked against VM memory bounds |
| String search | `strchr`, `strrchr`, `strstr`, `strpbrk`, `strspn`, `strcspn` | Search helpers return VM pointer handles or character counts |
| Character tests | `isdigit`, `isalpha`, `isspace`, `isalnum`, `isupper`, `islower`, `isxdigit`, `iscntrl`, `isprint`, `isgraph`, `ispunct` | ASCII-only classification |
| Character conversion | `toupper`, `tolower` | ASCII-only case conversion |
| Numeric helpers | `atoi`, `abs`, `labs` | Signed decimal parsing and checked absolute value |
| Pseudo-random | `rand`, `srand` | Deterministic non-cryptographic PRNG; zero seed is replaced with a fixed nonzero state |

`scanf` `%i` recognizes decimal, octal, and hexadecimal integer input. Addresses such as `&number` are supported. This is not hosted stdio: there are no file streams, `fopen`, `fread`, general formatted file I/O, or linked standard library. `printf` width/precision and complete flag semantics are not implemented; `%p` prints a tagged VM pointer, not a host or physical address.

`#include <stdio.h>`, `<string.h>`, and `<ctype.h>` are accepted as no-ops. The VM built-ins exist without loading those headers. A header line does not provide prototypes, declarations, or a hosted library.

## VM memory and pointer model

Aiden pointers are tagged addresses into bounded VM cell arrays. They are not physical or virtual x86-64 pointers and cannot access arbitrary kernel addresses. Global pointers resolve into the bounded global-cell table; local pointers resolve within VM memory. Invalid or stale addresses fault, and array indexing is checked at runtime.

Each scalar occupies one 64-bit VM cell, including `char`. Character arrays therefore use one VM cell per character rather than C's one-byte object representation. String routines operate on those cells. `sizeof` reports the VM representation (8 bytes per scalar/array element), not standard C ABI sizes. Pointer arithmetic advances in VM cells, not bytes. The VM does not implement C's byte-addressable object layout, effective type, strict aliasing, or full pointer provenance rules.

## Resource limits in Aiden C 5.3.0

| Resource | Limit |
|---|---:|
| Source file | 32,768 bytes |
| Emitted instructions | 2,048 |
| String/constants/global initializer data | 8,192 bytes combined |
| Identifier | 63 characters |
| Compiler symbol table | 512 symbols |
| File-scope variables | 128 |
| File-scope data | 1,024 VM cells |
| VM local/temporary memory | 8,192 cells |
| Maximum length of one fixed-size array | 4,096 cells |
| VM operand stack | 4,096 cells |
| Nested control-flow records | 64 |
| Break/continue patch entries per control record | 256 |
| Switch labels | 128 per switch |
| Enum constants | 256 |
| Functions | 96 |
| Parameters per function | 32 |
| User call-frame depth | 128 |
| User call-patch entries | 512 |
| Object-like macros | 96 |
| Macro replacement text | 255 bytes |
| Macro expansion/conditional nesting | 16 levels |
| Scalar typedef names | 64 |

The VM also applies an instruction budget, stack and call-frame bounds, array bounds, executable-size checks, and runtime division/modulo and pointer faults. These fixed limits are safety/resource bounds, not a claim of full C compatibility.

## AEX executable compatibility

Aiden C 5.3.0 emits textual-hex `AEX6` images. The AEX6 header stores code count, combined data byte count, global-cell count, and reserved flags. Each instruction is an opcode plus a 32-bit operand. The trailing data area holds strings/constants followed by initialized global-cell bytes.

The VM accepts older AEX1, AEX2, AEX3, AEX4, and AEX5 images. AEX6 adds global load, store, and address operations while retaining earlier opcodes. Do not load AEX6 images into an older DenOS VM.

## Not supported yet

Aiden C does not currently implement:

- `struct`, `union`, bitfields, or user-defined aggregate layout.
- Floating-point types or floating-point operations.
- Function pointers, callbacks, or pointer-to-function declarations.
- Multidimensional arrays, variable-length arrays, flexible arrays, or general array parameter declarations.
- Full C declarator grammar, pointer/array typedefs, typedef scope, `extern`/linkage, translation-unit linking, or separate object files.
- Pointer-to-array types, arbitrary pointer casting, `void *` conversion rules, pointer subtraction/comparison semantics, or the standard byte-level object model.
- Full `const` correctness, `volatile`/`restrict`, atomic types, or standard integer promotion/conversion rules.
- `switch` ranges or nonconstant case expressions; case labels must be integer/enum constants.
- Function-like macros, `#elif`, full macro expansion contexts, `defined(...)`, complete conditional-expression preprocessing, header-file loading, or the full standard preprocessor.
- `sizeof(expression)`, `_Alignof`, designated initializers, compound literals, variadic functions, and the comma operator.
- The C standard library, hosted file I/O, `malloc`/`free`, `errno`, locale-aware character rules, time, or process APIs.
- Native x86-64 code generation, object files, relocations, ELF executable emission, or user-mode execution.

The compiler is best described as an expanded C subset, not “almost fully ISO C” or GCC-compatible. Programs execute with kernel privilege in a bounded VM and should be treated as trusted code. The native terminal apps do not run as Aiden C user processes.

## Tests

Run `make -f tests/Makefile test` from the project root. Compiler/VM tests cover legacy AEX1–AEX5 compatibility, AEX6 global scalars/arrays/pointers, larger source/instruction limits, macros and conditionals, typedefs, switch/enums, functions/recursion, arithmetic and pointer faults, array bounds, formatted I/O, string copy/compare/search/span functions, ASCII character helpers, seeded pseudo-random output, malformed images, and instruction-budget enforcement. A separate host test compiles every bundled source under `userland/apps/`.
