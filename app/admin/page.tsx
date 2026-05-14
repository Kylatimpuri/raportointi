import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { UserManager } from "./UserManager";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "johto") redirect("/dashboard");

  const users = await sql`
    SELECT id, name, email, role, created_at
    FROM users
    ORDER BY created_at ASC
  `;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-mist px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-sage hover:text-navy transition-colors">← Dashboard</Link>
          <h1 className="text-base font-bold text-navy tracking-wide uppercase">Käyttäjähallinta</h1>
        </div>
        <Link href="/api/auth/signout" className="text-sm text-sage hover:text-navy transition-colors">Ulos</Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <UserManager initialUsers={users as unknown as { id: string; name: string; email: string; role: string; created_at: string }[]} />
      </main>
    </div>
  );
}
