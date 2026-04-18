"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  role: "ADMIN" | "STAFF";
  createdAt: string;
  organization: { name: string } | null;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/superadmin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.organization?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="animate-pop">
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">Usuarios</h1>
        <p className="text-brand-muted mt-1">Todos los usuarios en la plataforma</p>
      </header>

      <div className="relative animate-pop">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre u organizacion..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors"
        />
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden animate-pop">
        {loading ? (
          <div className="py-16 text-center text-brand-muted">Cargando...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-5 text-brand-muted font-medium">Usuario</th>
                <th className="p-5 text-brand-muted font-medium">Rol</th>
                <th className="p-5 text-brand-muted font-medium">Organizacion</th>
                <th className="p-5 text-brand-muted font-medium">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-white">{u.name}</div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === "ADMIN" ? "bg-brand-kinetic-orange/15 text-brand-kinetic-orange" : "bg-white/10 text-brand-muted"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-5 text-white text-sm">{u.organization?.name ?? <span className="text-brand-muted">—</span>}</td>
                  <td className="p-5 text-brand-muted text-sm">{new Date(u.createdAt).toLocaleDateString("es-MX")}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-brand-muted">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p>{search ? "No se encontraron usuarios." : "No hay usuarios aun."}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-right text-brand-muted text-sm animate-pop">
        {filtered.length} de {users.length} usuarios
      </div>
    </div>
  );
}
