# DenOS cooperative kernel scheduler

DenOS now has a fixed-capacity cooperative scheduler for kernel services. It
is an intentional stepping stone toward a process scheduler, not a claim that
DenOS already supports isolated or preemptively scheduled user processes.

## Current contract

- Up to 24 registered service tasks.
- Stable numeric task IDs, names, priority (0–7), run counters, and deadlines.
- Periodic tasks use PIT ticks for their next eligible run.
- One-shot tasks return `SCHEDULER_TASK_DONE`; periodic services return
  `SCHEDULER_TASK_REPEAT`.
- Each call to `scheduler_run()` executes at most eight callbacks.
- Callbacks run in normal kernel context. The timer interrupt only updates
  the system tick counter; it never invokes a task callback.
- A recursion guard detects accidental nested scheduler entry.
- Stopped slots can be reused; a stopped task can be restarted by ID.

The scheduler is cooperative. A callback must return promptly and must not
wait for device input, perform long disk operations, or spin on a timer. It
has no per-task stack, saved CPU context, address space, or privilege boundary.
It must not be described as preemptive multitasking.

## Built-in services

`network-poll` services the E1000 receive ring from normal kernel context.
`heap-watch` checks heap metadata periodically and records a kernel error if
an integrity check fails. The shell wait loop and bounded network wait paths call the scheduler, so
background kernel services continue to run while the console is idle or waiting for replies.

## Inspecting tasks

Use `tasks` or `ps` in the shell. The command reports task ID, state, priority,
callback count, and name. The shell reads the same kernel scheduler registry and can inspect every registered task.

## Next steps before user processes

1. Add interrupt-safe locking and per-CPU scheduler state.
2. Implement page-table management and isolated address spaces.
3. Add kernel stacks and a tested context-switch assembly routine.
4. Add process wait/exit/reap semantics and scheduler preemption.
5. Define a syscall ABI and transition to ring 3.
6. Only then consider running user applications outside the kernel.

Until those milestones are implemented and tested, all DenOS commands and
services share one kernel address space.
