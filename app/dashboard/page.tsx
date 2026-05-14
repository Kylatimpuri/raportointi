import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { DashboardCharts } from "./DashboardCharts";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role?: string }).role;

  const rows = await sql`
    SELECT
      to_char(period, 'YYYY-MM') AS period,
      SUM(leads)::int          AS leads,
      SUM(first_meetings)::int AS first_meetings,
      SUM(all_meetings)::int   AS all_meetings,
      SUM(deals)::int          AS deals
    FROM sales_entries
    GROUP BY period
    ORDER BY period ASC
  `;

  const data = rows as unknown as {
    period: string; leads: number; first_meetings: number; all_meetings: number; deals: number;
  }[];

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-mist px-6 py-4 flex items-center justify-between">
        <h1 className="text-base font-bold text-navy tracking-wide uppercase">Kylätimpuri — Myyntianalytiikka</h1>
        <div className="flex items-center gap-5">
          <span className="text-sm text-sage">{session.user?.name}</span>
          <span className="text-xs bg-mist text-navy px-2 py-1 font-medium">
            {role === "johto" ? "Johto" : "Myyjä"}
          </span>
          <Link href="/tavoitteet" className="text-sm text-navy hover:text-sage transition-colors">Tavoitteet</Link>
          <Link href="/syota" className="text-sm bg-navy text-white px-3 py-1.5 hover:bg-[#1a1f2e] transition-colors">
            + Syötä luvut
          </Link>
          {role === "johto" && (
            <Link href="/admin" className="text-sm text-sage hover:text-navy transition-colors">Käyttäjät</Link>
          )}
          <Link href="/api/auth/signout" className="text-sm text-sage hover:text-navy transition-colors">Ulos</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {data.length === 0 ? (
          <div className="text-center py-20 text-sage">
            <p className="mb-4">Ei dataa vielä.</p>
            <Link href="/syota" className="text-navy hover:underline">Syötä ensimmäiset luvut →</Link>
          </div>
        ) : (
          <DashboardCharts data={data} />
        )}
      </main>
    </div>
  );
}
