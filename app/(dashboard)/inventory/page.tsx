"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, X, Pencil, Trash2, Package, Upload, Download, PackagePlus } from "lucide-react";
import { useRef } from "react";

interface Category { id: string; name: string }
interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  price: string;
  cost: string;
  stock: number;
  minStock: number;
  batchExpiry: string | null;
  imageUrl: string | null;
  active: boolean;
  category: { id: string; name: string } | null;
}

const EMPTY_FORM = {
  name: "", sku: "", barcode: "", unit: "", categoryId: "", price: "", cost: "",
  stock: "0", minStock: "5", batchExpiry: "", imageUrl: "",
};

function stockStatus(stock: number, minStock: number) {
  if (stock <= minStock) return { label: "Critico", cls: "bg-red-500/20 text-red-400" };
  if (stock <= minStock * 2) return { label: "Bajo", cls: "bg-yellow-500/20 text-yellow-400" };
  return { label: "En Stock", cls: "bg-brand-growth-neon/20 text-brand-growth-neon" };
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stockEntry, setStockEntry] = useState<Product | null>(null);
  const [stockQty, setStockQty] = useState("1");
  const [stockSaving, setStockSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/products/import", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setImportMsg(`${data.created} productos importados.${data.errors.length ? ` ${data.errors.length} errores.` : ""}`);
      fetchData();
    } else {
      setImportMsg(data.error ?? "Error al importar");
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadTemplate() {
    const csv = "nombre,precio,costo,stock,stock_minimo,sku,categoria\nEjemplo Producto,100,60,50,5,SKU001,Suplementos\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_productos.csv";
    a.click();
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/categories"),
    ]);
    if (prodRes.ok) { const d = await prodRes.json(); setProducts(d.data ?? d); }
    if (catRes.ok) setCategories(await catRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleStockEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!stockEntry) return;
    setStockSaving(true);
    await fetch("/api/products/stock-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: stockEntry.id, quantity: Number(stockQty) }),
    });
    setStockEntry(null);
    setStockQty("1");
    setStockSaving(false);
    fetchData();
  }

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku ?? "",
      barcode: product.barcode ?? "",
      unit: product.unit ?? "",
      categoryId: product.category?.id ?? "",
      price: String(product.price),
      cost: String(product.cost),
      stock: String(product.stock),
      minStock: String(product.minStock),
      batchExpiry: product.batchExpiry ? product.batchExpiry.split("T")[0] : "",
      imageUrl: product.imageUrl ?? "",
    });
    setFormError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    const body = {
      name: form.name,
      sku: form.sku || undefined,
      barcode: form.barcode || undefined,
      unit: form.unit || undefined,
      categoryId: form.categoryId || undefined,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost),
      stock: parseInt(form.stock),
      minStock: parseInt(form.minStock),
      batchExpiry: form.batchExpiry || undefined,
      imageUrl: form.imageUrl || undefined,
    };

    const res = editing
      ? await fetch(`/api/products/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (res.ok) {
      setShowModal(false);
      fetchData();
    } else {
      const data = await res.json();
      setFormError(data.error ?? "Error al guardar");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchData();
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5 md:space-y-8">
      <header className="animate-pop space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">Inventario</h1>
            <p className="text-brand-muted mt-1 text-sm">Gestion de productos y alertas de stock</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-4 md:px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] text-sm md:text-base flex-shrink-0"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nuevo</span><span className="hidden md:inline"> Producto</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="glass-panel px-3 py-2 rounded-full flex items-center gap-1.5 text-xs text-brand-muted hover:text-white transition-colors">
            <Download size={13} /> <span className="hidden sm:inline">Plantilla</span>
          </button>
          <label className={`px-3 py-2 rounded-full flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors ${importing ? "opacity-50 cursor-not-allowed" : "glass-panel text-brand-growth-neon hover:bg-white/10"}`}>
            <Upload size={13} />
            {importing ? "Importando..." : <><span className="hidden sm:inline">Importar Excel</span><span className="sm:hidden">Importar</span></>}
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
        </div>
      </header>
      {importMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm ${importMsg.includes("Error") || importMsg.includes("error") ? "bg-red-500/10 text-red-400" : "bg-brand-growth-neon/10 text-brand-growth-neon"}`}>
          {importMsg}
        </div>
      )}

      <div className="relative animate-pop">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          className="w-full bg-brand-surface-highest/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-kinetic-orange transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Desktop: tabla */}
      <div className="glass-panel rounded-3xl overflow-hidden animate-pop hidden md:block">
        {loading ? (
          <div className="py-16 text-center text-brand-muted">Cargando productos...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-5 font-medium text-brand-muted">Producto</th>
                <th className="p-5 font-medium text-brand-muted">Categoria</th>
                <th className="p-5 font-medium text-brand-muted">Precio</th>
                <th className="p-5 font-medium text-brand-muted">Stock</th>
                <th className="p-5 font-medium text-brand-muted">Estado</th>
                <th className="p-5 font-medium text-brand-muted text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item) => {
                const status = stockStatus(item.stock, item.minStock);
                return (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-5">
                      <div className="font-bold text-white">{item.name}</div>
                      {item.sku && <div className="text-xs text-brand-muted mt-0.5">SKU: {item.sku}</div>}
                      {item.unit && <div className="text-xs text-brand-muted/60">{item.unit}</div>}
                    </td>
                    <td className="p-5 text-gray-400">{item.category?.name ?? "—"}</td>
                    <td className="p-5 text-gray-300 font-mono">${Number(item.price).toFixed(2)}</td>
                    <td className="p-5 text-white font-display font-medium">{item.stock}</td>
                    <td className="p-5">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${status.cls}`}>{status.label}</span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => { setStockEntry(item); setStockQty("1"); }} className="text-brand-muted hover:text-brand-growth-neon transition-colors" title="Entrada de stock"><PackagePlus size={16} /></button>
                        <button onClick={() => openEdit(item)} className="text-brand-muted hover:text-white transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => setDeleteId(item.id)} className="text-brand-muted hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-brand-muted space-y-3">
            <Package size={40} className="mx-auto opacity-30" />
            <p>{search ? "No hay productos que coincidan." : "Aun no tienes productos. Crea el primero."}</p>
          </div>
        )}
      </div>

      {/* Mobile: tarjetas */}
      <div className="md:hidden space-y-3 animate-pop">
        {loading ? (
          <div className="py-16 text-center text-brand-muted">Cargando productos...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-brand-muted space-y-3">
            <Package size={40} className="mx-auto opacity-30" />
            <p>{search ? "No hay productos que coincidan." : "Aun no tienes productos."}</p>
          </div>
        ) : filtered.map((item) => {
          const status = stockStatus(item.stock, item.minStock);
          return (
            <div key={item.id} className="glass-panel rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{item.name}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {item.sku && <span className="text-xs text-brand-muted font-mono">SKU: {item.sku}</span>}
                    {item.category && <span className="text-xs text-brand-muted/70">{item.category.name}</span>}
                    {item.unit && <span className="text-xs text-brand-muted/60">{item.unit}</span>}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${status.cls}`}>{status.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div>
                    <div className="text-xs text-brand-muted">Precio</div>
                    <div className="font-bold text-brand-kinetic-orange">${Number(item.price).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-brand-muted">Stock</div>
                    <div className="font-bold text-white">{item.stock} {item.unit ?? "uds"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setStockEntry(item); setStockQty("1"); }} className="p-2 rounded-lg bg-white/5 text-brand-growth-neon hover:bg-white/10 transition-colors"><PackagePlus size={15} /></button>
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg bg-white/5 text-brand-muted hover:text-white hover:bg-white/10 transition-colors"><Pencil size={15} /></button>
                  <button onClick={() => setDeleteId(item.id)} className="p-2 rounded-lg bg-white/5 text-brand-muted hover:text-red-400 hover:bg-white/10 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal crear / editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
          <div className="glass-panel w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 space-y-5 sm:space-y-6 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">
                {editing ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <Field label="Nombre *">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="Whey Protein 100%" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="SKU">
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={input} placeholder="WP-100" />
                </Field>
                <Field label="Cod. barras">
                  <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className={input} placeholder="7501234..." />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Unidad">
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={input}>
                    <option value="">Sin especificar</option>
                    <option value="pieza">Pieza</option>
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="g">Gramo (g)</option>
                    <option value="litro">Litro</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="capsula">Capsula</option>
                    <option value="tableta">Tableta</option>
                    <option value="sobre">Sobre</option>
                    <option value="frasco">Frasco</option>
                  </select>
                </Field>
                <Field label="Categoria">
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={input}>
                    <option value="">Sin categoria</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Precio venta *">
                  <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} placeholder="55.00" />
                </Field>
                <Field label="Costo">
                  <input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className={input} placeholder="30.00" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Stock actual">
                  <input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={input} />
                </Field>
                <Field label="Stock minimo">
                  <input required type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className={input} />
                </Field>
              </div>

              <Field label="Fecha vencimiento del lote">
                <input type="date" value={form.batchExpiry} onChange={(e) => setForm({ ...form, batchExpiry: e.target.value })} className={input} />
              </Field>

              <Field label="URL de imagen">
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className={input} placeholder="https://..." />
              </Field>

              {formError && <p className="text-red-400 text-sm">{formError}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold transition-opacity disabled:opacity-50"
              >
                {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Crear Producto"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Entrada de stock */}
      {stockEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-display font-bold text-white">Entrada de Stock</h2>
                <p className="text-xs text-brand-muted mt-0.5 truncate">{stockEntry.name}</p>
              </div>
              <button onClick={() => setStockEntry(null)} className="text-brand-muted hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="p-4 rounded-xl bg-white/5 text-center">
              <div className="text-brand-muted text-xs mb-1">Stock actual</div>
              <div className="text-3xl font-display font-bold text-white">{stockEntry.stock}</div>
            </div>
            <form onSubmit={handleStockEntry} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-brand-muted">Cantidad a ingresar *</label>
                <input
                  required type="number" min="1" value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-2xl font-bold text-center focus:outline-none focus:border-brand-growth-neon transition-colors"
                />
              </div>
              <div className="p-3 rounded-xl bg-brand-growth-neon/10 border border-brand-growth-neon/20 text-center">
                <span className="text-brand-growth-neon text-sm">Stock resultante: <strong>{stockEntry.stock + Number(stockQty || 0)}</strong></span>
              </div>
              <button type="submit" disabled={stockSaving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-growth-neon to-emerald-400 text-black font-bold disabled:opacity-50">
                {stockSaving ? "Guardando..." : "Registrar Entrada"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmacion eliminar */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-8 space-y-6 text-center">
            <div className="text-red-400"><Trash2 size={40} className="mx-auto" /></div>
            <div>
              <h2 className="text-xl font-bold text-white">Eliminar producto</h2>
              <p className="text-brand-muted mt-2">El producto se desactivara del inventario.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const input = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-brand-muted">{label}</label>
      {children}
    </div>
  );
}
