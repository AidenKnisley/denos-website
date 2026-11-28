# DenOS 0.5.7 memory management

DenOS currently has two allocators with different jobs. The current system is still one kernel-owned execution context; these allocators do not yet provide isolated process address spaces. Do not confuse a physical page address with a kernel heap pointer.

## Physical page manager

`kernel/mm/pmm.c` parses the Multiboot2 information block passed by GRUB. It accepts the Multiboot2 boot magic (`PMM_BOOT_MAGIC`) and the memory-map tag (tag type 6, version 0). Each memory map entry must be at least 24 bytes. Only type-1 usable ranges become allocatable. All non-usable entries are treated as reserved.

The allocator follows the [GNU GRUB Multiboot2 specification](https://www.gnu.org/software/grub/manual/multiboot2/multiboot.html) for the boot information and memory-map tag. Memory-map entries must use version 0, be at least 24 bytes, and have an eight-byte-aligned entry size. The allocator manages 4 KiB frames below `PMM_ADDRESS_LIMIT` (1 GiB). The PMM limit is 1 GiB. The bootstrap page tables identity-map the first 4 GiB using 2 MiB pages; the PMM deliberately manages a smaller range than the bootstrap translation window. On initialization it also reserves:

- The first 1 MiB of physical memory.
- The complete linked kernel image, from `_kernel_start` through `_kernel_end`.
- The Multiboot2 information block itself, when it is inside the mapped window.

Public API (`kernel/include/pmm.h`):

```c
int pmm_init(u32 boot_magic, const void *multiboot_info,
             u64 kernel_start, u64 kernel_end);
void *pmm_alloc_page(void);
int pmm_free_page(void *page);
int pmm_page_is_allocated(const void *page);
int pmm_get_stats(pmm_stats_t *stats);
int pmm_is_initialized(void);
u64 pmm_address_limit(void);
```

`pmm_alloc_page()` returns a 4096-byte-aligned identity-mapped address and clears the complete page before returning it. It returns `NULL` when the manager is not initialized or no free page remains. `pmm_free_page()` returns zero only for an allocated, managed, non-reserved, page-aligned address; it rejects null, unaligned, out-of-range, reserved, unmanaged, and already-free addresses. `pmm_page_is_allocated()` provides a non-mutating ownership check for a frame previously returned by PMM.

`pmm_stats_t` reports managed, free, currently allocated, and reserved page counts, plus memory-map entry diagnostics. Reserved pages are tracked independently from allocated pages. An allocated page is one obtained by `pmm_alloc_page()` and not yet returned by `pmm_free_page()`.

The PMM uses static bitmaps in the kernel image, so its bookkeeping does not depend on heap allocation. It has an allocation hint to avoid rescanning from physical address zero for every request. There is no SMP locking yet; the kernel is currently a single-CPU experiment without preemptive multitasking.

## Four-level virtual-memory manager

`kernel/mm/paging.c` attaches to the existing CR3 after PMM and heap initialization. It does not discard the bootstrap identity map. It supports checked 4 KiB map/remap/query/protect/unmap operations, effective permission reporting, and recognition/splitting of existing 2 MiB and 1 GiB leaves. New intermediate table pages are allocated through PMM; empty dynamic page-table levels are reclaimed after unmap. The mapped data frame remains owned by the caller.

The manager enables NXE when supported, enables supervisor write-protect (CR0.WP), and enables global pages (CR4.PGE) when supported. New writable leaf pages must be NX on NX-capable CPUs. Mapping mutations invalidate the target virtual address with `invlpg`. Local interrupts are disabled during table mutation. This assumes the current single-CPU kernel and is not SMP-safe.

Use `paging` or `vmstat` for live statistics. See [`VIRTUAL-MEMORY.md`](VIRTUAL-MEMORY.md) for API contracts and explicit limitations.

## PMM-backed kernel virtual allocation

`kernel/mm/vmalloc.c` manages a dedicated 64 MiB canonical high-half window beginning at `VMALLOC_BASE`. `kvalloc(size, flags)` reserves a contiguous virtual run, allocates individual zero-filled PMM frames, maps them through the page-table manager, and returns a contiguous virtual pointer. The physical frames need not be contiguous. `kvfree(pointer)` accepts only the exact allocation base, preflights every mapping and PMM ownership record, removes the mappings, and returns the frames to PMM.

Allocation failure rolls back already-installed mappings and allocated frames. If rollback itself fails, the affected virtual range is quarantined and reported rather than reused while a page table may still reference an uncertain frame. A partial unmap failure during `kvfree` attempts to restore the original mappings; if restoration is incomplete, the allocation is quarantined. The virtual allocator is single-CPU/interrupt-serialized and is not an SMP allocator. It rejects user mappings.

This virtual allocator is deliberately separate from the current fixed 1 MiB `kmalloc` arena. It provides a safe API for explicitly sized virtual allocations, but does not yet make `kmalloc` dynamically grow. The static heap's existing semantics remain unchanged.

## Kernel heap

`kernel/mm/heap.c` provides a separate fixed 1 MiB arena. This heap is not automatically backed by PMM pages. It uses 16-byte-aligned payloads and in-arena block headers.

```c
void memory_init(void);
void *kmalloc(usize size);
void *kcalloc(usize count, usize size);
void *krealloc(void *pointer, usize size);
void kfree(void *pointer);
```

- `kmalloc(0)` returns `NULL`. Other requests are rounded up to 16 bytes.
- `kcalloc` checks `count * size` for overflow, allocates, then zeroes the requested byte count.
- `kfree(NULL)` is a no-op. Invalid and duplicate frees are rejected and counted without modifying the block chain.
- `krealloc(NULL, size)` behaves like `kmalloc(size)`. `krealloc(pointer, 0)` frees the object and returns `NULL`. A failed growth leaves the original object intact.
- Large enough remainders are split into a new free block. Adjacent free blocks are coalesced to reduce fragmentation.

Heap diagnostics distinguish allocated payload bytes, reusable free payload bytes, metadata/padding, largest available free block, block count, live allocations, cumulative allocations, failed allocations, and invalid frees. `memory_validate()` walks the full block chain and verifies boundaries, alignment, backlinks, and accounting.

## Shell diagnostics

`meminfo` prints heap and PMM information together. `pmm` prints the physical page-manager counters on their own. The output is a snapshot; page counts are not a memory map viewer and do not show each physical region individually.

## Current limitations

The PMM still manages only the first 1 GiB and page-table pages are accessed through the bootstrap identity map. The kernel heap remains a fixed 1 MiB arena and is not PMM-backed; the separate 64 MiB `kvalloc` window is available for explicitly managed kernel mappings but is not wired into `kmalloc`. The VMM edits the single active CR3 only; it does not provide separate task address spaces, demand paging, copy-on-write, swap, page ownership/refcounts, page-fault recovery, SMP locks, or TLB shootdowns. `VMM_USER` is a page-table bit, not a security boundary until a protected ring-3 process model exists. A future address-space subsystem must define shared kernel mappings and per-task ownership before switching CR3.
