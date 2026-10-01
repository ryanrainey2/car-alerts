import type { SearchParams } from "./visor";

export interface SavedAlert {
  id: string;
  name: string;
  search: SearchParams;
  seen_ids: string[];
  created_at: string;
}

// In-memory store — replace with a database (e.g. Vercel KV, Supabase) for production
const alerts: Map<string, SavedAlert> = new Map();

export function getAllAlerts(): SavedAlert[] {
  return Array.from(alerts.values());
}

export function getAlert(id: string): SavedAlert | undefined {
  return alerts.get(id);
}

export function createAlert(
  name: string,
  search: SearchParams
): SavedAlert {
  const id = crypto.randomUUID();
  const alert: SavedAlert = {
    id,
    name,
    search,
    seen_ids: [],
    created_at: new Date().toISOString(),
  };
  alerts.set(id, alert);
  return alert;
}

export function deleteAlert(id: string): boolean {
  return alerts.delete(id);
}

export function markSeen(id: string, listingIds: string[]): void {
  const alert = alerts.get(id);
  if (alert) {
    const seenSet = new Set(alert.seen_ids);
    for (const lid of listingIds) {
      seenSet.add(lid);
    }
    alert.seen_ids = Array.from(seenSet);
  }
}
