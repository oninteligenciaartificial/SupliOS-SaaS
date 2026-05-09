"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getBusinessUI } from "@/lib/business-ui";
import type { BusinessType } from "@/lib/business-types";
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, X, Tag, Star, Banknote, CreditCard, Landmark, Phone, User, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { canUseFeature, canUseAddon } from "@/lib/plans";
import type { PlanType, AddonType } from "@/lib/plans";

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
  price: string;
  stock: number;
  minStock: number;
  sku: string | null;
  barcode: string | null;
  category: { name: string } | null;
  hasVariants: boolean;
  variants?: ProductVariant[];
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  loyaltyPoints: number;
}

interface Discount {
  id: string;
  code: string;
  type: "PORCENTAJE" | "MONTO_FIJO";
  value: string;
  active: boolean;
  expiresAt: string | null;
}

interface CartItem {
  product: Product;
  qty: number;
  variantId?: string;
  variantLabel?: string;
  effectivePrice: number;
}

function fmt(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function cartKey(item: CartItem) {
  return item.variantId ? `${item.product.id}__${item.variantId}` : item.product.id;
}

export default function NuevaVentaPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TARJETA" | "TRANSFERENCIA">("EFECTIVO");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [selling, setSelling] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [variantTarget, setVariantTarget] = useState<Product | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [businessType, setBusinessType] = useState<BusinessType>("GENERAL");
  const [activeAddons, setActiveAddons] = useState<AddonType[]>([]);
  const [orgPlan, setOrgPlan] = useState<PlanType>("BASICO");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const customerSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [pRes, dRes, meRes] = await Promise.all([
      fetch("/api/products?limit=200"),
      fetch("/api/discounts"),
      fetch("/api/me"),
    ]);
    if (pRes.ok) { const d = await pRes.json(); setProducts(d.data ?? d); }
    if (dRes.ok) setDiscounts(await dRes.json());
    if (meRes.ok) {
      const me = await meRes.json();
      setBusinessType((me.organization?.businessType ?? "GENERAL") as BusinessType);
      setOrgPlan((me.organization?.plan ?? "BASICO") as PlanType);
      setActiveAddons((me.activeAddons ?? []) as AddonType[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function searchCustomers(q: string) {
    setCustomerSearch(q);
    if (customerSearchRef.current) clearTimeout(customerSearchRef.current);
    if (!q.trim()) { setCustomerResults([]); return; }
    customerSearchRef.current = setTimeout(async () => {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}&limit=5`);
      if (res.ok) { const d = await res.json(); setCustomerResults(d.data ?? []); }
    }, 300);
  }

  function selectCustomer(c: Customer) {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setCustomerResults([]);
    setPointsToRedeem(0);
    setCustomerName(c.name);
  }

  function clearCustomer() {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setCustomerResults([]);
    setPointsToRedeem(0);
  }

  const categories = Array.from(new Set(products.map((p) => p.category?.name ?? "Sin categoria"))).sort();

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q) ||
      (p.barcode ?? "").toLowerCase().includes(q);
    const matchCat = !categoryFilter || (p.category?.name ?? "Sin categoria") === categoryFilter;
    return matchSearch && matchCat;
  });

  function addToCart(product: Product) {
    if (product.hasVariants) {
      setVariantTarget(product);
      return;
    }
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && !i.variantId);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((i) => i.product.id === product.id && !i.variantId ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product, qty: 1, effectivePrice: Number(product.price) }];
    });
  }

  function addVariantToCart(product: Product, variant: ProductVariant) {
    setVariantTarget(null);
    if (variant.stock <= 0) return;
    const effectivePrice = variant.price ? Number(variant.price) : Number(product.price);
    const label = Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ");
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) {
        if (existing.qty >= variant.stock) return prev;
        return prev.map((i) => i.variantId === variant.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product, qty: 1, variantId: variant.id, variantLabel: label, effectivePrice }];
    });
  }

  function updateQty(key: string, delta: number) {
    setCart((prev) =>
      prev.flatMap((i) => {
        if (cartKey(i) !== key) return [i];
        const cap = i.variantId
          ? (i.product.variants?.find((v) => v.id === i.variantId)?.stock ?? Infinity)
          : i.product.stock;
        const newQty = i.qty + delta;
        if (newQty <= 0) return [];
        if (newQty > cap) return [i];
        return [{ ...i, qty: newQty }];
      })
    );
  }

  function removeFromCart(key: string) {
    setCart((prev) => prev.filter((i) => cartKey(i) !== key));
  }

  const subtotal = cart.reduce((s, i) => s + i.qty * i.effectivePrice, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const POINTS_TO_BOB = 0.1;
  const maxRedeemable = selectedCustomer ? selectedCustomer.loyaltyPoints : 0;
  const pointsDiscount = Math.min(pointsToRedeem * POINTS_TO_BOB, subtotal);

  function applyDiscount() {
    setDiscountError("");
    const code = discountCode.trim().toUpperCase();
    const d = discounts.find((d) => d.code === code && d.active);
    if (!d) { setDiscountError("Codigo no valido o inactivo"); return; }
    if (d.expiresAt && new Date(d.expiresAt) < new Date()) { setDiscountError("Este codigo ha vencido"); return; }
    setAppliedDiscount(d);
  }

  function removeDiscount() {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  }

  const discountAmount = appliedDiscount
    ? appliedDiscount.type === "PORCENTAJE"
      ? subtotal * (Number(appliedDiscount.value) / 100)
      : Math.min(Number(appliedDiscount.value), subtotal)
    : 0;

  const total = Math.max(0, subtotal - discountAmount - pointsDiscount);

  async function handleSell() {
    if (cart.length === 0) return;
    setSelling(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: customerName.trim() || (selectedCustomer?.name ?? "Cliente mostrador"),
        customerId: selectedCustomer?.id,
        paymentMethod,
        loyaltyPointsRedeemed: pointsToRedeem > 0 ? pointsToRedeem : undefined,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.qty,
          unitPrice: i.effectivePrice,
          ...(i.variantId ? {
            variantId: i.variantId,
            variantSnapshot: {
              label: i.variantLabel,
              attributes: i.product.variants?.find((v) => v.id === i.variantId)?.attributes,
            },
          } : {}),
        })),
        notes: [
          appliedDiscount ? `Descuento: ${appliedDiscount.code} (-Bs.${fmt(discountAmount)})` : null,
          notes.trim() || null,
        ].filter(Boolean).join(" | ") || undefined,
      }),
    });
    setSelling(false);
    if (res.ok) {
      const order = await res.json() as { id: string };
      setSuccess(order.id);
      setCart([]);
      setCustomerName("");
      setAppliedDiscount(null);
      setDiscountCode("");
      setPointsToRedeem(0);
      setNotes("");
      clearCustomer();
      fetchData();
    }
  }

  const ui = getBusinessUI(businessType);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel max-w-md w-full rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-brand-growth-neon/20 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-brand-growth-neon" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Venta registrada</h2>
            <p className="text-brand-muted mt-1">La venta se ha procesado correctamente</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">ID Pedido</span>
              <span className="text-white font-mono text-xs">{success.slice(-8)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Total</span>
              <span className="text-brand-kinetic-orange font-bold">Bs. {fmt(total)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setSuccess(null); }}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
            >
              Nueva venta
            </button>
            <button
              onClick={() => router.push("/orders")}
              className="flex-1 py-3 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-medium hover:opacity-90 transition-opacity"
            >
              Ver pedidos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-0px)] flex flex-col lg:flex-row">
      {/* Variant selector modal */}
      {variantTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">{variantTarget.name}</h3>
                <p className="text-xs text-brand-muted mt-0.5">{ui.posVariantHint}</p>
              </div>
              <button onClick={() => setVariantTarget(null)} className="text-brand-muted hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(variantTarget.variants ?? []).length === 0 ? (
                <p className="text-center text-brand-muted text-sm py-4">Sin variantes configuradas. Agrégalas en Inventario.</p>
              ) : (
                <>
                  {(variantTarget.variants ?? []).filter((v) => v.stock > 0).map((v) => {
                    const label = Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(" · ");
                    const price = v.price ? Number(v.price) : Number(variantTarget.price);
                    return (
                      <button
                        key={v.id}
                        onClick={() => addVariantToCart(variantTarget, v)}
                        className="w-full flex justify-between items-center px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                      >
                        <div>
                          <span className="text-sm text-white">{label}</span>
                          <span className="block text-xs text-brand-muted">Stock: {v.stock}</span>
                        </div>
                        <span className="text-sm font-bold text-brand-kinetic-orange">Bs. {fmt(price)}</span>
                      </button>
                    );
                  })}
                  {(variantTarget.variants ?? []).filter((v) => v.stock <= 0).map((v) => {
                    const label = Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(" · ");
                    return (
                      <div key={v.id} className="flex justify-between items-center px-4 py-3 rounded-xl bg-white/[0.02] opacity-40">
                        <span className="text-sm text-brand-muted line-through">{label}</span>
                        <span className="text-xs text-red-400">Sin stock</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEFT: Product search & cart */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-brand-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Nueva Venta</h1>
              <p className="text-xs text-brand-muted">Venta manual para pedidos telefonicos o escritorio</p>
            </div>
          </div>

          {/* Customer search */}
          <div className="relative mb-3">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              value={customerSearch}
              onChange={(e) => searchCustomers(e.target.value)}
              onFocus={() => {}}
              placeholder="Buscar cliente existente o escribir nombre..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-blue-400 transition-colors text-sm"
            />
            {selectedCustomer && (
              <button onClick={clearCustomer} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors">
                <X size={13} />
              </button>
            )}
            {customerResults.length > 0 && customerSearch.trim() && (
              <div className="absolute z-10 w-full mt-1 glass-panel rounded-xl overflow-hidden shadow-lg">
                {customerResults.map((c) => (
                  <button key={c.id} onClick={() => selectCustomer(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors flex justify-between items-center">
                    <div>
                      <span className="text-white text-sm">{c.name}</span>
                      {c.phone && <span className="text-brand-muted text-xs ml-2 flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
                    </div>
                    {c.loyaltyPoints > 0 && (
                      <span className="text-xs text-yellow-400 flex items-center gap-1">
                        <Star size={10} /> {c.loyaltyPoints} pts
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder={ui.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 mt-2 flex-wrap">
            <button onClick={() => setCategoryFilter("")} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!categoryFilter ? "bg-brand-kinetic-orange text-black" : "bg-white/5 text-brand-muted hover:text-white"}`}>Todos</button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategoryFilter(c === categoryFilter ? "" : c)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === c ? "bg-brand-kinetic-orange text-black" : "bg-white/5 text-brand-muted hover:text-white"}`}>{c}</button>
            ))}
          </div>
        </div>

        {/* Product results */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-brand-muted">
              <Loader2 size={20} className="animate-spin mr-2" /> Cargando productos...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-brand-muted">
              <Search size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No se encontraron productos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => {
                const outOfStock = p.hasVariants
                  ? (p.variants ?? []).every((v) => v.stock <= 0)
                  : p.stock <= 0;
                const inCartQty = cart.filter((i) => i.product.id === p.id).reduce((s, i) => s + i.qty, 0);
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={outOfStock && !p.hasVariants}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      outOfStock && !p.hasVariants
                        ? "border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed"
                        : inCartQty > 0
                          ? "border-brand-kinetic-orange/50 bg-brand-kinetic-orange/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{p.name}</div>
                      <div className="text-xs text-brand-muted mt-0.5">
                        {p.category?.name && <span>{p.category.name}</span>}
                        {p.sku && <span className="ml-2 font-mono">{p.sku}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-brand-kinetic-orange">Bs. {fmt(Number(p.price))}</div>
                      <div className={`text-xs ${outOfStock ? "text-red-400" : p.hasVariants ? "text-blue-400" : p.stock <= p.minStock ? "text-yellow-400" : "text-brand-muted"}`}>
                        {p.hasVariants
                          ? `${(p.variants ?? []).filter((v) => v.stock > 0).length} vars.`
                          : outOfStock ? "Sin stock" : `Stock: ${p.stock}`}
                      </div>
                    </div>
                    {inCartQty > 0 && (
                      <div className="w-6 h-6 rounded-full bg-brand-kinetic-orange text-black text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {inCartQty}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart & checkout */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/5 bg-brand-surface-lowest/60 flex flex-col max-h-[50vh] lg:max-h-none">
        <div className="p-4 lg:p-5 border-b border-white/5 flex items-center gap-2 flex-shrink-0">
          <ShoppingCart size={18} className="text-brand-kinetic-orange" />
          <h2 className="font-bold text-white">Carrito</h2>
          {cart.length > 0 && <span className="ml-auto text-xs text-brand-muted">{totalItems} items</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="py-8 text-center text-brand-muted">
              <ShoppingCart size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Agrega productos para comenzar</p>
            </div>
          ) : (
            cart.map((item) => {
              const key = cartKey(item);
              return (
                <div key={key} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{item.product.name}</div>
                    {item.variantLabel && (
                      <div className="text-xs text-blue-400 truncate">{item.variantLabel}</div>
                    )}
                    <div className="text-xs text-brand-muted">Bs. {fmt(item.effectivePrice)} c/u</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(key, -1)} className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                      <Minus size={10} />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-white">{item.qty}</span>
                    <button onClick={() => updateQty(key, 1)} className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                      <Plus size={10} />
                    </button>
                  </div>
                  <div className="text-xs font-bold text-white w-14 text-right">Bs. {fmt(item.qty * item.effectivePrice)}</div>
                  <button onClick={() => removeFromCart(key)} className="text-brand-muted hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-white/5 space-y-3 flex-shrink-0">
          {/* Loyalty points */}
          {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
            <div className="px-3 py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 text-xs flex items-center gap-1 font-medium">
                  <Star size={10} /> {selectedCustomer.loyaltyPoints} pts
                </span>
                <span className="text-yellow-400/60 text-xs">10 pts = Bs. 1</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={maxRedeemable}
                  value={pointsToRedeem || ""}
                  onChange={(e) => setPointsToRedeem(Math.min(Math.max(0, parseInt(e.target.value) || 0), maxRedeemable))}
                  placeholder="Canjear puntos"
                  className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-yellow-400/20 text-white placeholder-brand-muted focus:outline-none focus:border-yellow-400 transition-colors text-xs"
                />
                {pointsToRedeem > 0 && (
                  <button onClick={() => setPointsToRedeem(0)} className="text-brand-muted hover:text-white transition-colors">
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Payment method */}
          <div className="grid grid-cols-3 gap-1.5">
            {(["EFECTIVO", "TARJETA", "TRANSFERENCIA"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                className={`py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 ${paymentMethod === m ? "bg-brand-kinetic-orange text-black" : "bg-white/5 text-brand-muted hover:text-white"}`}>
                {m === "EFECTIVO" && <Banknote size={12} />}
                {m === "TARJETA" && <CreditCard size={12} />}
                {m === "TRANSFERENCIA" && <Landmark size={12} />}
                {m === "EFECTIVO" ? "Efectivo" : m === "TARJETA" ? "Tarjeta" : "Transfer."}
              </button>
            ))}
          </div>

          {/* Discount code */}
          {!appliedDiscount ? (
            <div className="flex gap-2">
              <input
                value={discountCode}
                onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(""); }}
                placeholder="Codigo de descuento"
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm"
              />
              <button onClick={applyDiscount} disabled={!discountCode.trim()} className="px-3 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-colors disabled:opacity-40">
                <Tag size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-growth-neon/10 border border-brand-growth-neon/30">
              <Tag size={11} className="text-brand-growth-neon" />
              <span className="text-brand-growth-neon text-xs font-medium flex-1">{appliedDiscount.code}</span>
              <button onClick={removeDiscount} className="text-brand-muted hover:text-white transition-colors"><X size={11} /></button>
            </div>
          )}
          {discountError && <p className="text-red-400 text-xs">{discountError}</p>}

          {/* Notes */}
          <div className="relative">
            <FileText size={12} className="absolute left-3 top-3 text-brand-muted" />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas del pedido (opcional)"
              rows={2}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-white/20 transition-colors text-xs resize-none"
            />
          </div>

          {/* Totals */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-sm text-brand-muted">
              <span>Subtotal</span><span>Bs. {fmt(subtotal)}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between text-sm text-brand-growth-neon">
                <span>Descuento</span><span>-Bs. {fmt(discountAmount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-sm text-yellow-400">
                <span className="flex items-center gap-1"><Star size={10} /> Puntos</span>
                <span>-Bs. {fmt(pointsDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-white pt-1 border-t border-white/10">
              <span>Total</span>
              <span className="text-brand-kinetic-orange">Bs. {fmt(total)}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSell}
            disabled={cart.length === 0 || selling}
            className="w-full py-3.5 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold disabled:opacity-40 shadow-[0_0_25px_rgba(255,107,0,0.3)] hover:shadow-[0_0_35px_rgba(255,107,0,0.5)] transition-all flex items-center justify-center gap-2"
          >
            {selling ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Procesando...
              </>
            ) : (
              <>
                <CheckCircle size={16} /> Registrar Venta — Bs. {fmt(total)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
