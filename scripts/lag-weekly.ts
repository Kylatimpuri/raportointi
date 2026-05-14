import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync } from "fs";
import { join } from "path";

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

function parseWeeks(lines: string[]): { week: number; meetings: number; deals: number }[] {
  const rows = [];
  for (const line of lines) {
    const parts = line.split(";");
    if (!parts[0].trim().startsWith("Vk")) continue;
    const week = parseInt(parts[0].replace("Vk", "").trim());
    if (isNaN(week)) continue;
    rows.push({
      week,
      meetings: parseInt(parts[2]) || 0,
      deals:    parseInt(parts[4]) || 0,
    });
  }
  return rows;
}

const lines = readFileSync(
  join(process.cwd(), "historiadata", "historiadata.csv"), "utf-8"
).split("\n").map(l => l.trim());

// 2024: rows 1-52, 2025: rows 54-105 (only complete weeks with meetings data)
const weeks2024 = parseWeeks(lines.slice(1, 53));
const weeks2025 = parseWeeks(lines.slice(54, 106));
const allWeeks  = [...weeks2024, ...weeks2025];

const meetings = allWeeks.map(w => w.meetings);
const deals    = allWeeks.map(w => w.deals);

console.log("=== Viikkotason viiveanalyysi (ykköstapaamiset → kaupat) ===\n");
console.log("Viive      | Korrelaatio | Tulkinta");
console.log("-----------|-------------|----------");

const lagsToTest = [0, 2, 4, 6, 8, 10, 12];
let bestLag = 0, bestCorr = -Infinity;

for (const lag of lagsToTest) {
  const xs = meetings.slice(0, meetings.length - lag);
  const ys = deals.slice(lag);
  const corr = pearson(xs, ys);
  const bar = "█".repeat(Math.round(Math.abs(corr) * 10));
  const label = corr > 0.5 ? "vahva" : corr > 0.3 ? "kohtalainen" : "heikko";
  const approxMonths = (lag / 4.3).toFixed(1);
  console.log(`  ${String(lag).padEnd(2)} vk (≈${approxMonths} kk) |   ${corr.toFixed(2)}      | ${bar} ${label}`);
  if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
}

console.log(`\n=== Vertailu: 8 viikkoa vs 1 kuukausi ===\n`);

const corr8wk = pearson(meetings.slice(0, -8), deals.slice(8));
const corr1mo = pearson(meetings.slice(0, -4), deals.slice(4)); // ~4 viikkoa = 1 kk

console.log(`  8 viikkoa (≈2 kk):  r=${corr8wk.toFixed(2)}`);
console.log(`  1 kuukausi (≈4 vk): r=${corr1mo.toFixed(2)}`);
console.log(`\n→ Vahvin viive: ${bestLag} viikkoa (≈${(bestLag/4.3).toFixed(1)} kk), r=${bestCorr.toFixed(2)}`);
