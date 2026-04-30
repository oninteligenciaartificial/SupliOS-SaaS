export interface Category { id: string; name: string }

export interface ProductVariant {
  id: string;
  attributes: Record<string, string>;
  sku: string | null;
  stock: number;
  price: string | null;
}

export interface Product {
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

export const EMPTY_FORM = {
  name: "", sku: "", barcode: "", unit: "", categoryId: "", price: "", cost: "",
  stock: "0", minStock: "5", batchExpiry: "", imageUrl: "",
  hasVariants: false,
};

export const EMPTY_VARIANT = { sku: "", stock: "0", price: "" };

export type ProductForm = typeof EMPTY_FORM;
export type VariantForm = typeof EMPTY_VARIANT;

export const inputCls = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-brand-muted">{label}</label>
      {children}
    </div>
  );
}

export function stockStatus(stock: number, minStock: number, hasVariants: boolean) {
  if (hasVariants) return { label: "Variantes", cls: "bg-blue-500/20 text-blue-400" };
  if (stock <= minStock) return { label: "Critico", cls: "bg-red-500/20 text-red-400" };
  if (stock <= minStock * 2) return { label: "Bajo", cls: "bg-yellow-500/20 text-yellow-400" };
  return { label: "En Stock", cls: "bg-brand-growth-neon/20 text-brand-growth-neon" };
}
