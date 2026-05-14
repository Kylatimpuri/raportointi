import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

const sql = neon(process.env.DATABASE_URL!);

// ISO week number → month (1-indexed), works for 2024/2025/2026
function weekToMonth(week: number): number {
  if (week <= 4)  return 1;
  if (week <= 8)  return 2;
  if (week <= 13) return 3;
  if (week <= 17) return 4;
  if (week <= 21) return 5;
  if (week <= 26) return 6;
  if (week <= 30) return 7;
  if (week <= 35) return 8;
  if (week <= 39) return 9;
  if (week <= 44) return 10;
  if (week <= 48) return 11;
  return 12;
}

type WeekRow = { week: number; leads: number; first_meetings: number; all_meetings: number; deals: number };
type MonthData = { leads: number; first_meetings: number; all_meetings: number; deals: number };

function aggregateToMonths(weeks: WeekRow[]): Record<number, MonthData> {
  const months: Record<number, MonthData> = {};
  for (const w of weeks) {
    const m = weekToMonth(w.week);
    if (!months[m]) months[m] = { leads: 0, first_meetings: 0, all_meetings: 0, deals: 0 };
    months[m].leads          += w.leads;
    months[m].first_meetings += w.first_meetings;
    months[m].all_meetings   += w.all_meetings;
    months[m].deals          += w.deals;
  }
  return months;
}

function parseSection(lines: string[]): WeekRow[] {
  const rows: WeekRow[] = [];
  for (const line of lines) {
    const parts = line.split(";");
    const weekLabel = parts[0].trim();
    if (!weekLabel.startsWith("Vk")) continue;
    const week = parseInt(weekLabel.replace("Vk", "").trim());
    if (isNaN(week)) continue;
    rows.push({
      week,
      leads:          parseInt(parts[1]) || 0,
      first_meetings: parseInt(parts[2]) || 0,
      all_meetings:   parseInt(parts[3]) || 0,
      deals:          parseInt(parts[4]) || 0,
    });
  }
  return rows;
}

async function main() {
  // Get user id for Petrus
  const users = await sql`SELECT id FROM users WHERE email = 'petrus@luhtaniemi.fi' LIMIT 1`;
  if (users.length === 0) { console.error("Käyttäjää ei löydy."); process.exit(1); }
  const userId = users[0].id as string;

  const csvPath = join(process.cwd(), "historiadata", "historiadata.csv");
  const lines = readFileSync(csvPath, "utf-8").split("\n").map(l => l.trim());

  // Split into sections by year
  // Header: row 0
  // 2024: rows 1-52, total row 53 (starts with ";")
  // 2025: rows 54-105, total row 106
  // 2026: rows 107-158
  const section2024 = lines.slice(1, 53);
  const section2025 = lines.slice(54, 106);
  const section2026 = lines.slice(107, 159);

  const sections = [
    { year: 2024, lines: section2024 },
    { year: 2025, lines: section2025 },
    { year: 2026, lines: section2026 },
  ];

  let inserted = 0;
  for (const { year, lines: sectionLines } of sections) {
    const weeks = parseSection(sectionLines);
    const months = aggregateToMonths(weeks);

    for (const [monthStr, data] of Object.entries(months)) {
      const month = parseInt(monthStr);
      // Skip months with no data at all
      if (data.leads === 0 && data.first_meetings === 0 && data.all_meetings === 0 && data.deals === 0) continue;

      const period = `${year}-${String(month).padStart(2, "0")}-01`;
      await sql`
        INSERT INTO sales_entries (user_id, period, leads, first_meetings, all_meetings, deals)
        VALUES (${userId}, ${period}, ${data.leads}, ${data.first_meetings}, ${data.all_meetings}, ${data.deals})
        ON CONFLICT (user_id, period) DO UPDATE SET
          leads          = ${data.leads},
          first_meetings = ${data.first_meetings},
          all_meetings   = ${data.all_meetings},
          deals          = ${data.deals}
      `;
      console.log(`✓ ${year}-${String(month).padStart(2, "0")}: liidit=${data.leads} 1.tap=${data.first_meetings} kaikki=${data.all_meetings} kaupat=${data.deals}`);
      inserted++;
    }
  }
  console.log(`\nValmis. ${inserted} kuukautta syötetty.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
