"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Väärä sähköposti tai salasana.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="w-full max-w-sm bg-white border border-mist p-8">
        <h1 className="text-2xl font-bold text-navy mb-1">Kylätimpuri</h1>
        <p className="text-sm text-sage mb-8">Myyntianalytiikka — kirjaudu sisään</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-sage uppercase tracking-wider mb-1">Sähköposti</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full border border-mist px-3 py-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-navy" />
          </div>
          <div>
            <label className="block text-xs font-medium text-sage uppercase tracking-wider mb-1">Salasana</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full border border-mist px-3 py-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-navy" />
          </div>
          {error && <p className="text-sm text-[#9c3a3a]">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-navy text-white py-2.5 text-sm font-medium hover:bg-[#1a1f2e] disabled:opacity-50 transition-colors">
            {loading ? "Kirjaudutaan..." : "Kirjaudu sisään"}
          </button>
        </form>
      </div>
    </div>
  );
}
