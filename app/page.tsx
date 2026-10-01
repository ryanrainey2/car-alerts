"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Listing {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  miles: number;
  dealer_name: string;
  vdp_url: string;
  photo_urls: string[];
  days_on_market: number;
  inventory_type: string;
  exterior_color?: string;
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

/* ---------- year options (descending) ---------- */
const YEAR_OPTIONS: string[] = [];
for (let y = new Date().getFullYear() + 1; y >= 2000; y--) {
  YEAR_OPTIONS.push(String(y));
}

export default function Home() {
  /* --- filter state --- */
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [milesMax, setMilesMax] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [radius, setRadius] = useState("50");
  const [inventoryType, setInventoryType] = useState("");
  const [sort, setSort] = useState("newest");

  /* --- facets state --- */
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);

  /* --- results state --- */
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  /* --- fetch facets --- */
  const fetchFacets = useCallback(
    async (params: Record<string, string>) => {
      try {
        const sp = new URLSearchParams(params);
        const res = await fetch(`/api/facets?${sp}`);
        return await res.json();
      } catch {
        return {};
      }
    },
    []
  );

  // Load makes on mount
  useEffect(() => {
    fetchFacets({ facets: "make" }).then((d) => {
      if (d.make) setMakes(d.make);
    });
  }, [fetchFacets]);

  // Load models when make changes
  useEffect(() => {
    if (!make) {
      setModels([]);
      return;
    }
    fetchFacets({ make, facets: "model" }).then((d) => {
      if (d.model) setModels(d.model);
    });
  }, [make, fetchFacets]);

  // Load trims when model or years change
  useEffect(() => {
    if (!model) {
      setTrims([]);
      return;
    }
    const params: Record<string, string> = { make, model, facets: "trim" };
    if (yearMin) params.year_min = yearMin;
    if (yearMax) params.year_max = yearMax;
    fetchFacets(params).then((d) => {
      if (d.trim) {
        setTrims(d.trim);
        // clear trim if no longer available
        if (trim && !d.trim.includes(trim)) setTrim("");
      }
    });
  }, [make, model, yearMin, yearMax, fetchFacets, trim]);

  /* --- cascade handlers --- */
  function handleMakeChange(val: string) {
    setMake(val);
    setModel("");
    setTrim("");
    setSavedToast(false);
  }

  function handleModelChange(val: string) {
    setModel(val);
    setTrim("");
    setSavedToast(false);
  }

  function handleYearMinChange(val: string) {
    setYearMin(val);
    if (val && yearMax && Number(val) > Number(yearMax)) setYearMax(val);
    setSavedToast(false);
  }

  function handleYearMaxChange(val: string) {
    setYearMax(val);
    if (val && yearMin && Number(val) < Number(yearMin)) setYearMin(val);
    setSavedToast(false);
  }

  /* --- search --- */
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);

    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (trim) params.set("trim", trim);
    if (yearMin) params.set("year_min", yearMin);
    if (yearMax) params.set("year_max", yearMax);
    if (priceMax) params.set("price_max", priceMax);
    if (milesMax) params.set("miles_max", milesMax);
    if (postalCode) params.set("postal_code", postalCode);
    if (radius) params.set("radius", radius);
    if (inventoryType) params.set("inventory_type", inventoryType);
    if (sort === "price") params.set("sort", "price");
    else if (sort === "miles") params.set("sort", "miles");
    else params.set("sort", "listed_at");
    params.set("limit", "24");

    try {
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setListings([]);
      } else {
        setListings(data.listings ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      setError("Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* --- save alert --- */
  async function handleSaveAlert() {
    const search: Record<string, string | number> = {};
    if (make) search.make = make;
    if (model) search.model = model;
    if (trim) search.trim = trim;
    if (yearMin) search.year_min = Number(yearMin);
    if (yearMax) search.year_max = Number(yearMax);
    if (priceMax) search.price_max = Number(priceMax);
    if (milesMax) search.miles_max = Number(milesMax);
    if (postalCode) search.postal_code = postalCode;
    if (radius) search.radius = Number(radius);
    if (inventoryType) search.inventory_type = inventoryType;

    const alertName =
      [make, model, trim].filter(Boolean).join(" ") || "Any vehicle";

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: alertName, search }),
      });
      if (res.ok) {
        setSavedToast(true);
      }
    } catch {
      // ignore
    }
  }

  /* --- clear --- */
  function handleClear() {
    setMake("");
    setModel("");
    setTrim("");
    setYearMin("");
    setYearMax("");
    setPriceMax("");
    setMilesMax("");
    setPostalCode("");
    setRadius("50");
    setInventoryType("");
    setSavedToast(false);
  }

  /* --- summary --- */
  function buildSummary(): string {
    const parts: string[] = [];
    if (yearMin || yearMax)
      parts.push(`${yearMin || "any"}\u2013${yearMax || "any"}`);
    const vehicle = [make, model, trim].filter(Boolean).join(" ");
    parts.push(vehicle || "Any vehicle");
    if (priceMax)
      parts.push("under $" + Number(priceMax).toLocaleString());
    if (milesMax)
      parts.push("under " + Number(milesMax).toLocaleString() + " mi");
    if (postalCode) parts.push(`${radius} mi of ${postalCode}`);
    return parts.join(" \u00b7 ");
  }

  /* --- sort listings client-side --- */
  const sorted = [...listings].sort((a, b) => {
    if (sort === "price") return (a.price ?? 0) - (b.price ?? 0);
    if (sort === "miles") return (a.miles ?? 0) - (b.miles ?? 0);
    return (a.days_on_market ?? 999) - (b.days_on_market ?? 999);
  });

  const invLabel: Record<string, string> = {
    new: "New",
    used: "Used",
    certified: "CPO",
  };

  return (
    <main className="page-container">
      {/* --- page header --- */}
      <header className="page-header">
        <div>
          <div className="page-kicker">Live inventory &middot; visor.vin</div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(30px, 5vw, 44px)",
              lineHeight: 1,
              letterSpacing: "0.01em",
            }}
          >
            Find the exact car.
          </h1>
        </div>
        <p
          style={{
            margin: 0,
            maxWidth: "38ch",
            fontSize: "14px",
            lineHeight: 1.45,
            color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
          }}
        >
          Set your criteria once. Save it as an alert and the checker runs every
          15 minutes, notifying you the moment a new match is listed.
        </p>
      </header>

      {/* --- filter form --- */}
      <form
        className="blueprint"
        onSubmit={handleSearch}
        style={{
          padding: "clamp(14px, 3vw, 24px)",
          display: "grid",
          gap: "var(--space-6)",
          marginBottom: "var(--space-8)",
        }}
      >
        <Corners />

        {/* 01 VEHICLE */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "110px minmax(0,1fr)",
            gap: "var(--space-4)",
            alignItems: "start",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: "15px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              paddingTop: "22px",
            }}
          >
            01 Vehicle
          </div>
          <div className="dc-fgrid">
            <div className="field">
              <label>Make</label>
              <select
                className="input"
                value={make}
                onChange={(e) => handleMakeChange(e.target.value)}
              >
                <option value="">Any make</option>
                {makes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Model</label>
              <select
                className="input"
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={!make}
              >
                <option value="">
                  {make ? "Any model" : "Choose a make first"}
                </option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Year from</label>
              <select
                className="input"
                value={yearMin}
                onChange={(e) => handleYearMinChange(e.target.value)}
              >
                <option value="">Any</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Year to</label>
              <select
                className="input"
                value={yearMax}
                onChange={(e) => handleYearMaxChange(e.target.value)}
              >
                <option value="">Any</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>
                Trim{" "}
                {trims.length > 0 && (
                  <span style={{ fontWeight: 400, opacity: 0.7 }}>
                    &middot; {trims.length} available
                  </span>
                )}
              </label>
              <select
                className="input"
                value={trim}
                onChange={(e) => {
                  setTrim(e.target.value);
                  setSavedToast(false);
                }}
                disabled={!model}
              >
                <option value="">
                  {model ? "Any trim" : "Choose a model first"}
                </option>
                {trims.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 02 LIMITS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "110px minmax(0,1fr)",
            gap: "var(--space-4)",
            alignItems: "start",
            borderTop: "1px solid var(--color-divider)",
            paddingTop: "var(--space-6)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: "15px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              paddingTop: "22px",
            }}
          >
            02 Limits
          </div>
          <div className="dc-fgrid">
            <div className="field">
              <label>Max price</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "14px",
                    color:
                      "color-mix(in srgb, var(--color-text) 50%, transparent)",
                  }}
                >
                  $
                </span>
                <input
                  className="input"
                  type="number"
                  placeholder="45,000"
                  value={priceMax}
                  onChange={(e) => {
                    setPriceMax(e.target.value);
                    setSavedToast(false);
                  }}
                  style={{ paddingLeft: "22px" }}
                />
              </div>
            </div>
            <div className="field">
              <label>Max mileage</label>
              <input
                className="input"
                type="number"
                placeholder="40,000"
                value={milesMax}
                onChange={(e) => {
                  setMilesMax(e.target.value);
                  setSavedToast(false);
                }}
              />
            </div>
            <div className="field">
              <label>Inventory</label>
              <div
                className="seg"
                role="radiogroup"
                style={{ display: "flex", width: "100%" }}
              >
                {[
                  { label: "All", value: "" },
                  { label: "New", value: "new" },
                  { label: "Used", value: "used" },
                  { label: "CPO", value: "certified" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="seg-opt"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <input
                      type="radio"
                      name="inv"
                      value={opt.value}
                      checked={inventoryType === opt.value}
                      onChange={() => {
                        setInventoryType(opt.value);
                        setSavedToast(false);
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 03 LOCATION */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "110px minmax(0,1fr)",
            gap: "var(--space-4)",
            alignItems: "start",
            borderTop: "1px solid var(--color-divider)",
            paddingTop: "var(--space-6)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: "15px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              paddingTop: "22px",
            }}
          >
            03 Location
          </div>
          <div className="dc-fgrid">
            <div className="field">
              <label>ZIP code</label>
              <input
                className="input"
                inputMode="numeric"
                placeholder="37201"
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value);
                  setSavedToast(false);
                }}
              />
            </div>
            <div className="field">
              <label>Radius &middot; {radius} mi</label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={radius}
                onChange={(e) => {
                  setRadius(e.target.value);
                  setSavedToast(false);
                }}
                style={{
                  width: "100%",
                  height: "36px",
                  accentColor: "var(--color-accent)",
                  margin: 0,
                }}
              />
            </div>
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid var(--color-divider)",
            paddingTop: "var(--space-4)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color:
                "color-mix(in srgb, var(--color-text) 60%, transparent)",
            }}
          >
            {buildSummary()}
          </div>
          <div
            style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSaveAlert}
              style={{ gap: "8px" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
                <path d="M3.3 17A1 1 0 0 0 4 18.7h16a1 1 0 0 0 .7-1.7 10 10 0 0 1-2.7-6.6V9a6 6 0 0 0-12 0v1.4A10 10 0 0 1 3.3 17" />
              </svg>
              Save as alert
            </button>
            <button
              type="submit"
              className="btn btn-primary blueprint"
              style={{ paddingInline: "22px" }}
              disabled={loading}
            >
              <Corners />
              {loading ? "Searching\u2026" : "Search inventory"}
            </button>
          </div>
        </div>
      </form>

      {/* --- saved toast --- */}
      {savedToast && (
        <div
          className="blueprint"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            marginBottom: "var(--space-6)",
            fontSize: "14px",
            background: "var(--color-accent-100)",
            borderColor: "var(--color-accent)",
          }}
        >
          <Corners />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent-800)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span style={{ color: "var(--color-accent-900)" }}>
            Alert saved. You&apos;ll be notified when a new match appears.
          </span>
          <Link
            href="/alerts"
            style={{ marginLeft: "auto", fontSize: "13px" }}
          >
            View alerts
          </Link>
        </div>
      )}

      {/* --- error --- */}
      {error && (
        <div
          style={{
            marginBottom: "var(--space-6)",
            padding: "var(--space-3)",
            fontSize: "14px",
            color: "#b91c1c",
            border: "1px solid #fca5a5",
            background: "#fef2f2",
          }}
        >
          {error}
        </div>
      )}

      {/* --- results header --- */}
      {searched && !loading && !error && listings.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "var(--space-2)",
              marginBottom: "var(--space-4)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "22px", lineHeight: 1 }}>
              {total} matches
              {postalCode && (
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 400,
                    fontSize: "13px",
                    color:
                      "color-mix(in srgb, var(--color-text) 55%, transparent)",
                    marginLeft: "8px",
                  }}
                >
                  within {radius} mi of {postalCode}
                </span>
              )}
            </h2>
            <div className="seg" role="radiogroup" aria-label="Sort">
              {[
                { label: "Newest", value: "newest" },
                { label: "Price", value: "price" },
                { label: "Mileage", value: "miles" },
              ].map((opt) => (
                <label key={opt.value} className="seg-opt">
                  <input
                    type="radio"
                    name="sort"
                    value={opt.value}
                    checked={sort === opt.value}
                    onChange={() => setSort(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* --- listing cards --- */}
          <div className="dc-grid">
            {sorted.map((l) => (
              <a
                key={l.id}
                className="dc-lcard blueprint"
                href={l.vdp_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textDecoration: "none",
                  color: "inherit",
                  padding: "var(--space-3)",
                  gap: "var(--space-3)",
                }}
              >
                <Corners />
                {/* photo */}
                <figure
                  className="duotone"
                  style={{
                    margin: 0,
                    aspectRatio: "16/10",
                    border: "1px solid var(--color-divider)",
                    position: "relative",
                    display: "grid",
                    placeItems: "center",
                    background: l.photo_urls?.[0]
                      ? undefined
                      : "repeating-linear-gradient(135deg, var(--color-neutral-200) 0 1px, transparent 1px 9px), var(--color-neutral-100)",
                  }}
                >
                  {l.photo_urls?.[0] ? (
                    <img
                      src={l.photo_urls[0]}
                      alt={`${l.year} ${l.make} ${l.model}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "11px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color:
                          "color-mix(in srgb, var(--color-text) 50%, transparent)",
                        background: "var(--color-bg)",
                        padding: "3px 8px",
                      }}
                    >
                      Listing photo
                    </span>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      fontSize: "11px",
                      background: "var(--color-bg)",
                      padding: "2px 7px",
                      color:
                        "color-mix(in srgb, var(--color-text) 70%, transparent)",
                    }}
                  >
                    {l.days_on_market}d listed
                  </span>
                </figure>

                {/* text */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-accent-700)",
                    }}
                  >
                    {l.year} &middot;{" "}
                    {invLabel[l.inventory_type] || l.inventory_type}
                  </div>
                  <div
                    className="dc-ltitle"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 600,
                      fontSize: "20px",
                      lineHeight: 1.1,
                    }}
                  >
                    {l.make} {l.model}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color:
                        "color-mix(in srgb, var(--color-text) 70%, transparent)",
                    }}
                  >
                    {l.trim}
                  </div>
                </div>

                {/* stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderTop: "1px solid var(--color-divider)",
                    paddingTop: "var(--space-3)",
                    marginTop: "auto",
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
                      Price
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 600,
                        fontSize: "24px",
                        lineHeight: 1,
                      }}
                    >
                      ${l.price?.toLocaleString()}
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
                      Mileage
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 600,
                        fontSize: "24px",
                        lineHeight: 1,
                      }}
                    >
                      {l.miles?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* meta */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    fontSize: "12px",
                    color:
                      "color-mix(in srgb, var(--color-text) 60%, transparent)",
                  }}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l.dealer_name}
                  </span>
                  <span style={{ flex: "none" }}>{l.exterior_color}</span>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* --- loading skeletons --- */}
      {loading && (
        <div className="dc-grid skeleton-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="blueprint"
              style={{
                padding: "var(--space-3)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <Corners />
              <div
                style={{
                  aspectRatio: "16/10",
                  background:
                    "repeating-linear-gradient(135deg, var(--color-neutral-200) 0 1px, transparent 1px 9px), var(--color-neutral-100)",
                  border: "1px solid var(--color-divider)",
                }}
              />
              <div
                style={{
                  height: "14px",
                  width: "40%",
                  background: "var(--color-neutral-200)",
                }}
              />
              <div
                style={{
                  height: "20px",
                  width: "70%",
                  background: "var(--color-neutral-200)",
                }}
              />
              <div
                style={{
                  height: "14px",
                  width: "55%",
                  background: "var(--color-neutral-200)",
                }}
              />
              <div
                style={{
                  borderTop: "1px solid var(--color-divider)",
                  paddingTop: "var(--space-3)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-2)",
                }}
              >
                <div
                  style={{
                    height: "24px",
                    background: "var(--color-neutral-200)",
                  }}
                />
                <div
                  style={{
                    height: "24px",
                    background: "var(--color-neutral-200)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- empty results --- */}
      {searched && !loading && !error && listings.length === 0 && (
        <div
          className="blueprint"
          style={{
            padding: "clamp(28px,6vw,56px) 24px",
            textAlign: "center",
            display: "grid",
            gap: "10px",
            justifyItems: "center",
          }}
        >
          <Corners />
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <h2 style={{ margin: 0, fontSize: "24px" }}>
            No matches right now
          </h2>
          <p
            style={{
              margin: 0,
              maxWidth: "40ch",
              fontSize: "14px",
              color:
                "color-mix(in srgb, var(--color-text) 65%, transparent)",
            }}
          >
            That&apos;s the point of an alert. Save this search and you&apos;ll
            hear the moment one is listed.
          </p>
          <button
            type="button"
            className="btn btn-primary blueprint"
            onClick={handleSaveAlert}
            style={{ marginTop: "6px" }}
          >
            <Corners />
            Save as alert
          </button>
        </div>
      )}
    </main>
  );
}
