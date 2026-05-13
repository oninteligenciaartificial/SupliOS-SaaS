import { prisma } from "@/lib/prisma";
import type { BusinessType } from "@/lib/business-types";

interface SampleDataOptions {
  organizationId: string;
  businessType: BusinessType;
}

const PRODUCT_TEMPLATES: Record<BusinessType, Array<{ name: string; price: number; cost: number; stock: number; minStock: number; sku: string; unit: string }>> = {
  GENERAL: [
    { name: "Aceite Vegetal 1L", price: 18, cost: 12, stock: 45, minStock: 10, sku: "ACE-001", unit: "pieza" },
    { name: "Azucar Refinada 1kg", price: 8, cost: 5, stock: 80, minStock: 20, sku: "AZU-001", unit: "pieza" },
    { name: "Arroz Grano Largo 1kg", price: 10, cost: 6, stock: 60, minStock: 15, sku: "ARR-001", unit: "pieza" },
    { name: "Cafe Molido 250g", price: 25, cost: 15, stock: 30, minStock: 8, sku: "CAF-001", unit: "pieza" },
    { name: "Leche Entera 1L", price: 7, cost: 4, stock: 3, minStock: 10, sku: "LEC-001", unit: "pieza" },
  ],
  ROPA: [
    { name: "Camiseta Polo Clasica", price: 89, cost: 35, stock: 25, minStock: 5, sku: "CAM-001", unit: "pieza" },
    { name: "Jeans Slim Fit", price: 199, cost: 80, stock: 15, minStock: 3, sku: "JEA-001", unit: "pieza" },
    { name: "Chaqueta Impermeable", price: 350, cost: 140, stock: 8, minStock: 2, sku: "CHA-001", unit: "pieza" },
    { name: "Zapatillas Running", price: 280, cost: 120, stock: 12, minStock: 3, sku: "ZAP-001", unit: "par" },
    { name: "Gorra Deportiva", price: 45, cost: 15, stock: 2, minStock: 5, sku: "GOR-001", unit: "pieza" },
  ],
  SUPLEMENTOS: [
    { name: "Whey Protein Chocolate 2lb", price: 280, cost: 150, stock: 20, minStock: 5, sku: "WHE-001", unit: "lb" },
    { name: "Creatina Monohidrato 300g", price: 120, cost: 60, stock: 35, minStock: 10, sku: "CRE-001", unit: "g" },
    { name: "BCAA 5000 200 capsulas", price: 95, cost: 45, stock: 15, minStock: 5, sku: "BCA-001", unit: "frasco" },
    { name: "Pre-Workout Explosive", price: 180, cost: 85, stock: 10, minStock: 3, sku: "PRE-001", unit: "sobre" },
    { name: "Multivitaminico Daily", price: 65, cost: 30, stock: 4, minStock: 8, sku: "MUL-001", unit: "frasco" },
  ],
  ELECTRONICA: [
    { name: "Auriculares Bluetooth Pro", price: 199, cost: 85, stock: 18, minStock: 5, sku: "AUR-001", unit: "unidad" },
    { name: "Cargador USB-C 65W", price: 120, cost: 50, stock: 30, minStock: 8, sku: "CAR-001", unit: "unidad" },
    { name: "Funda iPhone 15", price: 45, cost: 12, stock: 50, minStock: 10, sku: "FUN-001", unit: "unidad" },
    { name: "Cable HDMI 2m", price: 35, cost: 10, stock: 40, minStock: 10, sku: "CAB-001", unit: "unidad" },
    { name: "Power Bank 10000mAh", price: 150, cost: 65, stock: 2, minStock: 5, sku: "POW-001", unit: "unidad" },
  ],
  FARMACIA: [
    { name: "Paracetamol 500mg x20", price: 12, cost: 5, stock: 100, minStock: 20, sku: "PAR-001", unit: "caja" },
    { name: "Ibuprofeno 400mg x10", price: 15, cost: 7, stock: 80, minStock: 15, sku: "IBU-001", unit: "caja" },
    { name: "Amoxicilina 500mg x21", price: 35, cost: 18, stock: 40, minStock: 10, sku: "AMO-001", unit: "caja" },
    { name: "Omeprazol 20mg x14", price: 28, cost: 12, stock: 50, minStock: 10, sku: "OME-001", unit: "caja" },
    { name: "Vitamina C 1000mg x30", price: 45, cost: 20, stock: 3, minStock: 8, sku: "VIT-001", unit: "frasco" },
  ],
  FERRETERIA: [
    { name: "Tornillo 3/8\" x100", price: 25, cost: 10, stock: 60, minStock: 15, sku: "TOR-001", unit: "caja" },
    { name: "Cable Electrico 2.5mm 100m", price: 180, cost: 90, stock: 12, minStock: 3, sku: "CAB-001", unit: "rollo" },
    { name: "Martillo de Uña 16oz", price: 65, cost: 28, stock: 20, minStock: 5, sku: "MAR-001", unit: "unidad" },
    { name: "Pintura Latex Blanco 4L", price: 120, cost: 55, stock: 15, minStock: 4, sku: "PIN-001", unit: "unidad" },
    { name: "Lija de Agua #400 x10", price: 18, cost: 6, stock: 4, minStock: 10, sku: "LIJ-001", unit: "paquete" },
  ],
};

