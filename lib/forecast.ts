export type DataPoint = { period: string; value: number };

// Lineaarinen regressio — palauttaa ennusteet tuleville kuukausille
export function linearForecast(data: DataPoint[], months: number): DataPoint[] {
  if (data.length < 2) return [];
  const n = data.length;
  const xs = data.map((_, i) => i);
  const ys = data.map((d) => d.value);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const lastDate = new Date(data[data.length - 1].period);
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(lastDate);
    d.setMonth(d.getMonth() + i + 1);
    const period = d.toISOString().slice(0, 7);
    const value = Math.max(0, Math.round(intercept + slope * (n + i)));
    return { period, value };
  });
}

export function periodLabel(period: string) {
  const [year, month] = period.split("-");
  const months = ["Tam", "Hel", "Maa", "Huh", "Tou", "Kes", "Hei", "Elo", "Syy", "Lok", "Mar", "Jou"];
  return `${months[parseInt(month) - 1]} ${year}`;
}
