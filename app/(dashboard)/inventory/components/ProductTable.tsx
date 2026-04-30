"use client";

import { Pencil, Trash2, Package, PackagePlus, Layers } from "lucide-react";
import type { BusinessUIConfig } from "@/lib/business-ui";
import { type Product, stockStatus } from "./types";

interface Props {
  products: Product[];
  loading: boolean;
  search: string;
  ui: BusinessUIConfig;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onStockEntry: (p: Product) => void;
}

export function ProductTable({ products, loading, search, ui, onEdit, onDelete, onStockEntry }: Props) {
  if (loading) {
    return <div className="py-16 text-center text-brand-muted">Cargando productos...</div>;
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-brand-muted space-y-3">
        <Package size={40} className="mx-auto opacity-30" />
        <p>{search ? `No hay ${ui.productPlural.toLowerCase()} que coincidan.` : ui.emptyStateMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="glass-panel rounded-3xl overflow-hidden animate-pop hidden md:block">
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
            {products.map((item) => {
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
                        <button onClick={() => onStockEntry(item)} className="text-brand-muted hover:text-brand-growth-neon transition-colors" title="Entrada de stock">
                          <PackagePlus size={16} />
                        </button>
                      )}
                      <button onClick={() => onEdit(item)} className="text-brand-muted hover:text-white transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => onDelete(item.id)} className="text-brand-muted hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 animate-pop">
        {products.map((item) => {
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
                    <button onClick={() => onStockEntry(item)} className="p-2 rounded-lg bg-white/5 text-brand-growth-neon hover:bg-white/10 transition-colors"><PackagePlus size={15} /></button>
                  )}
                  <button onClick={() => onEdit(item)} className="p-2 rounded-lg bg-white/5 text-brand-muted hover:text-white hover:bg-white/10 transition-colors"><Pencil size={15} /></button>
                  <button onClick={() => onDelete(item.id)} className="p-2 rounded-lg bg-white/5 text-brand-muted hover:text-red-400 hover:bg-white/10 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
