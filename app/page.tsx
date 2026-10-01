"use client";

import { useState } from "react";
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
  photos: string[];
  days_on_market: number;
  inventory_type: string;
  exterior_color?: string;
}

export default function Home() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [milesMax, setMilesMax] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [radius, setRadius] = useState("50");
  const [inventoryType, setInventoryType] = useState("");

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);

    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (yearMin) params.set("year_min", yearMin);
    if (yearMax) params.set("year_max", yearMax);
    if (priceMax) params.set("price_max", priceMax);
    if (milesMax) params.set("miles_max", milesMax);
    if (postalCode) params.set("postal_code", postalCode);
    if (radius) params.set("radius", radius);
    if (inventoryType) params.set("inventory_type", inventoryType);
    params.set("limit", "20");

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

  async function handleSaveAlert() {
    const search: Record<string, string | number> = {};
    if (make) search.make = make;
    if (model) search.model = model;
    if (yearMin) search.year_min = Number(yearMin);
    if (yearMax) search.year_max = Number(yearMax);
    if (priceMax) search.price_max = Number(priceMax);
    if (milesMax) search.miles_max = Number(milesMax);
    if (postalCode) search.postal_code = postalCode;
    if (radius) search.radius = Number(radius);
    if (inventoryType) search.inventory_type = inventoryType;

    const alertName = `${make || "Any"} ${model || ""}`.trim();

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: alertName, search }),
      });
      if (res.ok) {
        alert("Alert saved! You'll get Slack notifications for new listings.");
      } else {
        alert("Failed to save alert.");
      }
    } catch {
      alert("Failed to save alert.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Car Alerts
          </h1>
          <Link
            href="/alerts"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Manage Alerts
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <input
              type="text"
              placeholder="Make (e.g. BMW)"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="text"
              placeholder="Model (e.g. M3)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="number"
              placeholder="Year Min"
              value={yearMin}
              onChange={(e) => setYearMin(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="number"
              placeholder="Year Max"
              value={yearMax}
              onChange={(e) => setYearMax(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="number"
              placeholder="Max Miles"
              value={milesMax}
              onChange={(e) => setMilesMax(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="text"
              placeholder="ZIP Code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="number"
              placeholder="Radius (mi)"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <select
              value={inventoryType}
              onChange={(e) => setInventoryType(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">All Inventory</option>
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="certified">Certified Pre-Owned</option>
            </select>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              onClick={handleSaveAlert}
              className="rounded-lg border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Save as Alert
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {searched && !loading && !error && (
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            {total} result{total !== 1 ? "s" : ""} found
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <a
              key={listing.id}
              href={listing.vdp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              {listing.photos?.[0] && (
                <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={listing.photos[0]}
                    alt={`${listing.year} ${listing.make} ${listing.model}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50">
                {listing.year} {listing.make} {listing.model} {listing.trim}
              </h3>
              <div className="mt-1 flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  ${listing.price?.toLocaleString()}
                </span>
                <span>{listing.miles?.toLocaleString()} mi</span>
              </div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                {listing.dealer_name} &middot; {listing.days_on_market} days on
                market
              </div>
              {listing.exterior_color && (
                <div className="mt-1 text-xs text-zinc-400">
                  {listing.exterior_color}
                </div>
              )}
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
