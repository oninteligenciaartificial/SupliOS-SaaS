"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: "MANAGER" | "STAFF" | "VIEWER";
  branch?: { id: string; name: string } | null;
  createdAt: string;
}

interface Props {
  staff: StaffMember[];
  loading: boolean;
  onEdit: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
  onUpdateRole: (id: string, data: { role?: string }) => void;
}

const roleLabels = {
  MANAGER: "Gerente",
  STAFF: "Personal",
  VIEWER: "Visor",
};

export default function StaffTable({ staff, loading, onEdit, onDelete, onUpdateRole }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (loading && staff.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Cargando...</div>;
  }

  if (!staff.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay miembros del equipo
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Rol</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Sucursal</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {staff.map((member) => (
            <tr key={member.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 font-medium">{member.name}</td>
              <td className="px-6 py-4 text-sm text-muted-foreground">{member.email}</td>
              <td className="px-6 py-4">
                <select
                  value={member.role}
                  onChange={(e) => {
                    setUpdatingId(member.id);
                    onUpdateRole(member.id, { role: e.target.value });
                    setUpdatingId(null);
                  }}
                  className="text-sm px-2 py-1 rounded border"
                  disabled={updatingId === member.id}
                >
                  <option value="VIEWER">Visor</option>
                  <option value="STAFF">Personal</option>
                  <option value="MANAGER">Gerente</option>
                </select>
              </td>
              <td className="px-6 py-4 text-sm">
                {member.branch?.name || "—"}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onDelete(member)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
