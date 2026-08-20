import type { ExecutionStatus, ExecutionRecord } from "./index";

export type JournalEventType = "CREATED" | "AUTHORIZED" | "EXECUTING" | "SETTLED" | "FAILED" | "CANCELLED";

export interface JournalEvent {
  id: string;
  executionId: string;
  type: JournalEventType;
  status: ExecutionStatus;
  occurredAt: string;
  idempotencyKey: string;
  providerReference?: string;
}

export interface TransactionJournal {
  executionId: string;
  events: readonly JournalEvent[];
}

export function createJournal(record: ExecutionRecord): TransactionJournal {
  return { executionId: record.id, events: [eventFor(record, "CREATED", 0)] };
}

export function appendJournalEvent(journal: TransactionJournal, record: ExecutionRecord, type: JournalEventType, now = new Date(), providerReference?: string): TransactionJournal {
  if (journal.executionId !== record.id) throw new Error("Journal execution ID mismatch");
  const last = journal.events[journal.events.length - 1];
  if (last && last.status === record.status && last.type === type) return journal;
  return { ...journal, events: [...journal.events, eventFor(record, type, journal.events.length, now, providerReference)] };
}

export function findByIdempotencyKey(journals: readonly TransactionJournal[], idempotencyKey: string): TransactionJournal | undefined {
  return journals.find((journal) => journal.events[0]?.idempotencyKey === idempotencyKey);
}

export function assertIdempotencyAvailable(journals: readonly TransactionJournal[], idempotencyKey: string, executionId: string): void {
  const existing = findByIdempotencyKey(journals, idempotencyKey);
  if (existing && existing.executionId !== executionId) throw new Error(`Idempotency key already belongs to execution ${existing.executionId}`);
}

export function replayStatus(journal: TransactionJournal): ExecutionStatus {
  const last = journal.events[journal.events.length - 1];
  if (!last) throw new Error("Cannot replay an empty transaction journal");
  return last.status;
}

function eventFor(record: ExecutionRecord, type: JournalEventType, index: number, now = new Date(), providerReference?: string): JournalEvent {
  return {
    id: `${record.id}:event:${index + 1}`,
    executionId: record.id,
    type,
    status: record.status,
    occurredAt: now.toISOString(),
    idempotencyKey: record.idempotencyKey,
    ...(providerReference ? { providerReference } : {}),
  };
}
