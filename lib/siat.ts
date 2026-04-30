/**
 * SIAT Bolivia — Facturación Electrónica
 *
 * Intermediario recomendado: Nube Fiscal o FacturAPI Bolivia
 * Credenciales requeridas por tenant:
 *   - nitEmisor, razonSocial (en Organization)
 *   - Certificado digital: almacenar en OrgAddon.config (encriptado)
 *   - SIAT_API_KEY env var (clave del intermediario — compartida o por tenant)
 *
 * Flujo:
 *   1. getCUIS() — mensual, almacena en Organization.siatCuis
 *   2. getCUFD() — diario, almacena en Organization.siatCufd
 *   3. generateInvoice(orderId) — crea Invoice, envía al SIN vía intermediario
 *   4. voidInvoice(invoiceId) — anula factura en el SIN
 */

import { prisma } from "@/lib/prisma";
import { reportAsyncError } from "@/lib/monitoring";

const SIAT_API_URL = process.env.SIAT_API_URL ?? "https://api.facturapi.bo/v1";
const SIAT_API_KEY = process.env.SIAT_API_KEY;

function siatHeaders() {
  if (!SIAT_API_KEY) throw new Error("SIAT_API_KEY no configurada");
  return {
    "Authorization": `Bearer ${SIAT_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function refreshCUIS(organizationId: string): Promise<{ ok: boolean; error?: string }> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { nitEmisor: true, razonSocial: true },
  });

  if (!org?.nitEmisor) return { ok: false, error: "NIT emisor no configurado" };

  try {
    const res = await fetch(`${SIAT_API_URL}/cuis`, {
      method: "POST",
      headers: siatHeaders(),
      body: JSON.stringify({ nit: org.nitEmisor, razonSocial: org.razonSocial }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: (err as { message?: string }).message ?? `HTTP ${res.status}` };
    }

    const data = await res.json() as { cuis: string; expiresAt: string };
    await prisma.organization.update({
      where: { id: organizationId },
      data: { siatCuis: data.cuis, siatCuisExpiresAt: new Date(data.expiresAt) },
    });

    return { ok: true };
  } catch (error) {
    reportAsyncError("siat.refreshCUIS", error, { organizationId });
    return { ok: false, error: "Error de red con el intermediario SIAT" };
  }
}

export async function refreshCUFD(organizationId: string): Promise<{ ok: boolean; error?: string }> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { nitEmisor: true, siatCuis: true },
  });

  if (!org?.siatCuis) return { ok: false, error: "CUIS no disponible — ejecutar refreshCUIS primero" };

  try {
    const res = await fetch(`${SIAT_API_URL}/cufd`, {
      method: "POST",
      headers: siatHeaders(),
      body: JSON.stringify({ nit: org.nitEmisor, cuis: org.siatCuis }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: (err as { message?: string }).message ?? `HTTP ${res.status}` };
    }

    const data = await res.json() as { cufd: string; expiresAt: string };
    await prisma.organization.update({
      where: { id: organizationId },
      data: { siatCufd: data.cufd, siatCufdExpiresAt: new Date(data.expiresAt) },
    });

    return { ok: true };
  } catch (error) {
    reportAsyncError("siat.refreshCUFD", error, { organizationId });
    return { ok: false, error: "Error de red con el intermediario SIAT" };
  }
}

export async function generateInvoice(
  organizationId: string,
  orderId: string,
  receptor: { nit?: string; razonSocial: string },
): Promise<{ ok: boolean; invoiceId?: string; cufe?: string; error?: string }> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      nitEmisor: true, razonSocial: true,
      siatCuis: true, siatCufd: true, siatCufdExpiresAt: true,
      siatNroFactura: true,
    },
  });

  if (!org?.nitEmisor) return { ok: false, error: "NIT emisor no configurado" };
  if (!org.siatCuis) return { ok: false, error: "CUIS no disponible" };

  // Auto-refresh CUFD si expiró
  const now = new Date();
  if (!org.siatCufd || !org.siatCufdExpiresAt || org.siatCufdExpiresAt <= now) {
    const r = await refreshCUFD(organizationId);
    if (!r.ok) return { ok: false, error: r.error };
    const updated = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { siatCufd: true },
    });
    org.siatCufd = updated?.siatCufd ?? null;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { name: true, sku: true } } } } },
  });

  if (!order || order.organizationId !== organizationId) {
    return { ok: false, error: "Pedido no encontrado" };
  }

  const nroFactura = org.siatNroFactura + 1;

  try {
    const payload = {
      nit: org.nitEmisor,
      razonSocial: org.razonSocial,
      cuis: org.siatCuis,
      cufd: org.siatCufd,
      nroFactura,
      fecha: order.createdAt.toISOString(),
      receptor: {
        nit: receptor.nit ?? "99999999",
        razonSocial: receptor.razonSocial,
      },
      detalle: order.items.map(i => ({
        descripcion: i.product.name,
        codigo: i.product.sku ?? i.productId,
        cantidad: i.quantity,
        precioUnitario: Number(i.unitPrice),
        subtotal: Number(i.unitPrice) * i.quantity,
      })),
      total: Number(order.total),
      moneda: "BOB",
    };

    const res = await fetch(`${SIAT_API_URL}/invoices`, {
      method: "POST",
      headers: siatHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json() as { cufe?: string; xml?: string; message?: string };

    if (!res.ok) return { ok: false, error: data.message ?? `HTTP ${res.status}` };

    // Incrementar nroFactura atómico
    await prisma.organization.update({
      where: { id: organizationId },
      data: { siatNroFactura: nroFactura },
    });

    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        orderId,
        nroFactura,
        cufe: data.cufe ?? null,
        cuis: org.siatCuis!,
        cufd: org.siatCufd!,
        nitEmisor: org.nitEmisor,
        nitReceptor: receptor.nit ?? "99999999",
        razonReceptor: receptor.razonSocial,
        status: data.cufe ? "ENVIADO" : "PENDIENTE",
        xmlData: data.xml ?? null,
        sinResponse: data as object,
        total: order.total,
      },
    });

    return { ok: true, invoiceId: invoice.id, cufe: data.cufe };
  } catch (error) {
    reportAsyncError("siat.generateInvoice", error, { organizationId, orderId });
    return { ok: false, error: "Error generando factura" };
  }
}

export async function voidInvoice(
  invoiceId: string,
  organizationId: string,
): Promise<{ ok: boolean; error?: string }> {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.organizationId !== organizationId) {
    return { ok: false, error: "Factura no encontrada" };
  }
  if (!invoice.cufe) return { ok: false, error: "Factura sin CUFE — no se puede anular" };

  try {
    const res = await fetch(`${SIAT_API_URL}/invoices/${invoice.cufe}/void`, {
      method: "POST",
      headers: siatHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: (err as { message?: string }).message ?? `HTTP ${res.status}` };
    }

    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "ANULADO" } });
    return { ok: true };
  } catch (error) {
    reportAsyncError("siat.voidInvoice", error, { invoiceId, organizationId });
    return { ok: false, error: "Error anulando factura" };
  }
}
