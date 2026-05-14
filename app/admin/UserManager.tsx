"use client";

import { useState } from "react";

type User = { id: string; name: string; email: string; role: string; created_at: string };

export function UserManager({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"myyja" | "johto">("myyja");
  const [newPassword, setNewPassword] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    setLoading(false);
    if (!res.ok) { setError("Käyttäjän luonti epäonnistui."); return; }
    const created = await res.json();
    setUsers(prev => [...prev, created]);
    setName(""); setEmail(""); setPassword(""); setRole("myyja");
  }

  async function handleDelete(id: string) {
    if (!confirm("Poistetaanko käyttäjä?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) { alert("Poisto epäonnistui."); return; }
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  async function handleResetPassword(id: string) {
    const pwd = newPassword[id];
    if (!pwd || pwd.length < 6) { alert("Salasanan on oltava vähintään 6 merkkiä."); return; }
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    });
    if (!res.ok) { alert("Salasanan vaihto epäonnistui."); return; }
    setNewPassword(prev => ({ ...prev, [id]: "" }));
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Käyttäjälista */}
      <div className="bg-white border border-mist overflow-hidden">
        <div className="px-5 py-4 border-b border-mist">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wide">Käyttäjät ({users.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-mist">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-sage uppercase tracking-wider">Nimi</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-sage uppercase tracking-wider">Sähköposti</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-sage uppercase tracking-wider">Rooli</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-sage uppercase tracking-wider">Uusi salasana</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-mist">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-cream/40">
                <td className="px-5 py-3 font-medium text-navy">{u.name}</td>
                <td className="px-5 py-3 text-sage">{u.email}</td>
                <td className="px-5 py-3">
                  <span className="text-xs bg-mist text-navy px-2 py-1 font-medium">
                    {u.role === "johto" ? "Johto" : "Myyjä"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Uusi salasana"
                      value={newPassword[u.id] ?? ""}
                      onChange={e => setNewPassword(prev => ({ ...prev, [u.id]: e.target.value }))}
                      className="border border-mist px-2 py-1 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-navy w-36"
                    />
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      className="text-xs text-sage hover:text-navy transition-colors whitespace-nowrap"
                    >
                      Vaihda
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-xs text-[#9c3a3a] hover:text-navy transition-colors"
                  >
                    Poista
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lisää käyttäjä */}
      <div className="bg-white border border-mist p-6">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wide mb-5">Lisää käyttäjä</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-sage uppercase tracking-wider mb-1">Nimi</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full border border-mist px-3 py-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-navy" />
            </div>
            <div>
              <label className="block text-xs font-medium text-sage uppercase tracking-wider mb-1">Sähköposti</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-mist px-3 py-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-navy" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-sage uppercase tracking-wider mb-1">Salasana</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full border border-mist px-3 py-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-navy" />
            </div>
            <div>
              <label className="block text-xs font-medium text-sage uppercase tracking-wider mb-1">Rooli</label>
              <select value={role} onChange={e => setRole(e.target.value as "myyja" | "johto")}
                className="w-full border border-mist px-3 py-2 text-sm text-navy focus:outline-none focus:ring-1 focus:ring-navy bg-white">
                <option value="myyja">Myyjä</option>
                <option value="johto">Johto</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-[#9c3a3a]">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-navy text-white py-2.5 text-sm font-medium hover:bg-[#1a1f2e] disabled:opacity-50 transition-colors">
            {loading ? "Luodaan..." : "Luo käyttäjä"}
          </button>
        </form>
      </div>
    </div>
  );
}
