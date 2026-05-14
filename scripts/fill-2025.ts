import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

function linearRegression(xs: number[], ys: number[]) {
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return (x: number) => Math.max(0, Math.round(intercept + slope * x));
}

async function main() {
  const users = await sql`SELECT id FROM users WHERE email = 'petrus@luhtaniemi.fi' LIMIT 1`;
  const userId = users[0].id as string;

  // Haetaan kaikki data aikajärjestyksessä
  const rows = await sql`
    SELECT to_char(period, 'YYYY-MM') AS period, leads, first_meetings, all_meetings, deals
    FROM sales_entries
    WHERE user_id = ${userId}
    ORDER BY period ASC
  `;

  // Muunnetaan kuukaudet numeeriseksi indeksiksi (2024-01 = 0)
  function periodToIndex(p: string) {
    const [year, month] = p.split("-").map(Number);
    return (year - 2024) * 12 + (month - 1);
  }

  const metrics = ["leads", "first_meetings", "all_meetings", "deals"] as const;

  // Poistetaan 2025-11 ja 2025-12 regressiodatasta (ne ovat puutteellisia)
  const trainingRows = rows.filter(
    (r) => r.period !== "2025-11" && r.period !== "2025-12"
  );

  const xs = trainingRows.map((r) => periodToIndex(r.period as string));

  const predicted: Record<string, Record<string, number>> = {
    "2025-11": {},
    "2025-12": {},
  };

  for (const metric of metrics) {
    const ys = trainingRows.map((r) => Number(r[metric]) || 0);
    const predict = linearRegression(xs, ys);
    predicted["2025-11"][metric] = predict(periodToIndex("2025-11"));
    predicted["2025-12"][metric] = predict(periodToIndex("2025-12"));
  }

  console.log("Ennustetut arvot:");
  for (const [period, values] of Object.entries(predicted)) {
    console.log(`  ${period}: liidit=${values.leads} 1.tap=${values.first_meetings} kaikki=${values.all_meetings} kaupat=${values.deals}`);
  }

  for (const [period, values] of Object.entries(predicted)) {
    await sql`
      INSERT INTO sales_entries (user_id, period, leads, first_meetings, all_meetings, deals)
      VALUES (${userId}, ${period + "-01"}, ${values.leads}, ${values.first_meetings}, ${values.all_meetings}, ${values.deals})
      ON CONFLICT (user_id, period) DO UPDATE SET
        leads          = ${values.leads},
        first_meetings = ${values.first_meetings},
        all_meetings   = ${values.all_meetings},
        deals          = ${values.deals}
    `;
    console.log(`✓ ${period} päivitetty`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
