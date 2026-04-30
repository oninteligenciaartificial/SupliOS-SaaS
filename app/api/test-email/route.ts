import { NextResponse } from "next/server";
import { sendOrderConfirmation } from "@/lib/email";

// TEMPORAL — delete after testing
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to");

  if (!to) return NextResponse.json({ error: "Falta ?to=email" }, { status: 400 });
await sendOrderConfirmation({
    to,
    customerName: "Cliente de Prueba",
    orgName: "Mi Tienda Test",
    orderId: "test-order-12345678",
    total: 250.5,
    paymentMethod: "TRANSFERENCIA",
    items: [
      { name: "Producto A", quantity: 2, unitPrice: 100 },
      { name: "Producto B", quantity: 1, unitPrice: 50.5 },
    ],
  });

  return NextResponse.json({ ok: true, sent_to: to });
}
