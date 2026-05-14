import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "johto") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const currentId = (session.user as { id?: string }).id;
  if (id === currentId) {
    return NextResponse.json({ error: "Et voi poistaa omaa tiliäsi" }, { status: 400 });
  }
  await sql`DELETE FROM users WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "johto") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { password } = await req.json();
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Salasana liian lyhyt (min 6 merkkiä)" }, { status: 400 });
  }
  const hash = await bcrypt.hash(password, 12);
  await sql`UPDATE users SET password = ${hash} WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
