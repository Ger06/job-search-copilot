const SESSION_ID_STORAGE_KEY = "job-search-copilot:session-id";

// globalThis, no window: en el browser son el mismo objeto (window ===
// globalThis), pero así los tests pueden stubear localStorage con
// vi.stubGlobal, igual que ya se hace con fetch en backend-client.test.ts,
// sin necesitar jsdom.
export function getOrCreateSessionId(): string {
  const existing = globalThis.localStorage.getItem(SESSION_ID_STORAGE_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  globalThis.localStorage.setItem(SESSION_ID_STORAGE_KEY, created);
  return created;
}

export function setSessionId(sessionId: string): void {
  globalThis.localStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId.trim());
}
