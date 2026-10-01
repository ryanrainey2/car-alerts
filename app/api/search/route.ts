import { type NextRequest } from "next/server";
import { searchListings, type SearchParams } from "../../lib/visor";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const params: SearchParams = {
    make: sp.get("make") ?? undefined,
    model: sp.get("model") ?? undefined,
    trim: sp.get("trim") ?? undefined,
    year_min: sp.has("year_min") ? Number(sp.get("year_min")) : undefined,
    year_max: sp.has("year_max") ? Number(sp.get("year_max")) : undefined,
    price_min: sp.has("price_min") ? Number(sp.get("price_min")) : undefined,
    price_max: sp.has("price_max") ? Number(sp.get("price_max")) : undefined,
    miles_max: sp.has("miles_max") ? Number(sp.get("miles_max")) : undefined,
    postal_code: sp.get("postal_code") ?? undefined,
    radius: sp.has("radius") ? Number(sp.get("radius")) : undefined,
    inventory_type: sp.get("inventory_type") ?? undefined,
    drivetrain: sp.get("drivetrain") ?? undefined,
    fuel_type: sp.get("fuel_type") ?? undefined,
    exterior_color: sp.get("exterior_color") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    limit: sp.has("limit") ? Number(sp.get("limit")) : 20,
    offset: sp.has("offset") ? Number(sp.get("offset")) : 0,
  };

  try {
    const data = await searchListings(params);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
