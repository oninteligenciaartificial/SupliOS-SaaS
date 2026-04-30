"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ShoppingCart, Plus, Minus, Trash2, X, Store, CheckCircle } from "lucide-react";

interface Variant {
  id: string;
  attributes: Record<string, string>;
  price: string | null;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
  hasVariants: boolean;
  category: { name: string } | null;
  variants: Variant[];
}

interface StoreData {
  name: string;
  currency: string;
  products: Product[];
}

interface CartItem {
  product: Product;
  qty: number;
  variantId?: string;
  variantLabel?: string;
  effectivePrice: number;
}

function cartKey(item: CartItem) {
  return item.variantId ? `${item.product.id}__${item.variantId}` : item.product.id;
}

function fmt(n: number, currency: string) {
  return n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency;
}

export default function TiendaPage() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [variantTarget, setVariantTarget] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tienda/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: StoreData | null) => { if (d) setStore(d); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  function addToCart(product: Product) {
    if (product.hasVariants) { setVariantTarget(product); return; }
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && !i.variantId);
      if (existing) return prev.map(i => i.product.id === product.id && !i.variantId ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1, effectivePrice: Number(product.price) }];
    });
  }

  function addVariantToCart(product: Product, variant: Variant) {
    setVariantTarget(null);
    if (variant.stock <= 0) return;
    const effectivePrice = variant.price ? Number(variant.price) : Number(product.price);
    const label = Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ");
    setCart(prev => {
      const existing = prev.find(i => i.variantId === variant.id);
      if (existing) return prev.map(i => i.variantId === variant.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1, variantId: variant.id, variantLabel: label, effectivePrice }];
    });
  }

  function updateQty(key: string, delta: number) {
    setCart(prev => prev.flatMap(i => {
      if (cartKey(i) !== key) return [i];
      const newQty = i.qty + delta;
      if (newQty <= 0) return [];
      return [{ ...i, qty: newQty }];
    }));
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!store || cart.length === 0) return;
    setSubmitting(true);
    setOrderError("");
    const res = await fetch("/api/tienda/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        customerName: name.trim(),
        customerEmail: email.trim() || undefined,
        customerPhone: phone.trim() || undefined,
        shippingAddress: address.trim() || undefined,
        notes: notes.trim() || undefined,
        items: cart.map(i => ({
          productId: i.product.id,
          quantity: i.qty,
          unitPrice: i.effectivePrice,
          variantId: i.variantId,
          variantSnapshot: i.variantLabel ? { label: i.variantLabel } : undefined,
        })),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setSuccess(data.orderId as string);
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
    } else {
      setOrderError(data.error ?? "Error al procesar el pedido");
    }
  }

  const total = cart.reduce((s, i) => s + i.qty * i.effectivePrice, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-white/50 text-sm">Cargando tienda...</div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center space-y-3">
        <Store size={48} className="mx-auto text-white/20" />
        <p className="text-white/50">Tienda no encontrada</p>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <CheckCircle size={64} className="mx-auto text-green-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">¡Pedido recibido!</h2>
          <p className="text-white/60 mt-2">Tu pedido #{success.slice(-8).toUpperCase()} fue registrado. Te contactaremos para coordinar el pago y envío.</p>
        </div>
        <button onClick={() => setSuccess(null)} className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors">
          Seguir comprando
        </button>
      </div>
    </div>
  );

  const filtered = (store?.products ?? []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Store size={20} className="text-orange-400" />
            <h1 className="font-bold text-lg">{store?.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="hidden sm:block px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-orange-400 transition-colors text-sm w-56"
            />
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="sm:hidden px-4 pb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-orange-400 transition-colors text-sm"
          />
        </div>
      </header>

      {/* Products grid */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-white/40">
            <Store size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-white/20 transition-colors">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover bg-white/5" />
                ) : (
                  <div className="w-full h-40 bg-white/5 flex items-center justify-center text-white/20">
                    <Store size={32} />
                  </div>
                )}
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-sm font-medium text-white leading-tight">{p.name}</p>
                  {p.category && <p className="text-xs text-white/40 mt-0.5">{p.category.name}</p>}
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <span className="font-bold text-orange-400">{fmt(Number(p.price), store?.currency ?? "Bs.")}</span>
                    <button
                      onClick={() => addToCart(p)}
                      className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {p.hasVariants && <p className="text-xs text-white/40 mt-1">{p.variants.length} variantes</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/60" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-sm bg-gray-900 border-l border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-bold text-lg">Tu carrito</h2>
              <button onClick={() => setCartOpen(false)} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-white/40">
                  <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Tu carrito está vacío</p>
                </div>
              ) : cart.map(item => {
                const key = cartKey(item);
                return (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      {item.variantLabel && <p className="text-xs text-white/50">{item.variantLabel}</p>}
                      <p className="text-xs text-white/40">{fmt(item.effectivePrice, store?.currency ?? "Bs.")} c/u</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(key, -1)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><Minus size={11} /></button>
                      <span className="w-5 text-center text-sm font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(key, 1)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><Plus size={11} /></button>
                    </div>
                    <button onClick={() => setCart(prev => prev.filter(i => cartKey(i) !== key))} className="text-white/30 hover:text-red-400 transition-colors ml-1"><Trash2 size={13} /></button>
                  </div>
                );
              })}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-white/10 space-y-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-400">{fmt(total, store?.currency ?? "Bs.")}</span>
                </div>
                <button
                  onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                  className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-400 transition-colors"
                >
                  Hacer pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Variant picker */}
      {variantTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 border border-white/10 w-full max-w-sm rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{variantTarget.name}</h3>
              <button onClick={() => setVariantTarget(null)} className="text-white/50 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-2">
              {variantTarget.variants.filter(v => v.stock > 0).map(v => (
                <button
                  key={v.id}
                  onClick={() => addVariantToCart(variantTarget, v)}
                  className="w-full flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium">{Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(" · ")}</p>
                    <p className="text-xs text-white/40">Stock: {v.stock}</p>
                  </div>
                  <span className="font-bold text-orange-400">{fmt(v.price ? Number(v.price) : Number(variantTarget.price), store?.currency ?? "Bs.")}</span>
                </button>
              ))}
              {variantTarget.variants.filter(v => v.stock > 0).length === 0 && (
                <p className="text-center text-white/40 py-4 text-sm">Sin stock disponible</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
          <div className="bg-gray-900 border border-white/10 w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Datos del pedido</h2>
              <button onClick={() => setCheckoutOpen(false)} className="text-white/50 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCheckout} className="space-y-4">
              {[
                { label: "Nombre completo *", value: name, set: setName, type: "text", required: true },
                { label: "Email (para confirmación)", value: email, set: setEmail, type: "email", required: false },
                { label: "Teléfono / WhatsApp", value: phone, set: setPhone, type: "tel", required: false },
                { label: "Dirección de entrega", value: address, set: setAddress, type: "text", required: false },
              ].map(f => (
                <div key={f.label} className="space-y-1">
                  <label className="text-sm text-white/60">{f.label}</label>
                  <input
                    required={f.required}
                    type={f.type}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-orange-400 transition-colors text-sm"
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-sm text-white/60">Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-orange-400 transition-colors text-sm resize-none"
                />
              </div>
              <div className="p-4 rounded-xl bg-white/5 space-y-1">
                {cart.map(i => (
                  <div key={cartKey(i)} className="flex justify-between text-sm">
                    <span className="text-white/70">{i.product.name} x{i.qty}</span>
                    <span>{fmt(i.qty * i.effectivePrice, store?.currency ?? "Bs.")}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span className="text-orange-400">{fmt(total, store?.currency ?? "Bs.")}</span>
                </div>
              </div>
              {orderError && <p className="text-red-400 text-sm">{orderError}</p>}
              <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-400 transition-colors disabled:opacity-50">
                {submitting ? "Enviando..." : "Confirmar pedido"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
