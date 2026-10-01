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
  // Vehicle
  make?: string;
  model?: string;
  trim?: string;
  year_min?: number;
  year_max?: number;
  version?: string;
  body_type?: string;
  transmission?: string;
  drivetrain?: string;
  fuel_type?: string;
  powertrain_type?: string;
  engine?: string;
  cylinders?: string;
  doors?: string;
  seating_capacity?: string;
  model_code?: string;

  // Colors
  exterior_color?: string;
  interior_color?: string;
  base_exterior_color?: string;
  base_interior_color?: string;

  // Pricing
  price_min?: number;
  price_max?: number;
  miles_min?: number;
  miles_max?: number;
  msrp_min?: number;
  msrp_max?: number;

  // Market
  min_days_on_market?: number;
  max_days_on_market?: number;
  listed_after?: string;

  // Inventory
  inventory_type?: string;
  availability_status?: string;

  // Dealer/location
  state?: string;
  dealer_type?: string;
  postal_code?: string;
  radius?: number;

  // Features
  features?: string;
  options_packages?: string;
  keywords?: string;

  // Exclusions
  exclude_make?: string;
  exclude_model?: string;
  exclude_trim?: string;
  exclude_year?: string;
  exclude_state?: string;
  exclude_body_type?: string;
  exclude_drivetrain?: string;
  exclude_transmission?: string;
  exclude_fuel_type?: string;
  exclude_engine?: string;
  exclude_version?: string;
  exclude_exterior_color?: string;
  exclude_interior_color?: string;
  exclude_options_packages?: string;
  exclude_features?: string;
  exclude_keywords?: string;

  // Pagination / sort
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
    // Vehicle
    make: params.make,
    model: params.model,
    trim: params.trim,
    version: params.version,
    body_type: params.body_type,
    transmission: params.transmission,
    drivetrain: params.drivetrain,
    fuel_type: params.fuel_type,
    powertrain_type: params.powertrain_type,
    engine: params.engine,
    cylinders: params.cylinders,
    doors: params.doors,
    seating_capacity: params.seating_capacity,
    model_code: params.model_code,

    // Colors
    exterior_color: params.exterior_color,
    interior_color: params.interior_color,
    base_exterior_color: params.base_exterior_color,
    base_interior_color: params.base_interior_color,

    // Pricing (translate to Visor API names)
    min_price: params.price_min,
    max_price: params.price_max,
    min_mileage: params.miles_min,
    max_mileage: params.miles_max,
    min_msrp: params.msrp_min,
    max_msrp: params.msrp_max,

    // Market
    min_days_on_market: params.min_days_on_market,
    max_days_on_market: params.max_days_on_market,
    listed_after: params.listed_after,

    // Inventory
    inventory_type: params.inventory_type,
    availability_status: params.availability_status,

    // Dealer / location
    state: params.state,
    dealer_type: params.dealer_type,
    postal_code: params.postal_code,
    radius: params.radius,

    // Features
    features: params.features,
    options_packages: params.options_packages,
    keywords: params.keywords,

    // Exclusions
    exclude_make: params.exclude_make,
    exclude_model: params.exclude_model,
    exclude_trim: params.exclude_trim,
    exclude_year: params.exclude_year,
    exclude_state: params.exclude_state,
    exclude_body_type: params.exclude_body_type,
    exclude_drivetrain: params.exclude_drivetrain,
    exclude_transmission: params.exclude_transmission,
    exclude_fuel_type: params.exclude_fuel_type,
    exclude_engine: params.exclude_engine,
    exclude_version: params.exclude_version,
    exclude_exterior_color: params.exclude_exterior_color,
    exclude_interior_color: params.exclude_interior_color,
    exclude_options_packages: params.exclude_options_packages,
    exclude_features: params.exclude_features,
    exclude_keywords: params.exclude_keywords,

    // Pagination / sort
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
