import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - meanX) ** 2, 0) *
    ys.reduce((s, y) => s + (y - meanY) ** 2, 0)
  );
  return den === 0 ? 0 : num / den;
}

async function main() {
  const rows = await sql`
    SELECT to_char(period, 'YYYY-MM') AS period, first_meetings, deals
    FROM sales_entries
    ORDER BY period ASC
  `;

  const meetings = rows.map((r) => Number(r.first_meetings));
  const deals    = rows.map((r) => Number(r.deals));

  console.log("Viive (kk) | Korrelaatio | Tulkinta");
  console.log("-----------|-------------|----------");

  let bestLag = 0;
  let bestCorr = -Infinity;

  for (let lag = 0; lag <= 6; lag++) {
    const xs = meetings.slice(0, meetings.length - lag);
    const ys = deals.slice(lag);
    const corr = pearson(xs, ys);
    const bar = "█".repeat(Math.round(Math.abs(corr) * 10));
    const label = corr > 0.6 ? "vahva" : corr > 0.3 ? "kohtalainen" : "heikko";
    console.log(`  ${lag} kk      |   ${corr.toFixed(2)}      | ${bar} ${label}`);
    if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
  }

  console.log(`\n→ Vahvin korrelaatio: ${bestLag} kuukauden viiveellä (r=${bestCorr.toFixed(2)})`);
  if (bestLag === 0) console.log("  Kaupat ja tapaamiset korreloivat saman kuukauden sisällä.");
  else console.log(`  Ykköstapaamiset näkyvät kauppamäärässä noin ${bestLag} kuukauden kuluttua.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
