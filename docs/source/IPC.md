# DenOS kernel message queues

DenOS includes a bounded message-passing layer intended for kernel services
and future isolated tasks. Scheduler-created services receive an IPC endpoint
with the same numeric task ID. The endpoint remains allocated while a task is
stopped so it can be restarted; the slot is reclaimed when the scheduler reuses
that task slot.

## Message format

Each message contains:

- sender task ID;
- application-defined 32-bit message type;
- one 64-bit scalar value;
- up to 32 bytes of inline payload.

Each endpoint has a fixed 16-message FIFO queue. Send and receive are
non-blocking. A full queue returns `IPC_ERROR_FULL` and increments a drop
counter; an empty queue returns `IPC_ERROR_EMPTY`. Endpoint statistics expose
pending, sent, received, and dropped counts. The shell's `ipc` command reports
these counters for registered scheduler services.

## API overview

- `ipc_endpoint_open(task_id)` creates an endpoint.
- `ipc_send(destination, sender, type, value, payload, length)` enqueues a message.
- `ipc_receive(task_id, &message)` removes the oldest message.
- `ipc_endpoint_get_stats(task_id, &stats)` reads queue accounting.
- `ipc_endpoint_close(task_id)` releases an endpoint.

The implementation is a single-CPU kernel service and is not yet protected by
interrupt-safe locks. It is not a userspace IPC ABI, does not provide shared
memory or capabilities, and must not be called concurrently from interrupt
handlers. Those requirements must be addressed before user-mode processes are
introduced.
