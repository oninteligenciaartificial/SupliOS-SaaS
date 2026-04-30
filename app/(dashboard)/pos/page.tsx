"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getBusinessUI } from "@/lib/business-ui";
import type { BusinessType } from "@/lib/business-types";
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, X, Tag, ChevronUp, Layers, Star } from "lucide-react";

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

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TARJETA" | "TRANSFERENCIA">("EFECTIVO");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [selling, setSelling] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [variantTarget, setVariantTarget] = useState<Product | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [businessType, setBusinessType] = useState<BusinessType>("GENERAL");
  const customerSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [pRes, dRes, meRes] = await Promise.all([fetch("/api/products"), fetch("/api/discounts"), fetch("/api/me")]);
    if (pRes.ok) { const d = await pRes.json(); setProducts(d.data ?? d); }
    if (dRes.ok) setDiscounts(await dRes.json());
    if (meRes.ok) { const me = await meRes.json(); setBusinessType((me.organization?.businessType ?? "GENERAL") as BusinessType); }
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
  }

  function clearCustomer() {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setCustomerResults([]);
    setPointsToRedeem(0);
  }

  const categories = Array.from(new Set(products.map((p) => p.category?.name ?? "Sin categoria"))).sort();

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
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
        customerName: (selectedCustomer?.name ?? customerName.trim()) || "Cliente mostrador",
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
        notes: appliedDiscount ? `Descuento: ${appliedDiscount.code} (-$${fmt(discountAmount)})` : undefined,
      }),
    });
    setSelling(false);
    if (res.ok) {
      setSuccess(true);
      setCart([]);
      setCustomerName("");
      setAppliedDiscount(null);
      setDiscountCode("");
      setCartOpen(false);
      clearCustomer();
      fetchData();
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  // Returns qty in cart for a simple product (no variant)
  function inCart(id: string) {
    return cart.find((i) => i.product.id === id && !i.variantId);
  }

  // Total qty in cart for a product (across all variants)
  function inCartTotal(id: string) {
    return cart.filter((i) => i.product.id === id).reduce((s, i) => s + i.qty, 0);
  }

  const ui = getBusinessUI(businessType);

  const CartContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cart.length === 0 ? (
          <div className="py-12 text-center text-brand-muted">
            <ShoppingCart size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Selecciona {ui.productPlural.toLowerCase()}</p>
          </div>
        ) : (
          cart.map((item) => {
            const key = cartKey(item);
            return (
              <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{item.product.name}</div>
                  {item.variantLabel && (
                    <div className="text-xs text-blue-400 truncate">{item.variantLabel}</div>
                  )}
                  <div className="text-xs text-brand-muted">${fmt(item.effectivePrice)} c/u</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQty(key, -1)} className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-white">{item.qty}</span>
                  <button onClick={() => updateQty(key, 1)} className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
                <div className="text-sm font-bold text-white w-16 text-right">${fmt(item.qty * item.effectivePrice)}</div>
                <button onClick={() => removeFromCart(key)} className="text-brand-muted hover:text-red-400 transition-colors ml-1">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-white/5 space-y-3">
        {/* Customer search */}
        <div className="relative">
          <input
            value={customerSearch}
            onChange={(e) => searchCustomers(e.target.value)}
            placeholder="Buscar cliente (opcional)"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm"
          />
          {selectedCustomer && (
            <button onClick={clearCustomer} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors">
              <X size={13} />
            </button>
          )}
          {customerResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 glass-panel rounded-xl overflow-hidden shadow-lg">
              {customerResults.map((c) => (
                <button key={c.id} onClick={() => selectCustomer(c)}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors flex justify-between items-center">
                  <div>
                    <span className="text-white text-sm">{c.name}</span>
                    {c.phone && <span className="text-brand-muted text-xs ml-2">{c.phone}</span>}
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
        {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
          <div className="px-4 py-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-yellow-400 text-xs flex items-center gap-1.5 font-medium">
                <Star size={12} /> {selectedCustomer.loyaltyPoints} puntos disponibles
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
                placeholder="Puntos a canjear"
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-yellow-400/20 text-white placeholder-brand-muted focus:outline-none focus:border-yellow-400 transition-colors text-sm"
              />
              {pointsToRedeem > 0 && (
                <button onClick={() => setPointsToRedeem(0)} className="text-brand-muted hover:text-white transition-colors">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-1.5">
          {(["EFECTIVO", "TARJETA", "TRANSFERENCIA"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setPaymentMethod(m)}
              className={`py-2 rounded-xl text-xs font-bold transition-colors ${paymentMethod === m ? "bg-brand-kinetic-orange text-black" : "bg-white/5 text-brand-muted hover:text-white"}`}>
              {m === "EFECTIVO" ? "💵 Efectivo" : m === "TARJETA" ? "💳 Tarjeta" : "📲 Transfer."}
            </button>
          ))}
        </div>
        {!appliedDiscount ? (
          <div className="flex gap-2">
            <input
              value={discountCode}
              onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(""); }}
              placeholder="Codigo de descuento"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm"
            />
            <button onClick={applyDiscount} disabled={!discountCode.trim()} className="px-3 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-colors disabled:opacity-40">
              <Tag size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-growth-neon/10 border border-brand-growth-neon/30">
            <Tag size={13} className="text-brand-growth-neon" />
            <span className="text-brand-growth-neon text-sm font-medium flex-1">{appliedDiscount.code}</span>
            <button onClick={removeDiscount} className="text-brand-muted hover:text-white transition-colors"><X size={13} /></button>
          </div>
        )}
        {discountError && <p className="text-red-400 text-xs">{discountError}</p>}

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-sm text-brand-muted">
            <span>Subtotal</span><span>${fmt(subtotal)}</span>
          </div>
          {appliedDiscount && (
            <div className="flex justify-between text-sm text-brand-growth-neon">
              <span>Descuento</span><span>-${fmt(discountAmount)}</span>
            </div>
          )}
          {pointsDiscount > 0 && (
            <div className="flex justify-between text-sm text-yellow-400">
              <span className="flex items-center gap-1"><Star size={11} /> {pointsToRedeem} puntos</span>
              <span>-${fmt(pointsDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-white pt-1 border-t border-white/10">
            <span>Total</span>
            <span className="text-brand-kinetic-orange">${fmt(total)}</span>
          </div>
        </div>

        {success ? (
          <div className="flex items-center justify-center gap-2 py-4 rounded-xl bg-brand-growth-neon/15 text-brand-growth-neon font-bold">
            <CheckCircle size={20} /> Venta registrada
          </div>
        ) : (
          <button
            onClick={handleSell}
            disabled={cart.length === 0 || selling}
            className="w-full py-4 rounded-xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-lg disabled:opacity-40 shadow-[0_0_25px_rgba(255,107,0,0.3)] hover:shadow-[0_0_35px_rgba(255,107,0,0.5)] transition-all"
          >
            {selling ? "Procesando..." : `Cobrar $${fmt(total)}`}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
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
                    const qtyInCart = cart.find((i) => i.variantId === v.id)?.qty ?? 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => addVariantToCart(variantTarget, v)}
                        className="w-full flex justify-between items-center px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                      >
                        <div>
                          <span className="text-sm text-white">{label}</span>
                          <span className="block text-xs text-brand-muted">Stock: {v.stock}{qtyInCart > 0 && ` · En carrito: ${qtyInCart}`}</span>
                        </div>
                        <span className="text-sm font-bold text-brand-kinetic-orange">${fmt(price)}</span>
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

      {/* DESKTOP */}
      <div className="hidden lg:flex h-[calc(100vh-0px)]">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-white/5 space-y-3 flex-shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={ui.searchPlaceholder}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setCategoryFilter("")} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${!categoryFilter ? "bg-brand-kinetic-orange text-black" : "bg-white/5 text-brand-muted hover:text-white"}`}>Todos</button>
              {categories.map((c) => (
                <button key={c} onClick={() => setCategoryFilter(c === categoryFilter ? "" : c)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === c ? "bg-brand-kinetic-orange text-black" : "bg-white/5 text-brand-muted hover:text-white"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="py-20 text-center text-brand-muted">Cargando...</div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map((p) => {
                  const totalInCart = inCartTotal(p.id);
                  const simpleItem = inCart(p.id);
                  const outOfStock = p.hasVariants
                    ? (p.variants ?? []).every((v) => v.stock <= 0)
                    : p.stock <= 0;
                  const inCartQty = p.hasVariants ? totalInCart : simpleItem?.qty;
                  return (
                    <button key={p.id} onClick={() => addToCart(p)} disabled={outOfStock && !p.hasVariants}
                      className={`relative text-left p-4 rounded-2xl border transition-all ${outOfStock && !p.hasVariants ? "border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed" : inCartQty ? "border-brand-kinetic-orange/50 bg-brand-kinetic-orange/10 shadow-[0_0_20px_rgba(255,107,0,0.15)]" : "border-white/10 bg-white/[0.03] hover:border-brand-kinetic-orange/30 hover:bg-white/[0.06]"}`}
                    >
                      {inCartQty ? <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-kinetic-orange text-black text-xs font-bold flex items-center justify-center">{inCartQty}</div> : null}
                      <div className="font-bold text-white text-sm leading-tight mb-1 pr-8 flex items-center gap-1.5">
                        {p.name}
                        {p.hasVariants && <Layers size={12} className="text-blue-400 flex-shrink-0" />}
                      </div>
                      {p.category && <div className="text-xs text-brand-muted mb-2">{p.category.name}</div>}
                      <div className="text-brand-kinetic-orange font-bold text-lg">${fmt(Number(p.price))}</div>
                      <div className={`text-xs mt-1 ${outOfStock ? "text-red-400" : p.hasVariants ? "text-blue-400" : p.stock <= p.minStock ? "text-yellow-400" : "text-brand-muted"}`}>
                        {p.hasVariants
                          ? `${(p.variants ?? []).filter((v) => v.stock > 0).length} variantes disponibles`
                          : outOfStock ? "Sin stock" : `Stock: ${p.stock}`}
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && <div className="col-span-3 py-20 text-center text-brand-muted">No se encontraron productos.</div>}
              </div>
            )}
          </div>
        </div>

        <div className="w-80 xl:w-96 border-l border-white/5 bg-brand-surface-lowest/60 flex flex-col flex-shrink-0">
          <div className="p-5 border-b border-white/5 flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-kinetic-orange" />
            <h2 className="font-display font-bold text-white">Venta</h2>
            {cart.length > 0 && <span className="ml-auto text-xs text-brand-muted">{totalItems} items</span>}
          </div>
          {CartContent}
        </div>
      </div>

      {/* MOBILE */}
      <div className="lg:hidden flex flex-col h-[calc(100dvh-64px)]">
        <div className="px-4 pt-3 pb-3 border-b border-white/5 space-y-2 flex-shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ui.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-brand-muted focus:outline-none focus:border-brand-kinetic-orange transition-colors text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button onClick={() => setCategoryFilter("")} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${!categoryFilter ? "bg-brand-kinetic-orange text-black" : "bg-white/5 text-brand-muted"}`}>Todos</button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategoryFilter(c === categoryFilter ? "" : c)} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${categoryFilter === c ? "bg-brand-kinetic-orange text-black" : "bg-white/5 text-brand-muted"}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 pb-24">
          {loading ? (
            <div className="py-16 text-center text-brand-muted text-sm">Cargando...</div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {filtered.map((p) => {
                const totalInCart = inCartTotal(p.id);
                const simpleItem = inCart(p.id);
                const outOfStock = p.hasVariants
                  ? (p.variants ?? []).every((v) => v.stock <= 0)
                  : p.stock <= 0;
                const inCartQty = p.hasVariants ? totalInCart : simpleItem?.qty;
                return (
                  <button key={p.id} onClick={() => addToCart(p)} disabled={outOfStock && !p.hasVariants}
                    className={`relative text-left p-3.5 rounded-2xl border transition-all active:scale-95 ${outOfStock && !p.hasVariants ? "border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed" : inCartQty ? "border-brand-kinetic-orange/50 bg-brand-kinetic-orange/10" : "border-white/10 bg-white/[0.03]"}`}
                  >
                    {inCartQty ? <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-brand-kinetic-orange text-black text-xs font-bold flex items-center justify-center">{inCartQty}</div> : null}
                    <div className="font-semibold text-white text-sm leading-tight mb-0.5 pr-6 line-clamp-2 flex items-center gap-1">
                      {p.name}
                      {p.hasVariants && <Layers size={11} className="text-blue-400 flex-shrink-0" />}
                    </div>
                    {p.category && <div className="text-xs text-brand-muted mb-1.5">{p.category.name}</div>}
                    <div className="text-brand-kinetic-orange font-bold">${fmt(Number(p.price))}</div>
                    <div className={`text-xs mt-0.5 ${outOfStock ? "text-red-400" : p.hasVariants ? "text-blue-400" : p.stock <= p.minStock ? "text-yellow-400" : "text-brand-muted"}`}>
                      {p.hasVariants
                        ? `${(p.variants ?? []).filter((v) => v.stock > 0).length} variantes`
                        : outOfStock ? "Sin stock" : `${p.stock} disponibles`}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && <div className="col-span-2 py-16 text-center text-brand-muted text-sm">No se encontraron productos.</div>}
            </div>
          )}
        </div>

        {cart.length > 0 && !cartOpen && (
          <div className="fixed bottom-0 left-0 right-0 p-4 z-30">
            <button
              onClick={() => setCartOpen(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-br from-brand-kinetic-orange to-brand-kinetic-orange-light text-black font-bold text-base flex items-center justify-between px-5 shadow-[0_0_30px_rgba(255,107,0,0.4)]"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} />
                <span className="w-6 h-6 rounded-full bg-black/20 text-xs font-bold flex items-center justify-center">{totalItems}</span>
              </div>
              <span>Ver carrito</span>
              <span>${fmt(total)}</span>
            </button>
          </div>
        )}

        {cartOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setCartOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0d] rounded-t-3xl border-t border-white/10 flex flex-col max-h-[85dvh]">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-brand-kinetic-orange" />
                  <h2 className="font-display font-bold text-white">Carrito</h2>
                  <span className="text-xs text-brand-muted">{totalItems} items</span>
                </div>
                <button onClick={() => setCartOpen(false)} className="text-brand-muted hover:text-white transition-colors">
                  <ChevronUp size={20} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {CartContent}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
