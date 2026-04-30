"use client";

import { useRef } from "react";
import { X, Layers, ChevronDown, ChevronUp, Trash2, ImageIcon } from "lucide-react";
import type { BusinessUIConfig } from "@/lib/business-ui";
import { type Category, type ProductForm, type VariantForm, type ProductVariant, inputCls, Field } from "./types";

interface Props {
  editing: boolean;
  form: ProductForm;
  categories: Category[];
  variants: ProductVariant[];
  showVariants: boolean;
  variantForm: VariantForm;
  variantAttrs: Record<string, string>;
  saving: boolean;
  savingVariant: boolean;
  uploadingImage: boolean;
  formError: string;
  variantError: string;
  attrKeys: string[];
  attrSchema: Record<string, string[]>;
  ui: BusinessUIConfig;
  onFormChange: (f: ProductForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAddVariant: (e: React.FormEvent) => void;
  onDeleteVariant: (id: string) => void;
  onVariantFormChange: (f: VariantForm) => void;
  onVariantAttrsChange: (a: Record<string, string>) => void;
  onShowVariantsToggle: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

export function ProductFormModal({
  editing, form, categories, variants, showVariants, variantForm, variantAttrs,
  saving, savingVariant, uploadingImage, formError, variantError,
  attrKeys, attrSchema, ui,
  onFormChange, onSubmit, onAddVariant, onDeleteVariant,
  onVariantFormChange, onVariantAttrsChange, onShowVariantsToggle,
  onImageUpload, onClose,
}: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
      <div className="glass-panel w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 space-y-5 sm:space-y-6 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-bold text-white">
            {editing ? `Editar ${ui.productSingular}` : `Nuevo ${ui.productSingular}`}
          </h2>
          <button onClick={onClose} className="text-brand-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label={`Nombre del ${ui.productSingular.toLowerCase()} *`}>
              <input required value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value })} className={inputCls} placeholder={ui.namePlaceholder} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={ui.skuLabel}>
                <input value={form.sku} onChange={(e) => onFormChange({ ...form, sku: e.target.value })} className={inputCls} placeholder="Ej: 001" />
              </Field>
              <Field label="Cód. barras">
                <input value={form.barcode} onChange={(e) => onFormChange({ ...form, barcode: e.target.value })} className={inputCls} placeholder="7501234..." />
              </Field>
            </div>

            <div className={`grid gap-3 ${ui.showUnit ? "grid-cols-2" : "grid-cols-1"}`}>
              {ui.showUnit && (
                <Field label={ui.unitLabel}>
                  <select value={form.unit} onChange={(e) => onFormChange({ ...form, unit: e.target.value })} className={inputCls}>
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
                <select value={form.categoryId} onChange={(e) => onFormChange({ ...form, categoryId: e.target.value })} className={inputCls}>
                  <option value="">Sin {ui.categoryLabel.toLowerCase()}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio venta *">
                <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => onFormChange({ ...form, price: e.target.value })} className={inputCls} placeholder="55.00" />
              </Field>
              <Field label="Costo">
                <input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => onFormChange({ ...form, cost: e.target.value })} className={inputCls} placeholder="30.00" />
              </Field>
            </div>

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
                  onClick={() => onFormChange({ ...form, hasVariants: !form.hasVariants })}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.hasVariants ? "bg-blue-500" : "bg-white/20"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.hasVariants ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            )}

            {!form.hasVariants && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stock actual">
                  <input required type="number" min="0" value={form.stock} onChange={(e) => onFormChange({ ...form, stock: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Stock minimo">
                  <input required type="number" min="0" value={form.minStock} onChange={(e) => onFormChange({ ...form, minStock: e.target.value })} className={inputCls} />
                </Field>
              </div>
            )}

            {form.hasVariants && (
              <Field label="Stock minimo total">
                <input required type="number" min="0" value={form.minStock} onChange={(e) => onFormChange({ ...form, minStock: e.target.value })} className={inputCls} />
              </Field>
            )}

            <div className={ui.showBatchExpiry ? "p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20" : ""}>
              <Field label={ui.showBatchExpiry ? "⚠ Fecha de vencimiento del lote *" : "Fecha vencimiento del lote"}>
                <input type="date" value={form.batchExpiry} onChange={(e) => onFormChange({ ...form, batchExpiry: e.target.value })} className={inputCls} />
              </Field>
              {ui.showBatchExpiry && <p className="text-xs text-yellow-500/70 mt-1.5">Obligatorio para control de vencimientos y alertas automáticas.</p>}
            </div>

            <Field label="Imagen del producto">
              <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onImageUpload} />
              <div className="space-y-2">
                {form.imageUrl ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-contain bg-white/5" />
                    <button
                      type="button"
                      onClick={() => onFormChange({ ...form, imageUrl: "" })}
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
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="text-xs text-white/40 hover:text-white/70 transition-colors">
                    Cambiar imagen
                  </button>
                )}
              </div>
            </Field>

            {formError && <p className="text-red-400 text-sm">{formError}</p>}

            <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold transition-opacity disabled:opacity-50">
              {saving ? "Guardando..." : editing ? "Guardar Cambios" : `Crear ${ui.productSingular}`}
            </button>
          </form>

          {editing && form.hasVariants && (
            <div className="border-t border-white/10 pt-4 space-y-3">
              <button onClick={onShowVariantsToggle} className="w-full flex items-center justify-between text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
                <span className="flex items-center gap-2"><Layers size={14} /> Gestionar variantes ({variants.length})</span>
                {showVariants ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showVariants && (
                <div className="space-y-3">
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
                          <button onClick={() => onDeleteVariant(v.id)} className="text-brand-muted hover:text-red-400 transition-colors flex-shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={onAddVariant} className="space-y-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Nueva variante</p>

                    {attrKeys.map((key) => {
                      const options = attrSchema[key];
                      return (
                        <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                          {options.length > 0 ? (
                            <select value={variantAttrs[key] ?? ""} onChange={(e) => onVariantAttrsChange({ ...variantAttrs, [key]: e.target.value })} className={inputCls}>
                              <option value="">Seleccionar...</option>
                              {options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              value={variantAttrs[key] ?? ""}
                              onChange={(e) => onVariantAttrsChange({ ...variantAttrs, [key]: e.target.value })}
                              className={inputCls}
                              placeholder={`Ej: ${key === "color" ? "Rojo" : key === "sabor" ? "Chocolate" : "..."}`}
                            />
                          )}
                        </Field>
                      );
                    })}

                    <div className="grid grid-cols-3 gap-2">
                      <Field label="Stock">
                        <input type="number" min="0" value={variantForm.stock} onChange={(e) => onVariantFormChange({ ...variantForm, stock: e.target.value })} className={inputCls} />
                      </Field>
                      <Field label="Precio (opcional)">
                        <input type="number" min="0" step="0.01" value={variantForm.price} onChange={(e) => onVariantFormChange({ ...variantForm, price: e.target.value })} className={inputCls} placeholder="—" />
                      </Field>
                      <Field label="SKU (opcional)">
                        <input value={variantForm.sku} onChange={(e) => onVariantFormChange({ ...variantForm, sku: e.target.value })} className={inputCls} placeholder="—" />
                      </Field>
                    </div>

                    {variantError && <p className="text-red-400 text-xs">{variantError}</p>}

                    <button type="submit" disabled={savingVariant} className="w-full py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50">
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
  );
}
