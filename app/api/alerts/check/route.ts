import { getAllAlerts, markSeen } from "../../../lib/alerts-store";
import { searchListings } from "../../../lib/visor";
import { sendSlackAlert } from "../../../lib/slack";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = getAllAlerts();
  const results: { alert: string; newCount: number }[] = [];

  for (const alert of alerts) {
    try {
      const data = await searchListings({
        ...alert.search,
        sort: "listed_at",
        limit: 50,
      });

      const seenSet = new Set(alert.seen_ids);
      const newListings = data.listings.filter((l) => !seenSet.has(l.id));

      if (newListings.length > 0) {
        await sendSlackAlert(alert.name, newListings);
        markSeen(
          alert.id,
          newListings.map((l) => l.id)
        );
      }

      results.push({ alert: alert.name, newCount: newListings.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({ alert: alert.name, newCount: -1 });
      console.error(`Alert check failed for "${alert.name}":`, message);
    }
  }

  return Response.json({ checked: results.length, results });
}
