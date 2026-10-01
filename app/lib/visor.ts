const VISOR_BASE_URL = "https://api.visor.vin/v1";

function getApiKey(): string {
  const key = process.env.VISOR_API_KEY;
  if (!key) throw new Error("VISOR_API_KEY is not set");
  return key;
}

async function visorFetch<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(`${VISOR_BASE_URL}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Visor API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// --- Types ---

export interface Listing {
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
  inventory_type: "new" | "used" | "certified";
  exterior_color?: string;
  interior_color?: string;
  drivetrain?: string;
  fuel_type?: string;
  listed_at?: string;
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
}

export interface SearchParams {
  make?: string;
  model?: string;
  trim?: string;
  year_min?: number;
  year_max?: number;
  price_min?: number;
  price_max?: number;
  miles_max?: number;
  postal_code?: string;
  radius?: number;
  inventory_type?: string;
  drivetrain?: string;
  fuel_type?: string;
  exterior_color?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

// --- API Functions ---

export async function searchListings(
  params: SearchParams
): Promise<ListingsResponse> {
  // Translate our param names to Visor API's actual parameter names
  const apiParams: Record<string, string | number | undefined> = {
    make: params.make,
    model: params.model,
    trim: params.trim,
    min_price: params.price_min,
    max_price: params.price_max,
    max_mileage: params.miles_max,
    postal_code: params.postal_code,
    radius: params.radius,
    inventory_type: params.inventory_type,
    drivetrain: params.drivetrain,
    fuel_type: params.fuel_type,
    exterior_color: params.exterior_color,
    sort: params.sort,
    limit: params.limit,
    offset: params.offset,
  };

  // Visor uses "year" with comma-separated values, not year_min/year_max
  if (params.year_min || params.year_max) {
    const min = params.year_min || 2000;
    const max = params.year_max || new Date().getFullYear() + 1;
    const years: number[] = [];
    for (let y = min; y <= max; y++) years.push(y);
    apiParams.year = years.join(",");
  }

  const raw = await visorFetch<{
    data: Listing[];
    pagination?: { total?: number };
  }>("/listings", apiParams);

  return {
    listings: raw.data ?? [],
    total: raw.pagination?.total ?? raw.data?.length ?? 0,
  };
}

export async function getListing(listingId: string): Promise<Listing> {
  return visorFetch<Listing>(`/listings/${listingId}`);
}

export interface VinResult {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  combined_msrp?: number;
  options?: string[];
  listing?: Listing;
  photos?: string[];
}

export async function lookupVin(vin: string): Promise<VinResult> {
  return visorFetch<VinResult>(`/vins/${vin}`, {
    include: "price_history,options",
  });
}
