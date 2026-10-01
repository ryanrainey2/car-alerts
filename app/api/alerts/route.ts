import { type NextRequest } from "next/server";
import { getAllAlerts, createAlert, deleteAlert } from "../../lib/alerts-store";

export async function GET() {
  return Response.json({ alerts: getAllAlerts() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, search } = body;

  if (!name || !search) {
    return Response.json(
      { error: "name and search are required" },
      { status: 400 }
    );
  }

  const alert = createAlert(name, search);
  return Response.json(alert, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const deleted = deleteAlert(id);
  if (!deleted) {
    return Response.json({ error: "Alert not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
