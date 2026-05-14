import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "johto") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await sql`
    SELECT id, name, email, role, created_at
    FROM users
    ORDER BY created_at ASC
  `;
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "johto") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Kaikki kentät vaaditaan" }, { status: 400 });
  }
  if (!["myyja", "johto"].includes(role)) {
    return NextResponse.json({ error: "Virheellinen rooli" }, { status: 400 });
  }
  const hash = await bcrypt.hash(password, 12);
  try {
    const rows = await sql`
      INSERT INTO users (name, email, password, role)
      VALUES (${name}, ${email}, ${hash}, ${role})
      RETURNING id, name, email, role
    `;
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Sähköposti on jo käytössä" }, { status: 409 });
  }
}
