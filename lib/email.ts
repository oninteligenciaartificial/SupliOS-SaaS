import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.EMAIL_FROM ?? "GestiOS <noreply@gestios.app>";

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface SendOrderConfirmationArgs {
  to: string;
  customerName: string;
  orgName: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
}

interface SendOrderStatusArgs {
  to: string;
  customerName: string;
  orgName: string;
  orderId: string;
  status: string;
}

interface SendLowStockAlertArgs {
  to: string;
  orgName: string;
  products: { name: string; stock: number; minStock: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

function baseTemplate(content: string, orgName: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${orgName}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;color:#e0e0e0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
        <tr><td style="background:linear-gradient(135deg,#ff6b00,#ff8c00);padding:28px 32px;">
          <span style="font-size:22px;font-weight:800;letter-spacing:2px;color:#000;">${orgName}</span>
        </td></tr>
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <span style="font-size:12px;color:#555;">Gestionado con <strong style="color:#ff6b00;">GestiOS</strong></span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmation(args: SendOrderConfirmationArgs) {
  if (!process.env.RESEND_API_KEY) return;

  const itemsHtml = args.items.map(i =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ccc;">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#ccc;">${i.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;color:#fff;font-weight:600;">$${Number(i.unitPrice).toLocaleString("es-MX")}</td>
    </tr>`
  ).join("");

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Pedido confirmado</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hola <strong style="color:#fff;">${args.customerName}</strong>, recibimos tu pedido.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <th style="text-align:left;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRODUCTO</th>
        <th style="text-align:center;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">CANT.</th>
        <th style="text-align:right;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRECIO</th>
      </tr>
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding-top:16px;font-weight:700;color:#fff;">Total</td>
        <td style="padding-top:16px;text-align:right;font-size:18px;font-weight:800;color:#ff6b00;">$${Number(args.total).toLocaleString("es-MX")}</td>
      </tr>
    </table>
    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px 18px;margin-bottom:8px;">
      <span style="font-size:13px;color:#888;">Pago: </span>
      <span style="font-size:13px;color:#fff;font-weight:600;">${PAYMENT_LABELS[args.paymentMethod] ?? args.paymentMethod}</span>
    </div>
    <p style="margin:20px 0 0;font-size:13px;color:#666;">Folio de pedido: <code style="color:#ff6b00;">#${args.orderId.slice(-8).toUpperCase()}</code></p>
  `;

  await getResend()?.emails.send({
    from: FROM,
    to: args.to,
    subject: `Pedido recibido — ${args.orgName}`,
    html: baseTemplate(content, args.orgName),
  });
}

export async function sendOrderStatusUpdate(args: SendOrderStatusArgs) {
  if (!process.env.RESEND_API_KEY) return;

  const statusLabel = STATUS_LABELS[args.status] ?? args.status;
  const statusColor = args.status === "ENTREGADO" ? "#22c55e" : args.status === "CANCELADO" ? "#ef4444" : "#ff6b00";

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Actualizacion de pedido</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hola <strong style="color:#fff;">${args.customerName}</strong>, tu pedido fue actualizado.</p>
    <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:13px;color:#666;margin-bottom:8px;">Estado actual</div>
      <div style="font-size:24px;font-weight:800;color:${statusColor};">${statusLabel}</div>
    </div>
    <p style="margin:0;font-size:13px;color:#666;">Folio: <code style="color:#ff6b00;">#${args.orderId.slice(-8).toUpperCase()}</code></p>
  `;

  await getResend()?.emails.send({
    from: FROM,
    to: args.to,
    subject: `Tu pedido esta ${statusLabel} — ${args.orgName}`,
    html: baseTemplate(content, args.orgName),
  });
}

export async function sendLowStockAlert(args: SendLowStockAlertArgs) {
  if (!process.env.RESEND_API_KEY) return;

  const rowsHtml = args.products.map(p =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ccc;">${p.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#ef4444;font-weight:700;">${p.stock}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:#666;">${p.minStock}</td>
    </tr>`
  ).join("");

  const content = `
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">Alerta de stock bajo</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Los siguientes productos necesitan reabastecimiento en <strong style="color:#fff;">${args.orgName}</strong>:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <th style="text-align:left;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">PRODUCTO</th>
        <th style="text-align:center;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">STOCK ACTUAL</th>
        <th style="text-align:center;color:#666;font-size:12px;padding-bottom:8px;font-weight:500;">MINIMO</th>
      </tr>
      ${rowsHtml}
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:#666;">Entra a GestiOS para reabastecer tu inventario.</p>
  `;

  await getResend()?.emails.send({
    from: FROM,
    to: args.to,
    subject: `⚠️ ${args.products.length} producto(s) con stock bajo — ${args.orgName}`,
    html: baseTemplate(content, args.orgName),
  });
}
