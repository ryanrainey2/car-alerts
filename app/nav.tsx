"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Nav() {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);
  const [lastCheck, setLastCheck] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/alerts");
        const data = await res.json();
        setAlertCount(data.alerts?.length ?? 0);
      } catch {
        // ignore
      }
    }
    load();
  }, [pathname]);

  useEffect(() => {
    function update() {
      const now = new Date();
      const min = now.getMinutes() % 15;
      setLastCheck(min === 0 ? "just now" : `${min} min ago`);
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
        Car Alerts
      </Link>
      <Link
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
      >
        Search
      </Link>
      <Link
        href="/alerts"
        aria-current={pathname === "/alerts" ? "page" : undefined}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
      >
        Alerts
        {alertCount > 0 && (
          <span
            className="tag tag-accent"
            style={{ padding: "1px 7px" }}
          >
            {alertCount}
          </span>
        )}
      </Link>
      <span
        className="dc-hide-sm"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
            background: "var(--color-accent)",
            display: "inline-block",
          }}
        />
        Checked {lastCheck}
      </span>
    </nav>
  );
}
