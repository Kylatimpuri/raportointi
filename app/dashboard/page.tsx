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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Myyntianalytiikka</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session.user?.name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            {role === "johto" ? "Johto" : "Myyjä"}
          </span>
          <Link href="/syota" className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
            + Syötä luvut
          </Link>
          {role === "johto" && (
            <Link href="/tuo" className="text-sm text-gray-500 hover:text-gray-700">Tuo CSV</Link>
          )}
          <Link href="/api/auth/signout" className="text-sm text-gray-400 hover:text-gray-600">Ulos</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {data.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="mb-4">Ei dataa vielä.</p>
            <Link href="/syota" className="text-blue-600 hover:underline">Syötä ensimmäiset luvut →</Link>
          </div>
        ) : (
          <DashboardCharts data={data} />
        )}
      </main>
    </div>
  );
}
