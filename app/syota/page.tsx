"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function currentIsoWeek(): string {
  const now = new Date();
  const day = now.getDay() || 7;
  const thursday = new Date(now);
  thursday.setDate(now.getDate() - day + 4);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${thursday.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function isoWeekToMonday(week: string): string {
  const [year, w] = week.split("-W");
  const yearNum = parseInt(year);
  const weekNum = parseInt(w);
  const jan4 = new Date(yearNum, 0, 4);
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1));
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (weekNum - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

export default function SyotaPage() {
  const router = useRouter();
  const [week, setWeek] = useState(currentIsoWeek());
  const [leads, setLeads] = useState("");
  const [firstMeetings, setFirstMeetings] = useState("");
  const [allMeetings, setAllMeetings] = useState("");
  const [deals, setDeals] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        period: isoWeekToMonday(week),
        leads: parseInt(leads) || 0,
        first_meetings: parseInt(firstMeetings) || 0,
        all_meetings: parseInt(allMeetings) || 0,
        deals: parseInt(deals) || 0,
        notes,
      }),
    });
    setLoading(false);
    if (!res.ok) { setError("Tallennus epäonnistui."); return; }
    router.push("/dashboard");
  }

  const fields = [
    { label: "Liidit", value: leads, set: setLeads },
    { label: "Ykköstapaamiset", value: firstMeetings, set: setFirstMeetings },
    { label: "Kaikki tapaamiset", value: allMeetings, set: setAllMeetings },
    { label: "Kaupat", value: deals, set: setDeals },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-mist px-6 py-4">
        <Link href="/dashboard" className="text-sm text-sage hover:text-navy transition-colors">← Takaisin</Link>
      </header>
      <main className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-xl font-bold text-navy mb-6">Syötä viikkoluvut</h1>
        <form onSubmit={handleSubmit} className="bg-white border border-mist p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-sage uppercase tracking-wider mb-1">Viikko</label>
            <input type="week" value={week} onChange={(e) => setWeek(e.target.value)} required
              className="w-full border border-mist px-3 py-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-navy" />
          </div>
          {fields.map((f) => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-sage uppercase tracking-wider mb-1">{f.label}</label>
              <input type="number" min="0" value={f.value} onChange={(e) => f.set(e.target.value)} placeholder="0"
                className="w-full border border-mist px-3 py-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-navy" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-sage uppercase tracking-wider mb-1">Muistiinpanot (vapaaehtoinen)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-mist px-3 py-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-navy" />
          </div>
          {error && <p className="text-sm text-[#9c3a3a]">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-navy text-white py-2.5 text-sm font-medium hover:bg-[#1a1f2e] disabled:opacity-50 transition-colors">
            {loading ? "Tallennetaan..." : "Tallenna"}
          </button>
        </form>
      </main>
    </div>
  );
}
