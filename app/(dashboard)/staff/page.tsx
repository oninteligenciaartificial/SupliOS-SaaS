"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import StaffTable from "./components/StaffTable";
import StaffFormModal from "./components/StaffFormModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

interface StaffMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: "MANAGER" | "STAFF" | "VIEWER";
  branchId: string | null;
  branch?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt?: string;
}

interface ApiResponse {
  data: StaffMember[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Omit<StaffMember, "userId"> | null>(null);

  const fetchStaff = async (p: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff?page=${p}&limit=${limit}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cargar staff");
      }
      const data: ApiResponse = await res.json();
      setStaff(data.data);
      setTotal(data.meta.total);
      setPage(data.meta.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff(page);
  }, [page, limit]);

  const handleAddStaff = async (data: { email: string; name: string; role: string; branchId?: string }) => {
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear staff");
      }

      setShowAddModal(false);
      fetchStaff(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleUpdateStaff = async (id: string, data: { role?: string; branchId?: string | null }) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar staff");
      }

      fetchStaff(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar staff");
      }

      setShowDeleteModal(false);
      setSelectedStaff(null);
      fetchStaff(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipo</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} miembros</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="glass-panel px-3 py-2 rounded-full flex items-center gap-1.5 text-xs text-brand-muted hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar miembro
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <StaffTable
        staff={staff}
        loading={loading}
        onEdit={(member) => {
          const { userId, ...rest } = member as StaffMember;
          setSelectedStaff(rest);
          setShowAddModal(true);
        }}
        onDelete={(member) => {
          const { userId, ...rest } = member as StaffMember;
          setSelectedStaff(rest);
          setShowDeleteModal(true);
        }}
        onUpdateRole={handleUpdateStaff}
      />

      {total > limit && (
        <div className="flex items-center justify-between text-sm">
          <div>
            Página {page} de {Math.ceil(total / limit)}
          </div>
          <div className="space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <StaffFormModal
          staff={selectedStaff}
          onSave={handleAddStaff}
          onClose={() => {
            setShowAddModal(false);
            setSelectedStaff(null);
          }}
        />
      )}

      {showDeleteModal && selectedStaff && (
        <DeleteConfirmModal
          name={selectedStaff.name}
          onConfirm={handleDeleteStaff}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedStaff(null);
          }}
        />
      )}
    </div>
  );
}
