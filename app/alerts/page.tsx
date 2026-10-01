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

/* ---------- corner marks helper ---------- */
function Corners() {
  return (
    <>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
    </>
  );
}

/* ---------- format filter tags from search params ---------- */
function formatTags(search: Record<string, string | number>): string[] {
  const tags: string[] = [];

  const yearMin = search.year_min;
  const yearMax = search.year_max;
  if (yearMin || yearMax) {
    tags.push(`${yearMin || "any"}\u2013${yearMax || "any"}`);
  }

  const inv = search.inventory_type;
  if (inv === "new") tags.push("New");
  else if (inv === "used") tags.push("Used");
  else if (inv === "certified") tags.push("CPO");
  else if (!inv) {
    // only add "New or used" if other filters exist
  }

  if (search.price_max) {
    tags.push(`Under $${Number(search.price_max).toLocaleString()}`);
  }
  if (search.miles_max) {
    tags.push(`Under ${Number(search.miles_max).toLocaleString()} mi`);
  }
  if (search.postal_code) {
    tags.push(`${search.radius || 50} mi of ${search.postal_code}`);
  }

  return tags;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<SavedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);

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

  async function handleRunNow(id: string) {
    setRunningId(id);
    try {
      await fetch("/api/alerts/check", {
        headers: {
          Authorization: `Bearer ${
            typeof window !== "undefined"
              ? ""
              : ""
          }`,
        },
      });
      // Reload alerts to refresh seen_ids counts
      await loadAlerts();
    } catch {
      // ignore
    } finally {
      setRunningId(null);
    }
  }

  /* --- estimate "checked X min ago" --- */
  const now = new Date();
  const minAgo = now.getMinutes() % 15;
  const nextIn = 15 - minAgo;

  return (
    <main className="page-container">
      {/* --- page header --- */}
      <header className="page-header">
        <div>
          <div className="page-kicker">
            Checker runs every 15 min &middot; next in {nextIn} min
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(30px, 5vw, 44px)",
              lineHeight: 1,
            }}
          >
            Saved alerts
          </h1>
        </div>
        <Link href="/" className="btn btn-primary blueprint">
          <Corners />
          New search
        </Link>
      </header>

      {loading ? (
        <p style={{ fontSize: "14px", color: "var(--color-neutral-600)" }}>
          Loading alerts...
        </p>
      ) : alerts.length === 0 ? (
        /* --- empty state --- */
        <div
          className="blueprint"
          style={{
            padding: "clamp(32px,7vw,72px) 24px",
            display: "grid",
            gap: "12px",
            justifyItems: "center",
            textAlign: "center",
          }}
        >
          <Corners />
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
            <path d="M3.3 17A1 1 0 0 0 4 18.7h16a1 1 0 0 0 .7-1.7 10 10 0 0 1-2.7-6.6V9a6 6 0 0 0-12 0v1.4A10 10 0 0 1 3.3 17" />
          </svg>
          <h2 style={{ margin: 0, fontSize: "28px" }}>
            Nothing being watched yet
          </h2>
          <p
            style={{
              margin: 0,
              maxWidth: "44ch",
              fontSize: "14px",
              lineHeight: 1.5,
              color:
                "color-mix(in srgb, var(--color-text) 65%, transparent)",
            }}
          >
            Run a search with your exact criteria, then press{" "}
            <strong>Save as alert</strong>. From then on the checker compares
            inventory every 15 minutes and sends you anything new.
          </p>
          <Link
            href="/"
            className="btn btn-primary blueprint"
            style={{ marginTop: "8px" }}
          >
            <Corners />
            Start a search
          </Link>
        </div>
      ) : (
        /* --- alert list --- */
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          {alerts.map((a) => (
            <article
              key={a.id}
              className="blueprint dc-alertrow"
              style={{ padding: "clamp(14px,3vw,22px)" }}
            >
              <Corners />
              <div
                style={{
                  display: "grid",
                  gap: "var(--space-3)",
                  minWidth: 0,
                }}
              >
                {/* name + status */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <h2
                    style={{ margin: 0, fontSize: "26px", lineHeight: 1 }}
                  >
                    {a.name}
                  </h2>
                  <span className="tag tag-accent">Active</span>
                </div>

                {/* filter tags */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  {formatTags(a.search).map((tag, i) => (
                    <span key={i} className="tag tag-outline">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* stats grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: "var(--space-3)",
                    borderTop: "1px solid var(--color-divider)",
                    paddingTop: "var(--space-3)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color:
                          "color-mix(in srgb, var(--color-text) 50%, transparent)",
                      }}
                    >
                      Matches seen
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 600,
                        fontSize: "26px",
                        lineHeight: 1,
                      }}
                    >
                      {a.seen_ids.length}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color:
                          "color-mix(in srgb, var(--color-text) 50%, transparent)",
                      }}
                    >
                      New this week
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 600,
                        fontSize: "26px",
                        lineHeight: 1,
                        color: "var(--color-accent-700)",
                      }}
                    >
                      0
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color:
                          "color-mix(in srgb, var(--color-text) 50%, transparent)",
                      }}
                    >
                      Last notified
                    </div>
                    <div style={{ fontSize: "14px", lineHeight: "26px" }}>
                      Not yet
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color:
                          "color-mix(in srgb, var(--color-text) 50%, transparent)",
                      }}
                    >
                      Created
                    </div>
                    <div style={{ fontSize: "14px", lineHeight: "26px" }}>
                      {new Date(a.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* actions */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "var(--space-2)",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleRunNow(a.id)}
                  disabled={runningId === a.id}
                >
                  {runningId === a.id ? "Running\u2026" : "Run now"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost dc-del"
                  onClick={() => handleDelete(a.id)}
                  style={{
                    color:
                      "color-mix(in srgb, var(--color-text) 65%, transparent)",
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
