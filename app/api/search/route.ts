import { type NextRequest } from "next/server";
import { searchListings, type SearchParams } from "../../lib/visor";

function str(sp: URLSearchParams, key: string): string | undefined {
  return sp.get(key) ?? undefined;
}

function num(sp: URLSearchParams, key: string): number | undefined {
  return sp.has(key) ? Number(sp.get(key)) : undefined;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const params: SearchParams = {
    // Vehicle
    make: str(sp, "make"),
    model: str(sp, "model"),
    trim: str(sp, "trim"),
    year_min: num(sp, "year_min"),
    year_max: num(sp, "year_max"),
    version: str(sp, "version"),
    body_type: str(sp, "body_type"),
    transmission: str(sp, "transmission"),
    drivetrain: str(sp, "drivetrain"),
    fuel_type: str(sp, "fuel_type"),
    powertrain_type: str(sp, "powertrain_type"),
    engine: str(sp, "engine"),
    cylinders: str(sp, "cylinders"),
    doors: str(sp, "doors"),
    seating_capacity: str(sp, "seating_capacity"),
    model_code: str(sp, "model_code"),

    // Colors
    exterior_color: str(sp, "exterior_color"),
    interior_color: str(sp, "interior_color"),
    base_exterior_color: str(sp, "base_exterior_color"),
    base_interior_color: str(sp, "base_interior_color"),

    // Pricing
    price_min: num(sp, "price_min"),
    price_max: num(sp, "price_max"),
    miles_min: num(sp, "miles_min"),
    miles_max: num(sp, "miles_max"),
    msrp_min: num(sp, "msrp_min"),
    msrp_max: num(sp, "msrp_max"),

    // Market
    min_days_on_market: num(sp, "min_days_on_market"),
    max_days_on_market: num(sp, "max_days_on_market"),
    listed_after: str(sp, "listed_after"),

    // Inventory
    inventory_type: str(sp, "inventory_type"),
    availability_status: str(sp, "availability_status"),

    // Dealer / location
    state: str(sp, "state"),
    dealer_type: str(sp, "dealer_type"),
    postal_code: str(sp, "postal_code"),
    radius: num(sp, "radius"),

    // Features
    features: str(sp, "features"),
    options_packages: str(sp, "options_packages"),
    keywords: str(sp, "keywords"),

    // Exclusions
    exclude_make: str(sp, "exclude_make"),
    exclude_model: str(sp, "exclude_model"),
    exclude_trim: str(sp, "exclude_trim"),
    exclude_year: str(sp, "exclude_year"),
    exclude_state: str(sp, "exclude_state"),
    exclude_body_type: str(sp, "exclude_body_type"),
    exclude_drivetrain: str(sp, "exclude_drivetrain"),
    exclude_transmission: str(sp, "exclude_transmission"),
    exclude_fuel_type: str(sp, "exclude_fuel_type"),
    exclude_engine: str(sp, "exclude_engine"),
    exclude_version: str(sp, "exclude_version"),
    exclude_exterior_color: str(sp, "exclude_exterior_color"),
    exclude_interior_color: str(sp, "exclude_interior_color"),
    exclude_options_packages: str(sp, "exclude_options_packages"),
    exclude_features: str(sp, "exclude_features"),
    exclude_keywords: str(sp, "exclude_keywords"),

    // Pagination / sort
    sort: str(sp, "sort"),
    limit: num(sp, "limit") ?? 20,
    offset: num(sp, "offset") ?? 0,
  };

  try {
    const data = await searchListings(params);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
