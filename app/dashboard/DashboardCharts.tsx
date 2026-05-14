"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { linearForecast, periodLabel } from "@/lib/forecast";

type Row = { period: string; leads: number; first_meetings: number; all_meetings: number; deals: number };

const METRICS = [
  { key: "leads",          label: "Liidit",              color: "#3b82f6" },
  { key: "first_meetings", label: "Ykköstapaamiset",     color: "#8b5cf6" },
  { key: "all_meetings",   label: "Kaikki tapaamiset",   color: "#06b6d4" },
  { key: "deals",          label: "Kaupat",              color: "#10b981" },
] as const;

export function DashboardCharts({ data }: { data: Row[] }) {
  const FORECAST_MONTHS = 6;
  const forecastStart = data.length > 0 ? data[data.length - 1].period : null;

  // Build combined chart data with forecasts
  const forecasts = METRICS.reduce((acc, m) => {
    const points = data.map((d) => ({ period: d.period, value: d[m.key] }));
    acc[m.key] = linearForecast(points, FORECAST_MONTHS);
    return acc;
  }, {} as Record<string, { period: string; value: number }[]>);

  const forecastPeriods = forecasts.leads.map((f) => f.period);
  const allPeriods = [...data.map((d) => d.period), ...forecastPeriods];

  const chartData = allPeriods.map((period) => {
    const actual = data.find((d) => d.period === period);
    const row: Record<string, number | string | null> = { period, label: periodLabel(period) };
    for (const m of METRICS) {
      row[m.key] = actual ? actual[m.key] : null;
      const fc = forecasts[m.key].find((f) => f.period === period);
      row[`${m.key}_forecast`] = fc ? fc.value : null;
    }
    return row;
  });

  // Summary cards
  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {METRICS.map((m) => {
          const val = last?.[m.key] ?? 0;
          const prevVal = prev?.[m.key] ?? 0;
          const diff = prevVal > 0 ? Math.round(((val - prevVal) / prevVal) * 100) : null;
          return (
            <div key={m.key} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-1">{m.label} (viime kk)</p>
              <p className="text-3xl font-bold text-gray-900">{val}</p>
              {diff !== null && (
                <p className={`text-xs mt-1 font-medium ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {diff >= 0 ? "+" : ""}{diff}% ed. kuukauteen
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="flex flex-col gap-6">
        {METRICS.map((m) => (
          <div key={m.key} className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">{m.label} — historia & ennuste (6 kk)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
                <Tooltip />
                {forecastStart && (
                  <ReferenceLine x={periodLabel(forecastStart)} stroke="#d1d5db" strokeDasharray="4 4" label={{ value: "Ennuste →", fontSize: 10, fill: "#9ca3af" }} />
                )}
                <Line type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2} dot={{ r: 3 }} name={m.label} connectNulls={false} />
                <Line type="monotone" dataKey={`${m.key}_forecast`} stroke={m.color} strokeWidth={2} strokeDasharray="5 5" dot={false} name={`${m.label} (ennuste)`} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
