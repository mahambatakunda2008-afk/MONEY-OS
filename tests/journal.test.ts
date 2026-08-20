import { describe, expect, it } from "vitest";
import { assertIdempotencyAvailable, appendJournalEvent, createJournal, replayStatus } from "../packages/execution-engine/src/journal";
import type { ExecutionRecord } from "../packages/execution-engine/src/index";

const record: ExecutionRecord = {
  id: "exec-1",
  planId: "plan-1",
  idempotencyKey: "idem-1",
  status: "AWAITING_APPROVAL",
  createdAt: "2026-08-20T10:00:00.000Z",
  updatedAt: "2026-08-20T10:00:00.000Z",
};

describe("transaction journal", () => {
  it("records and replays execution state", () => {
    const journal = createJournal(record);
    const authorized = { ...record, status: "AUTHORIZED" as const };
    const updated = appendJournalEvent(journal, authorized, "AUTHORIZED");
    expect(updated.events).toHaveLength(2);
    expect(replayStatus(updated)).toBe("AUTHORIZED");
  });

  it("is idempotent for repeated identical events", () => {
    const journal = createJournal(record);
    const updated = appendJournalEvent(journal, record, "CREATED");
    expect(updated.events).toHaveLength(1);
  });

  it("rejects reuse of a key for another execution", () => {
    const journal = createJournal(record);
    expect(() => assertIdempotencyAvailable([journal], "idem-1", "exec-2")).toThrow("already belongs");
  });
});
