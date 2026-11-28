# DenOS virtual-memory manager (0.5.0)

`kernel/mm/paging.c` is the first general x86-64 page-table manager in DenOS. It operates on the active four-level page-table root; it does not yet create isolated process address spaces. The bootstrap identity map is retained.

## Current bootstrap contract

`kernel/arch/x86_64/boot.asm` builds PML4/PDPT/page-directory structures and identity maps the first 4 GiB using 2 MiB leaves. The PMM manages page frames below 1 GiB and reserves the linked kernel image, boot structures, and Multiboot information. The mapper currently allocates page-table pages through that PMM and dereferences them through the bootstrap identity map. Do not assume physical frames above the identity-mapped window can be directly accessed.

## API

Declared in `kernel/include/paging.h`:

```c
int paging_init(void);
int paging_is_initialized(void);
int paging_nx_enabled(void);
int vmm_map_page(u64 virtual_address, u64 physical_address, u64 flags);
int vmm_remap_page(u64 virtual_address, u64 physical_address, u64 flags);
int vmm_unmap_page(u64 virtual_address, vmm_mapping_t *old_mapping);
int vmm_protect_page(u64 virtual_address, u64 flags);
int vmm_query(u64 virtual_address, vmm_mapping_t *mapping);
int vmm_get_stats(vmm_stats_t *stats);
```

- All mapping and protection operations use 4 KiB virtual/physical alignment. Virtual addresses must be canonical under four-level paging. Physical frame addresses must fit the CPU-reported physical-address width.
- `vmm_map_page` refuses to overwrite any existing mapping.
- `vmm_remap_page` explicitly replaces an existing leaf mapping; if the VA is absent it creates the mapping. The old physical frame remains caller-owned.
- `vmm_query` reports the effective translation, effective permissions after parent-level restrictions, and the original leaf page size (4 KiB, 2 MiB, or 1 GiB).
- A 4 KiB operation inside an existing 2 MiB/1 GiB mapping splits the huge mapping while preserving neighboring physical translations and leaf permissions.
- `vmm_unmap_page` removes one 4 KiB translation. It returns the old physical address if requested and never frees the data frame. Empty intermediate page-table pages allocated through PMM are reclaimed. Static bootstrap page-table pages are reserved and remain in place.
- `vmm_protect_page` changes leaf permissions. Existing parent-level restrictions still apply; it does not silently make a restrictive ancestor writable.
- `VMM_WRITE`, `VMM_USER`, `VMM_WRITE_THROUGH`, `VMM_CACHE_DISABLE`, `VMM_GLOBAL`, and `VMM_NO_EXECUTE` are the supported request flags. `VMM_USER` is only a page-table permission bit: there is no ring-3 ABI or isolated user address space yet, so it is **not** a security boundary. Do not rely on it to protect programs.

## Hardware behavior

At initialization, the manager attaches to CR3, detects the physical-address width, enables EFER.NXE if supported, sets CR0.WP, and enables CR4.PGE if supported. Writable new leaf mappings must also request `VMM_NO_EXECUTE` when NX is available (W^X). Global mappings are rejected if PGE is unavailable. Mapping changes invalidate the edited virtual address with `invlpg`.

Page-table modifications disable local maskable interrupts around the mutation. This is only suitable for the current single-CPU, non-preemptive execution model. There is no SMP lock, cross-CPU TLB shootdown, PCID management, recursive map, or concurrent address-space switching.


## PMM-backed virtual allocations

`kernel/mm/vmalloc.c` owns a dedicated 64 MiB window at `VMALLOC_BASE` (`0xFFFF900000000000`) with 16,384 page slots. It is initialized after PMM and the page-table manager. `kvalloc(size, flags)` reserves a contiguous VA range and maps individually allocated PMM frames into it; the returned pointer is virtually contiguous but the physical frames are not guaranteed contiguous. `kvfree(pointer)` requires the exact pointer returned by `kvalloc`. The allocator does not accept `VMM_USER`.

The allocator preflights all mappings and PMM ownership before free. On partial unmap failure it attempts to restore already removed mappings. If mapping rollback or restoration fails, it marks the entire virtual range quarantined and never reuses it; `paging`/`vmstat` reports the quarantine count and bytes. This favors a bounded leak over freeing a frame that may still be referenced by a PTE. The API is serialized only by local interrupt masking and is not SMP-safe.

`kvalloc` is separate from `kmalloc`: the existing 1 MiB heap remains unchanged and does not automatically expand into this virtual window. DMA users must not assume the frames are physically contiguous.

## Shell inspection

Use `paging` or `vmstat` to inspect initialization, NX, supervisor write protection, global-page support, dynamic page-table page count, map/unmap counters, and failed operations.

## Not implemented

This manager is not a process-memory subsystem. It does not yet provide: per-process CR3 roots, kernel/user split enforcement, page ownership/refcounts, demand paging, copy-on-write, swap, shared-memory mappings, guard-page policy, automatic stack/heap growth, ASLR, page-fault recovery, or dynamic heap growth. The PMM still manages only the first GiB. A future address-space layer must define ownership and shared-kernel mappings before it can safely switch CR3.

## Tests

`make -f tests/Makefile paging-test` runs the page-table manager tests; `make -f tests/Makefile vmalloc-test` exercises virtual allocations, ownership validation, exhaustion, rollback, quarantine and reuse. `make -f tests/Makefile check-kernel-c` checks all freestanding kernel C translation units. `make -f tests/Makefile test` includes the paging test; `make -f tests/Makefile check` runs both test and C-check targets. The host tests use synthetic page tables and allocator stubs, so they do not validate privileged CR3/CR0/CR4/MSR instructions or real TLB behavior. A QEMU boot and fault/mapping smoke test is still required.
