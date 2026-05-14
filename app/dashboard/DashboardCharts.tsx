"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { periodLabel } from "@/lib/forecast";

type Row = { period: string; leads: number; first_meetings: number; all_meetings: number; deals: number };

const METRICS = [
  { key: "leads",          label: "Liidit",              color: "#3b82f6" },
  { key: "first_meetings", label: "Ykköstapaamiset",     color: "#8b5cf6" },
  { key: "all_meetings",   label: "Kaikki tapaamiset",   color: "#06b6d4" },
  { key: "deals",          label: "Kaupat",              color: "#10b981" },
] as const;

function linearRegression(xs: number[], ys: number[]) {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const slope = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0) /
                xs.reduce((s, x) => s + (x - meanX) ** 2, 0);
  const intercept = meanY - slope * meanX;
  return { slope, intercept, predict: (x: number) => Math.max(0, slope * x + intercept) };
}

function nextPeriod(period: string, months: number): string {
  const d = new Date(period + "-01");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 7);
}

export function DashboardCharts({ data }: { data: Row[] }) {
  const chartData = data.map((d) => ({ ...d, label: periodLabel(d.period) }));

  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  // Kauppaennuste: deals(t) ~ first_meetings(t-1), 1 kk viive
  const LAG = 1;
  const regressionData = data.slice(LAG).map((d, i) => ({
    meetings: data[i].first_meetings,
    deals: d.deals,
  }));
  const model = linearRegression(
    regressionData.map(d => d.meetings),
    regressionData.map(d => d.deals)
  );

  // Historialliset pisteet + sovite
  const forecastChartData = data.map((d, i) => {
    const prevRow = data[i - LAG];
    return {
      label: periodLabel(d.period),
      period: d.period,
      actual: d.deals,
      fitted: prevRow ? Math.round(model.predict(prevRow.first_meetings) * 10) / 10 : null,
      forecast: null as number | null,
    };
  });

  // Ennuste 3 kk eteenpäin, käyttäen viimeisen 3 kk keskiarvoa tulevina ykköstapaamisina
  const recentMeetingsAvg = Math.round(
    data.slice(-3).reduce((s, d) => s + d.first_meetings, 0) / 3
  );
  const lastPeriod = data[data.length - 1].period;
  for (let i = 1; i <= 3; i++) {
    forecastChartData.push({
      label: periodLabel(nextPeriod(lastPeriod, i)),
      period: nextPeriod(lastPeriod, i),
      actual: null as unknown as number,
      fitted: null,
      forecast: Math.round(model.predict(recentMeetingsAvg) * 10) / 10,
    });
  }

  const forecastStartLabel = periodLabel(nextPeriod(lastPeriod, 1));

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

      {/* Kauppaennuste */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-700">Kauppaennuste — perustuu ykköstapaamisiin (1 kk viive)</h2>
          <span className="text-xs text-gray-400">Ennuste käyttää viim. 3 kk tapaamiskeskiarvoa: {recentMeetingsAvg} kpl/kk</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Malli: kaupat = {model.slope.toFixed(2)} × ykköstapaamiset + {model.intercept.toFixed(2)}
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={forecastChartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine x={forecastStartLabel} stroke="#d1d5db" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Toteutuneet kaupat" connectNulls={false} />
            <Line type="monotone" dataKey="fitted" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Mallin sovite" connectNulls={false} />
            <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Ennuste (3 kk)" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Historiagraafid */}
      <div className="flex flex-col gap-6">
        {METRICS.map((m) => (
          <div key={m.key} className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">{m.label}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
                <Tooltip />
                <Line type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2} dot={{ r: 3 }} name={m.label} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
