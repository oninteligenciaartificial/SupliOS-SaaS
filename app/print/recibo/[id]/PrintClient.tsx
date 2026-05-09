"use client";

import { useEffect } from "react";

type PaymentMethod = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";
type OrderStatus = "PENDIENTE" | "CONFIRMADO" | "ENVIADO" | "ENTREGADO" | "CANCELADO";

interface Item {
  id: string;
  quantity: number;
  unitPrice: string;
  variantSnapshot: Record<string, unknown> | null;
  product: { name: string };
}

interface PrintClientProps {
  order: {
    id: string;
    customerName: string;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    total: string;
    notes: string | null;
    createdAt: string;
    items: Item[];
  };
  org: {
    name: string;
    address: string | null;
    phone: string | null;
    nit: string | null;
  };
}

const PM_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PrintClient({ order, org }: PrintClientProps) {
  useEffect(() => {
    window.print();
  }, []);

  const subtotal = order.items.reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0);
  const total = Number(order.total);
  const discount = subtotal - total;
  const shortId = order.id.slice(-8).toUpperCase();
  const date = new Date(order.createdAt).toLocaleString("es-BO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 11px; color: #000; background: #fff; }
        .receipt { width: 72mm; margin: 0 auto; padding: 4mm; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 3mm 0; }
        .row { display: flex; justify-content: space-between; margin: 1mm 0; }
        .item-name { flex: 1; word-break: break-word; padding-right: 2mm; }
        .item-price { white-space: nowrap; }
        .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-top: 2mm; }
        .org-name { font-size: 15px; font-weight: bold; }
        .order-id { font-size: 10px; letter-spacing: 1px; }
        .cancelled { font-size: 14px; font-weight: bold; text-align: center; color: #cc0000; margin: 3mm 0; }
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; }
          .no-print { display: none; }
        }
      `}</style>

      <div className="receipt">
        {/* Org header */}
        <div className="center" style={{ marginBottom: "3mm" }}>
          <div className="org-name">{org.name}</div>
          {org.address && <div>{org.address}</div>}
          {org.phone && <div>Tel: {org.phone}</div>}
          {org.nit && <div>NIT: {org.nit}</div>}
        </div>

        <div className="line" />

        <div className="center order-id">RECIBO #{shortId}</div>
        <div className="center" style={{ marginBottom: "2mm" }}>{date}</div>

        <div className="line" />

        {/* Customer */}
        <div className="row">
          <span>Cliente:</span>
          <span className="bold">{order.customerName}</span>
        </div>
        <div className="row">
          <span>Pago:</span>
          <span>{PM_LABELS[order.paymentMethod]}</span>
        </div>

        {order.status === "CANCELADO" && (
          <div className="cancelled">*** CANCELADO ***</div>
        )}

        <div className="line" />

        {/* Items */}
        {order.items.map((item) => {
          const variantLabel = item.variantSnapshot
            ? (item.variantSnapshot as { label?: string }).label
            : null;
          const lineTotal = item.quantity * Number(item.unitPrice);
          return (
            <div key={item.id} style={{ marginBottom: "2mm" }}>
              <div className="row">
                <span className="item-name bold">{item.product.name}</span>
                <span className="item-price">Bs. {fmt(lineTotal)}</span>
              </div>
              {variantLabel && (
                <div style={{ paddingLeft: "2mm", fontSize: "10px" }}>{String(variantLabel)}</div>
              )}
              <div style={{ paddingLeft: "2mm", fontSize: "10px" }}>
                {item.quantity} x Bs. {fmt(Number(item.unitPrice))}
              </div>
            </div>
          );
        })}

        <div className="line" />

        {/* Totals */}
        <div className="row">
          <span>Subtotal</span>
          <span>Bs. {fmt(subtotal)}</span>
        </div>
        {discount > 0.005 && (
          <div className="row">
            <span>Descuento</span>
            <span>-Bs. {fmt(discount)}</span>
          </div>
        )}
        <div className="total-row">
          <span>TOTAL</span>
          <span>Bs. {fmt(total)}</span>
        </div>

        {order.notes && (
          <>
            <div className="line" />
            <div style={{ fontSize: "10px" }}>{order.notes}</div>
          </>
        )}

        <div className="line" />
        <div className="center" style={{ fontSize: "10px", marginTop: "2mm" }}>
          Gracias por su compra
        </div>
        <div className="center" style={{ fontSize: "9px", marginTop: "1mm", color: "#666" }}>
          gestios.app
        </div>
      </div>

      {/* Print button visible on screen only */}
      <div className="no-print" style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: "8px 20px", background: "#ff6b00", color: "#000",
            border: "none", borderRadius: "8px", fontWeight: "bold",
            cursor: "pointer", fontSize: "14px",
          }}
        >
          Imprimir
        </button>
        <button
          onClick={() => window.close()}
          style={{
            marginLeft: "10px", padding: "8px 20px", background: "#333", color: "#fff",
            border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px",
          }}
        >
          Cerrar
        </button>
      </div>
    </>
  );
}
