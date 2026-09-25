/** Óvatos JSON-olvasás közös lépése: objektum-e az érték; ha nem, `null`. */
export function asRecord(raw: unknown): Record<string, unknown> | null {
  return typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : null;
}
