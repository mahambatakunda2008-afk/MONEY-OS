import { describe, expect, it } from "vitest";

type Status = "RECEIVED" | "PROCESSING" | "PROCESSED" | "FAILED";

class RetryableInbox {
  private status: Status = "RECEIVED";
  private applied = 0;

  process(shouldFail: boolean) {
    if (this.status === "PROCESSED") return { applied: false, retryable: false };
    this.status = "PROCESSING";
    if (shouldFail) {
      this.status = "FAILED";
      return { applied: false, retryable: true };
    }
    this.applied += 1;
    this.status = "PROCESSED";
    return { applied: true, retryable: false };
  }

  getState() { return this.status; }
  getAppliedCount() { return this.applied; }
}

describe("provider failure and retry semantics", () => {
  it("allows a failed event to retry but applies the settlement exactly once", () => {
    const inbox = new RetryableInbox();

    expect(inbox.process(true)).toEqual({ applied: false, retryable: true });
    expect(inbox.getState()).toBe("FAILED");
    expect(inbox.getAppliedCount()).toBe(0);

    expect(inbox.process(false)).toEqual({ applied: true, retryable: false });
    expect(inbox.getState()).toBe("PROCESSED");
    expect(inbox.getAppliedCount()).toBe(1);

    expect(inbox.process(false)).toEqual({ applied: false, retryable: false });
    expect(inbox.getAppliedCount()).toBe(1);
  });
});
