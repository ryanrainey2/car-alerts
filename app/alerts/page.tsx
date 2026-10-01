"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SavedAlert {
  id: string;
  name: string;
  search: Record<string, string | number>;
  seen_ids: string[];
  created_at: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<SavedAlert[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAlerts() {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      setAlerts(data.alerts ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this alert?")) return;

    await fetch("/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            My Alerts
          </h1>
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Back to Search
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-500 dark:text-zinc-400">
              No alerts yet. Search for cars and click &quot;Save as Alert&quot;
              to get Slack notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {alert.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {Object.entries(alert.search).map(([key, val]) => (
                      <span
                        key={key}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {key}: {val}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    {alert.seen_ids.length} listings seen &middot; Created{" "}
                    {new Date(alert.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
