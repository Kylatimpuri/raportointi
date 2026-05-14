import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  const { period, leads, first_meetings, all_meetings, deals, notes } = await req.json();

  if (!period) return NextResponse.json({ error: "Kuukausi puuttuu" }, { status: 400 });

  await sql`
    INSERT INTO sales_entries (user_id, period, leads, first_meetings, all_meetings, deals, notes)
    VALUES (${userId}, ${period}, ${leads ?? 0}, ${first_meetings ?? 0}, ${all_meetings ?? 0}, ${deals ?? 0}, ${notes ?? null})
    ON CONFLICT (user_id, period)
    DO UPDATE SET
      leads = ${leads ?? 0},
      first_meetings = ${first_meetings ?? 0},
      all_meetings = ${all_meetings ?? 0},
      deals = ${deals ?? 0},
      notes = ${notes ?? null}
  `;

  return NextResponse.json({ ok: true });
}
