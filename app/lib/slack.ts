import type { Listing } from "./visor";

function getWebhookUrl(): string {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) throw new Error("SLACK_WEBHOOK_URL is not set");
  return url;
}

export async function sendSlackAlert(
  alertName: string,
  newListings: Listing[]
) {
  const webhookUrl = getWebhookUrl();

  const listingBlocks = newListings.slice(0, 10).map((l) => ({
    type: "section" as const,
    text: {
      type: "mrkdwn" as const,
      text: [
        `*<${l.vdp_url}|${l.year} ${l.make} ${l.model} ${l.trim}>*`,
        `Price: *$${l.price?.toLocaleString() ?? "N/A"}* | Miles: *${l.miles?.toLocaleString() ?? "N/A"}*`,
        `Dealer: ${l.dealer_name} | Days on market: ${l.days_on_market}`,
        l.exterior_color ? `Color: ${l.exterior_color}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    ...(l.photos?.[0]
      ? {
          accessory: {
            type: "image" as const,
            image_url: l.photos[0],
            alt_text: `${l.year} ${l.make} ${l.model}`,
          },
        }
      : {}),
  }));

  const payload = {
    blocks: [
      {
        type: "header" as const,
        text: {
          type: "plain_text" as const,
          text: `🚗 ${newListings.length} new listing${newListings.length === 1 ? "" : "s"} for "${alertName}"`,
        },
      },
      ...listingBlocks,
      ...(newListings.length > 10
        ? [
            {
              type: "context" as const,
              elements: [
                {
                  type: "mrkdwn" as const,
                  text: `_...and ${newListings.length - 10} more_`,
                },
              ],
            },
          ]
        : []),
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook error ${res.status}: ${await res.text()}`);
  }
}
