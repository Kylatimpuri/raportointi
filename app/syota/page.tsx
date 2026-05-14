"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CURRENT_PERIOD = new Date().toISOString().slice(0, 7);

export default function SyotaPage() {
  const router = useRouter();
  const [period, setPeriod] = useState(CURRENT_PERIOD);
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
        period: `${period}-01`,
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
        <h1 className="text-xl font-bold text-navy mb-6">Syötä kuukausiluvut</h1>
        <form onSubmit={handleSubmit} className="bg-white border border-mist p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-sage uppercase tracking-wider mb-1">Kuukausi</label>
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} required
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
