import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { periodLabel } from "@/lib/forecast";
import Link from "next/link";

function linearRegression(xs: number[], ys: number[]) {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const slope =
    xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0) /
    xs.reduce((s, x) => s + (x - meanX) ** 2, 0);
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
}

function addMonths(period: string, n: number) {
  const d = new Date(period + "-01");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 7);
}

export default async function TavoitteetPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const TARGET_DEALS = 4;
  const START_PERIOD = "2026-06";
  const MONTHS_AHEAD = 6;

  const rows = await sql`
    SELECT to_char(period, 'YYYY-MM') AS period, first_meetings, deals
    FROM sales_entries
    ORDER BY period ASC
  `;

  const LAG = 1;
  const regressionPairs = rows.slice(LAG).map((r, i) => ({
    meetings: Number(rows[i].first_meetings),
    deals: Number(r.deals),
  }));
  const { slope, intercept } = linearRegression(
    regressionPairs.map(p => p.meetings),
    regressionPairs.map(p => p.deals)
  );

  const meetingsNeeded = Math.ceil((TARGET_DEALS - intercept) / slope);

  const months = Array.from({ length: MONTHS_AHEAD }, (_, i) => {
    const period = addMonths(START_PERIOD, i);
    const actual = rows.find(r => r.period === period);
    const actualMeetings = actual ? Number(actual.first_meetings) : null;
    const actualDeals = actual ? Number(actual.deals) : null;
    const predictedDeals = actualMeetings !== null
      ? Math.max(0, Math.round((slope * actualMeetings + intercept) * 10) / 10)
      : null;
    const onTrack = actualMeetings !== null ? actualMeetings >= meetingsNeeded : null;
    return { period, actualMeetings, actualDeals, predictedDeals, onTrack };
  });

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-mist px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-sage hover:text-navy transition-colors">← Dashboard</Link>
          <h1 className="text-base font-bold text-navy tracking-wide uppercase">Tavoitteet</h1>
        </div>
        <Link href="/api/auth/signout" className="text-sm text-sage hover:text-navy transition-colors">Ulos</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Tavoitekortti */}
        <div className="bg-navy p-6 text-white mb-8">
          <p className="text-xs text-sage uppercase tracking-wider mb-1">Tavoite kesäkuusta 2026 →</p>
          <p className="text-4xl font-bold mb-4">{TARGET_DEALS} kauppaa / kk</p>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-sage uppercase tracking-wider">Tarvittavat ykköstapaamiset</p>
              <p className="text-2xl font-bold">{meetingsNeeded} kpl / kk</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-xs text-sage uppercase tracking-wider">Malli (1 kk viive)</p>
              <p className="text-sm font-medium">kaupat = {slope.toFixed(2)} × tapaamiset + {intercept.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Kuukausitaulukko */}
        <div className="bg-white border border-mist overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream border-b border-mist">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-sage uppercase tracking-wider text-xs">Kuukausi</th>
                <th className="text-center px-5 py-3 font-medium text-sage uppercase tracking-wider text-xs">Tavoite<br/><span className="text-xs font-normal normal-case">1. tapaamiset</span></th>
                <th className="text-center px-5 py-3 font-medium text-sage uppercase tracking-wider text-xs">Toteutunut<br/><span className="text-xs font-normal normal-case">1. tapaamiset</span></th>
                <th className="text-center px-5 py-3 font-medium text-sage uppercase tracking-wider text-xs">Ennuste<br/><span className="text-xs font-normal normal-case">kaupat</span></th>
                <th className="text-center px-5 py-3 font-medium text-sage uppercase tracking-wider text-xs">Toteutunut<br/><span className="text-xs font-normal normal-case">kaupat</span></th>
                <th className="text-center px-5 py-3 font-medium text-sage uppercase tracking-wider text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {months.map(({ period, actualMeetings, actualDeals, predictedDeals, onTrack }) => (
                <tr key={period} className="hover:bg-cream/50">
                  <td className="px-5 py-4 font-medium text-navy">{periodLabel(period)}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-block bg-mist text-navy font-bold px-3 py-1">
                      {meetingsNeeded}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {actualMeetings !== null ? (
                      <span className={`font-bold ${onTrack ? "text-forest" : "text-[#9c3a3a]"}`}>
                        {actualMeetings}
                      </span>
                    ) : (
                      <span className="text-mist">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center text-sage">
                    {predictedDeals !== null ? predictedDeals : <span className="text-mist">—</span>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {actualDeals !== null ? (
                      <span className={`font-bold ${actualDeals >= TARGET_DEALS ? "text-forest" : "text-navy"}`}>
                        {actualDeals}
                      </span>
                    ) : (
                      <span className="text-mist">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {onTrack === null ? (
                      <span className="text-xs text-sage">Tulossa</span>
                    ) : onTrack ? (
                      <span className="text-xs bg-lime/20 text-forest px-2 py-1 font-medium">✓ Tavoitteessa</span>
                    ) : (
                      <span className="text-xs bg-[#9c3a3a]/10 text-[#9c3a3a] px-2 py-1 font-medium">↑ Vajaus {meetingsNeeded - (actualMeetings ?? 0)} kpl</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-sage mt-4 text-center">
          Ennuste perustuu lineaariseen regressioon 2024–2026 datasta. Toteutuneet luvut päivittyvät kun myyjät syöttävät kuukausiluvut.
        </p>
      </main>
    </div>
  );
}
