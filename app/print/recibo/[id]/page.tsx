import { notFound } from "next/navigation";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PrintClient from "./PrintClient";

export default async function PrintReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getTenantProfile();
  if (!profile) notFound();

  const [order, org] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    }),
    prisma.organization.findUnique({
      where: { id: profile.organizationId },
      select: { name: true, address: true, phone: true, nitEmisor: true, razonSocial: true },
    }),
  ]);

  if (!order || order.organizationId !== profile.organizationId) notFound();

  return (
    <PrintClient
      order={{
        id: order.id,
        customerName: order.customerName,
        status: order.status,
        paymentMethod: order.paymentMethod,
        total: order.total.toString(),
        notes: order.notes,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice.toString(),
          variantSnapshot: i.variantSnapshot as Record<string, unknown> | null,
          product: { name: i.product.name },
        })),
      }}
      org={{
        name: org?.name ?? "",
        address: org?.address ?? null,
        phone: org?.phone ?? null,
        nit: org?.nitEmisor ?? null,
      }}
    />
  );
}
