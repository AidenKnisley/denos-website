# DenOS kernel event queue

The kernel event service provides a bounded FIFO for asynchronous subsystem
notifications. Events carry a PIT tick timestamp, source ID, event type, code,
and a 64-bit value. Publishing is non-blocking; a full queue rejects the new
event and increments the drop counter rather than overwriting unread events.

The scheduler currently publishes task-started, task-stopped, and
task-restarted events. The event type registry reserves values for device,
network-link, and filesystem notifications as those subsystems gain producers.
The `events` shell command drains up to 16 queued records and reports pending
and dropped counts.

The queue is single-CPU and currently has no interrupt-safe lock. Producers
must run in normal kernel context. It is a kernel notification mechanism, not
a user-facing event API or a durable event log.
