"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Plus, X, Pencil, Trash2, Package, Upload, Download, PackagePlus, Layers, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { getBusinessSchema, type BusinessType } from "@/lib/business-types";
import { getBusinessUI } from "@/lib/business-ui";

interface Category { id: string; name: string }

interface ProductVariant {
  id: string;
  attributes: Record<string, string>;
  sku: string | null;
  stock: number;
  price: string | null;
}

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
  hasVariants: boolean;
  attributeSchema: Record<string, string[]> | null;
  category: { id: string; name: string } | null;
  variants?: ProductVariant[];
}

const EMPTY_FORM = {
  name: "", sku: "", barcode: "", unit: "", categoryId: "", price: "", cost: "",
  stock: "0", minStock: "5", batchExpiry: "", imageUrl: "",
  hasVariants: false,
};

const EMPTY_VARIANT = { sku: "", stock: "0", price: "" };

function stockStatus(stock: number, minStock: number, hasVariants: boolean) {
  if (hasVariants) return { label: "Variantes", cls: "bg-blue-500/20 text-blue-400" };
  if (stock <= minStock) return { label: "Critico", cls: "bg-red-500/20 text-red-400" };
  if (stock <= minStock * 2) return { label: "Bajo", cls: "bg-yellow-500/20 text-yellow-400" };
  return { label: "En Stock", cls: "bg-brand-growth-neon/20 text-brand-growth-neon" };
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businessType, setBusinessType] = useState<BusinessType>("GENERAL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Variant management state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT);
  const [variantAttrs, setVariantAttrs] = useState<Record<string, string>>({});
  const [savingVariant, setSavingVariant] = useState(false);
  const [variantError, setVariantError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stockEntry, setStockEntry] = useState<Product | null>(null);
  const [stockQty, setStockQty] = useState("1");
  const [stockSaving, setStockSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
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
    const [prodRes, catRes, meRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/categories"),
      fetch("/api/me"),
    ]);
    if (prodRes.ok) { const d = await prodRes.json(); setProducts(d.data ?? d); }
    if (catRes.ok) setCategories(await catRes.json());
    if (meRes.ok) {
      const me = await meRes.json();
      setBusinessType((me.organization?.businessType ?? "GENERAL") as BusinessType);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function fetchVariants(productId: string) {
    const res = await fetch(`/api/products/${productId}/variants`);
    if (res.ok) setVariants(await res.json());
  }

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
    setVariants([]);
    setShowVariants(false);
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
      hasVariants: product.hasVariants,
    });
    setFormError("");
    setVariants(product.variants ?? []);
    setShowVariants(product.hasVariants);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    const schema = getBusinessSchema(businessType);
    const body = {
      name: form.name,
      sku: form.sku || undefined,
      barcode: form.barcode || undefined,
      unit: form.unit || undefined,
      categoryId: form.categoryId || undefined,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost),
      stock: form.hasVariants ? 0 : parseInt(form.stock),
      minStock: parseInt(form.minStock),
      batchExpiry: form.batchExpiry || undefined,
      imageUrl: form.imageUrl || undefined,
      hasVariants: form.hasVariants,
      attributeSchema: form.hasVariants ? schema : undefined,
    };

    const res = editing
      ? await fetch(`/api/products/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (res.ok) {
      if (form.hasVariants) {
        const saved = await res.json();
        const productId = editing?.id ?? saved.id;
        await fetchVariants(productId);
        setEditing(prev => prev ? { ...prev, hasVariants: true } : { ...saved, hasVariants: true });
        setShowVariants(true);
        fetchData();
      } else {
        setShowModal(false);
        fetchData();
      }
    } else {
      const data = await res.json();
      setFormError(data.error ?? "Error al guardar");
    }
    setSaving(false);
  }

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSavingVariant(true);
    setVariantError("");

    const res = await fetch(`/api/products/${editing.id}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: variantAttrs,
        sku: variantForm.sku || undefined,
        stock: parseInt(variantForm.stock) || 0,
        price: variantForm.price ? parseFloat(variantForm.price) : undefined,
      }),
    });

    if (res.ok) {
      await fetchVariants(editing.id);
      setVariantForm(EMPTY_VARIANT);
      setVariantAttrs({});
    } else {
      const d = await res.json();
      setVariantError(d.error ?? "Error al guardar variante");
    }
    setSavingVariant(false);
  }

  async function handleDeleteVariant(variantId: string) {
    if (!editing) return;
    await fetch(`/api/products/${editing.id}/variants?variantId=${variantId}`, { method: "DELETE" });
    await fetchVariants(editing.id);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchData();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/products/upload-image", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json() as { url: string };
      setForm((f) => ({ ...f, imageUrl: url }));
    } else {
      const { error } = await res.json() as { error: string };
      setFormError(error ?? "Error al subir imagen");
    }
    setUploadingImage(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  const attrSchema = getBusinessSchema(businessType);
  const attrKeys = Object.keys(attrSchema);
  const ui = getBusinessUI(businessType);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5 md:space-y-8">
      <header className="animate-pop space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">{ui.pageTitle}</h1>
            <p className="text-brand-muted mt-1 text-sm">{ui.pageSubtitle}</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black px-4 md:px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] text-sm md:text-base flex-shrink-0"
          >
            <Plus size={16} /> <span className="hidden sm:inline">{ui.newButtonLabel}</span><span className="sm:hidden">Nuevo</span>
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
          placeholder={ui.searchPlaceholder}
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
                <th className="p-5 font-medium text-brand-muted">{ui.productSingular}</th>
                <th className="p-5 font-medium text-brand-muted">{ui.categoryLabel}</th>
                <th className="p-5 font-medium text-brand-muted">Precio</th>
                <th className="p-5 font-medium text-brand-muted">{ui.stockLabel}</th>
                <th className="p-5 font-medium text-brand-muted">Estado</th>
                <th className="p-5 font-medium text-brand-muted text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item) => {
                const status = stockStatus(item.stock, item.minStock, item.hasVariants);
                const totalVariantStock = item.hasVariants
                  ? (item.variants ?? []).reduce((s, v) => s + v.stock, 0)
                  : item.stock;
                return (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-5">
                      <div className="font-bold text-white flex items-center gap-2">
                        {item.name}
                        {item.hasVariants && <Layers size={13} className="text-blue-400 flex-shrink-0" />}
                      </div>
                      {item.sku && <div className="text-xs text-brand-muted mt-0.5">SKU: {item.sku}</div>}
                      {item.unit && <div className="text-xs text-brand-muted/60">{item.unit}</div>}
                    </td>
                    <td className="p-5 text-gray-400">{item.category?.name ?? "—"}</td>
                    <td className="p-5 text-gray-300 font-mono">${Number(item.price).toFixed(2)}</td>
                    <td className="p-5 text-white font-display font-medium">
                      {item.hasVariants ? `${totalVariantStock} (${(item.variants ?? []).length} var.)` : item.stock}
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${status.cls}`}>{status.label}</span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {!item.hasVariants && (
                          <button onClick={() => { setStockEntry(item); setStockQty("1"); }} className="text-brand-muted hover:text-brand-growth-neon transition-colors" title="Entrada de stock"><PackagePlus size={16} /></button>
                        )}
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
            <p>{search ? `No hay ${ui.productPlural.toLowerCase()} que coincidan.` : ui.emptyStateMessage}</p>
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
            <p>{search ? `No hay ${ui.productPlural.toLowerCase()} que coincidan.` : ui.emptyStateMessage}</p>
          </div>
        ) : filtered.map((item) => {
          const status = stockStatus(item.stock, item.minStock, item.hasVariants);
          const totalVariantStock = item.hasVariants ? (item.variants ?? []).reduce((s, v) => s + v.stock, 0) : item.stock;
          return (
            <div key={item.id} className="glass-panel rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate flex items-center gap-2">
                    {item.name}
                    {item.hasVariants && <Layers size={12} className="text-blue-400 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {item.sku && <span className="text-xs text-brand-muted font-mono">SKU: {item.sku}</span>}
                    {item.category && <span className="text-xs text-brand-muted/70">{item.category.name}</span>}
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
                    <div className="font-bold text-white">{item.hasVariants ? `${totalVariantStock} total` : `${item.stock} ${item.unit ?? "uds"}`}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!item.hasVariants && (
                    <button onClick={() => { setStockEntry(item); setStockQty("1"); }} className="p-2 rounded-lg bg-white/5 text-brand-growth-neon hover:bg-white/10 transition-colors"><PackagePlus size={15} /></button>
                  )}
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
                {editing ? `Editar ${ui.productSingular}` : `Nuevo ${ui.productSingular}`}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              <form onSubmit={handleSave} className="space-y-4">
                <Field label={`Nombre del ${ui.productSingular.toLowerCase()} *`}>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder={ui.namePlaceholder} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={ui.skuLabel}>
                    <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={input} placeholder="Ej: 001" />
                  </Field>
                  <Field label="Cód. barras">
                    <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className={input} placeholder="7501234..." />
                  </Field>
                </div>

                <div className={`grid gap-3 ${ui.showUnit ? "grid-cols-2" : "grid-cols-1"}`}>
                  {ui.showUnit && (
                    <Field label={ui.unitLabel}>
                      <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={input}>
                        <option value="">Sin especificar</option>
                        <option value="pieza">Pieza</option>
                        <option value="kg">Kilogramo (kg)</option>
                        <option value="g">Gramo (g)</option>
                        <option value="litro">Litro</option>
                        <option value="ml">Mililitro (ml)</option>
                        <option value="capsula">Cápsula</option>
                        <option value="tableta">Tableta</option>
                        <option value="sobre">Sobre</option>
                        <option value="frasco">Frasco</option>
                        <option value="metro">Metro</option>
                        <option value="rollo">Rollo</option>
                        <option value="par">Par</option>
                      </select>
                    </Field>
                  )}
                  <Field label={ui.categoryLabel}>
                    <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={input}>
                      <option value="">Sin {ui.categoryLabel.toLowerCase()}</option>
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

                {/* Variantes toggle — solo si el tipo de negocio las soporta */}
                {attrKeys.length > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <Layers size={15} className="text-blue-400" />
                      <div>
                        <p className="text-sm text-white font-medium">{ui.variantLabel}</p>
                        <p className="text-xs text-brand-muted">{ui.posVariantHint}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, hasVariants: !form.hasVariants })}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.hasVariants ? "bg-blue-500" : "bg-white/20"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.hasVariants ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                )}

                {/* Stock — solo si no tiene variantes */}
                {!form.hasVariants && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Stock actual">
                      <input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={input} />
                    </Field>
                    <Field label="Stock minimo">
                      <input required type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className={input} />
                    </Field>
                  </div>
                )}

                {form.hasVariants && (
                  <div className="grid grid-cols-1 gap-3">
                    <Field label="Stock minimo total">
                      <input required type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className={input} />
                    </Field>
                  </div>
                )}

                {/* Vencimiento — siempre disponible, destacado para FARMACIA/SUPLEMENTOS */}
                <div className={ui.showBatchExpiry ? "p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20" : ""}>
                  <Field label={ui.showBatchExpiry ? "⚠ Fecha de vencimiento del lote *" : "Fecha vencimiento del lote"}>
                    <input type="date" value={form.batchExpiry} onChange={(e) => setForm({ ...form, batchExpiry: e.target.value })} className={input} />
                  </Field>
                  {ui.showBatchExpiry && <p className="text-xs text-yellow-500/70 mt-1.5">Obligatorio para control de vencimientos y alertas automáticas.</p>}
                </div>

                <Field label="Imagen del producto">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="space-y-2">
                    {form.imageUrl ? (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.imageUrl} alt="Preview" className="w-full h-full object-contain bg-white/5" />
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-red-500/80 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-full h-28 rounded-xl border border-dashed border-white/20 hover:border-white/40 flex flex-col items-center justify-center gap-2 text-white/50 hover:text-white/70 transition-colors disabled:opacity-50"
                      >
                        {uploadingImage ? (
                          <span className="text-sm">Subiendo...</span>
                        ) : (
                          <>
                            <ImageIcon size={24} />
                            <span className="text-sm">Subir imagen (JPG, PNG, WebP)</span>
                            <span className="text-xs">máx 5 MB</span>
                          </>
                        )}
                      </button>
                    )}
                    {form.imageUrl && !uploadingImage && (
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="text-xs text-white/40 hover:text-white/70 transition-colors"
                      >
                        Cambiar imagen
                      </button>
                    )}
                  </div>
                </Field>

                {formError && <p className="text-red-400 text-sm">{formError}</p>}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold transition-opacity disabled:opacity-50"
                >
                  {saving ? "Guardando..." : editing ? "Guardar Cambios" : `Crear ${ui.productSingular}`}
                </button>
              </form>

              {/* Panel de variantes — solo cuando editando un producto con hasVariants */}
              {editing && form.hasVariants && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <button
                    onClick={() => setShowVariants(!showVariants)}
                    className="w-full flex items-center justify-between text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span className="flex items-center gap-2"><Layers size={14} /> Gestionar variantes ({variants.length})</span>
                    {showVariants ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showVariants && (
                    <div className="space-y-3">
                      {/* Lista de variantes existentes */}
                      {variants.length > 0 && (
                        <div className="space-y-2">
                          {variants.map((v) => (
                            <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 gap-2">
                              <div className="min-w-0">
                                <p className="text-sm text-white font-medium">
                                  {Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(" · ")}
                                </p>
                                <p className="text-xs text-brand-muted">
                                  Stock: {v.stock}
                                  {v.price && ` · $${Number(v.price).toFixed(2)}`}
                                  {v.sku && ` · ${v.sku}`}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteVariant(v.id)}
                                className="text-brand-muted hover:text-red-400 transition-colors flex-shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Form nueva variante */}
                      <form onSubmit={handleAddVariant} className="space-y-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Nueva variante</p>

                        {/* Atributos dinámicos según tipo de negocio */}
                        {attrKeys.map((key) => {
                          const options = attrSchema[key];
                          return (
                            <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                              {options.length > 0 ? (
                                <select
                                  value={variantAttrs[key] ?? ""}
                                  onChange={(e) => setVariantAttrs({ ...variantAttrs, [key]: e.target.value })}
                                  className={input}
                                >
                                  <option value="">Seleccionar...</option>
                                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input
                                  value={variantAttrs[key] ?? ""}
                                  onChange={(e) => setVariantAttrs({ ...variantAttrs, [key]: e.target.value })}
                                  className={input}
                                  placeholder={`Ej: ${key === "color" ? "Rojo" : key === "sabor" ? "Chocolate" : "..."}`}
                                />
                              )}
                            </Field>
                          );
                        })}

                        <div className="grid grid-cols-3 gap-2">
                          <Field label="Stock">
                            <input type="number" min="0" value={variantForm.stock} onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })} className={input} />
                          </Field>
                          <Field label="Precio (opcional)">
                            <input type="number" min="0" step="0.01" value={variantForm.price} onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })} className={input} placeholder="—" />
                          </Field>
                          <Field label="SKU (opcional)">
                            <input value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} className={input} placeholder="—" />
                          </Field>
                        </div>

                        {variantError && <p className="text-red-400 text-xs">{variantError}</p>}

                        <button
                          type="submit"
                          disabled={savingVariant}
                          className="w-full py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                        >
                          {savingVariant ? "Guardando..." : "+ Agregar variante"}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
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
              <h2 className="text-xl font-bold text-white">Eliminar {ui.productSingular.toLowerCase()}</h2>
              <p className="text-brand-muted mt-2">{ui.productSingular} se desactivará del inventario.</p>
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
