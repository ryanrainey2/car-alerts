import { type NextRequest } from "next/server";

const VISOR_BASE_URL = "https://api.visor.vin/v1";

function getApiKey(): string {
  const key = process.env.VISOR_API_KEY;
  if (!key) throw new Error("VISOR_API_KEY is not set");
  return key;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const url = new URL(`${VISOR_BASE_URL}/facets`);

  const make = sp.get("make");
  const model = sp.get("model");
  const yearMin = sp.get("year_min");
  const yearMax = sp.get("year_max");
  const facets = sp.get("facets");

  if (make) url.searchParams.set("make", make);
  if (model) url.searchParams.set("model", model);

  // Visor facets API uses "year" with comma-separated values, not year_min/year_max
  if (yearMin || yearMax) {
    const min = Number(yearMin) || 2000;
    const max = Number(yearMax) || new Date().getFullYear() + 1;
    const years: number[] = [];
    for (let y = min; y <= max; y++) years.push(y);
    url.searchParams.set("year", years.join(","));
  }

  if (facets) url.searchParams.set("facets", facets);

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${getApiKey()}` },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const body = await res.text();
      return Response.json(
        { error: `Visor API error ${res.status}: ${body}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Transform { data: { facets: { make: [{value, count}] } } }
    // into { make: ["Ford", "Toyota", ...] } for the UI
    const facetsObj = data?.data?.facets ?? {};
    const result: Record<string, string[]> = {};
    for (const [key, values] of Object.entries(facetsObj)) {
      result[key] = (values as Array<{ value: string }>).map((v) => v.value);
    }
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