const CUSTOMER_TEMPLATES = [
  { name: "Maria Lopez", phone: "59170712345", email: "maria@email.com", loyaltyPoints: 120 },
  { name: "Carlos Rodriguez", phone: "59170723456", email: "carlos@email.com", loyaltyPoints: 85 },
  { name: "Ana Fernandez", phone: "59170734567", email: "ana@email.com", loyaltyPoints: 200 },
  { name: "Jose Mamani", phone: "59170745678", email: null, loyaltyPoints: 45 },
  { name: "Lucia Condori", phone: "59170756789", email: "lucia@email.com", loyaltyPoints: 310 },
];

const DISCOUNT_TEMPLATES = [
  { code: "BIENVENIDO10", description: "Descuento bienvenida", type: "PORCENTAJE" as const, value: 10, active: true },
  { code: "AHORRA20", description: "Descuento fijo $20", type: "MONTO_FIJO" as const, value: 20, active: true },
];

export async function generateSampleData({ organizationId, businessType }: SampleDataOptions) {
  const products = PRODUCT_TEMPLATES[businessType] ?? PRODUCT_TEMPLATES.GENERAL;

  // Create categories based on business type
  const categoryNames: Record<BusinessType, string[]> = {
    GENERAL: ["Alimentos", "Bebidas", "Limpieza"],
    ROPA: ["Camisetas", "Pantalones", "Accesorios"],
    SUPLEMENTOS: ["Proteinas", "Vitaminas", "Pre-Entreno"],
    ELECTRONICA: ["Audio", "Cables", "Accesorios"],
    FARMACIA: ["Analgésicos", "Antibióticos", "Vitaminas"],
    FERRETERIA: ["Tornilleria", "Electricidad", "Herramientas"],
  };

  const categories = await Promise.all(
    (categoryNames[businessType] ?? categoryNames.GENERAL).map((name) =>
      prisma.category.create({
        data: { organizationId, name, businessType },
      })
    )
  );

  // Create products
  const createdProducts = await Promise.all(
    products.map((p, i) =>
      prisma.product.create({
        data: {
          organizationId,
          categoryId: categories[i % categories.length]?.id,
          name: p.name,
          sku: p.sku,
          price: p.price,
          cost: p.cost,
          stock: p.stock,
          minStock: p.minStock,
          unit: p.unit,
          active: true,
        },
      })
    )
  );

  // Create customers
  const createdCustomers = await Promise.all(
    CUSTOMER_TEMPLATES.map((c) =>
      prisma.customer.create({
        data: {
          organizationId,
          name: c.name,
          phone: c.phone,
          email: c.email,
          loyaltyPoints: c.loyaltyPoints,
        },
      })
    )
  );

  // Create discounts
  await Promise.all(
    DISCOUNT_TEMPLATES.map((d) =>
      prisma.discount.create({
        data: {
          organizationId,
          code: d.code,
          description: d.description,
          type: d.type,
          value: d.value,
          active: d.active,
        },
      })
    )
  );

  // Create sample orders
  const now = new Date();
  const sampleOrders = [
    { customerId: createdCustomers[0].id, items: [0, 2], daysAgo: 1, status: "ENTREGADO" as const },
    { customerId: createdCustomers[1].id, items: [1, 3], daysAgo: 3, status: "ENTREGADO" as const },
    { customerId: createdCustomers[2].id, items: [4], daysAgo: 5, status: "PENDIENTE" as const },
    { customerId: null, items: [0, 1], daysAgo: 2, status: "ENTREGADO" as const },
    { customerId: createdCustomers[4].id, items: [2, 3, 4], daysAgo: 0, status: "CONFIRMADO" as const },
  ];

  for (const order of sampleOrders) {
    const orderItems = order.items.map((itemIdx) => ({
      productId: createdProducts[itemIdx].id,
      quantity: Math.floor(Math.random() * 3) + 1,
      unitPrice: createdProducts[itemIdx].price,
    }));

    const total = orderItems.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);

    await prisma.order.create({
      data: {
        organizationId,
        customerId: order.customerId,
        customerName: order.customerId
          ? createdCustomers.find((c) => c.id === order.customerId)?.name ?? "Cliente"
          : "Cliente Mostrador",
        status: order.status,
        paymentMethod: "EFECTIVO",
        total,
        createdAt: new Date(now.getTime() - order.daysAgo * 24 * 60 * 60 * 1000),
        items: {
          create: orderItems,
        },
      },
    });
  }

  // Create activity log entries
  await prisma.activityLog.createMany({
    data: [
      { organizationId, userId: "", userName: "Sistema", action: "SETUP", entity: "ORGANIZATION", details: "Cuenta creada con datos de ejemplo" },
      { organizationId, userId: "", userName: "Sistema", action: "IMPORT", entity: "PRODUCTS", details: `${createdProducts.length} productos creados` },
      { organizationId, userId: "", userName: "Sistema", action: "IMPORT", entity: "CUSTOMERS", details: `${createdCustomers.length} clientes creados` },
    ],
  });

  return {
    products: createdProducts.length,
    customers: createdCustomers.length,
    categories: categories.length,
    orders: sampleOrders.length,
    discounts: DISCOUNT_TEMPLATES.length,
  };
}
