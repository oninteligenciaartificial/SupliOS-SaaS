# GestiOS

SaaS multi-tenant de gestión comercial para negocios bolivianos. Cada organización es un tenant aislado con su propio inventario, clientes, pedidos y configuración.

## Propósito

Reemplazar hojas de cálculo y sistemas fragmentados con una sola plataforma: punto de venta, inventario, clientes, pedidos, reportes y automatizaciones de email/WhatsApp.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS |
| ORM | Prisma |
| Base de datos | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Email | Brevo API |
| WhatsApp | Meta Business API v20.0 |
| Deploy | Vercel |

## Módulos disponibles

| Módulo | Ruta | Descripción |
|---|---|---|
| Dashboard | `/dashboard` | KPIs: ventas hoy, pedidos, stock bajo |
| Punto de Venta | `/pos` | Venta rápida, selector de variantes, carrito |
| Inventario | `/inventory` | CRUD productos, variantes, stock entries |
| Pedidos | `/orders` | Gestión y estados de órdenes |
| Clientes | `/customers` | CRM básico, puntos de lealtad, importación CSV |
| Reportes | `/reports` | Ventas por período (plan CRECER+) |
| Corte de Caja | `/caja` | Cierre de turno (plan CRECER+) |
| Proveedores | `/suppliers` | Catálogo de proveedores (plan CRECER+) |
| Descuentos | `/discounts` | Códigos de descuento por % o monto fijo |
| Categorías | `/categories` | Organización de productos |
| Sucursales | `/branches` | Multi-sucursal (plan EMPRESARIAL) |
| WhatsApp | `/conversations` | Conversaciones (add-on, próximamente) |
| Equipo | `/staff` | Gestión de usuarios y roles |
| Configuración | `/settings` | Org, tipo de negocio, moneda |
| Facturación | `/billing` | Plan actual, add-ons |

## Planes

| Plan | Precio BOB | Productos | Clientes | Staff |
|---|---|---|---|---|
| Básico | 350/mes | 150 | 50 | 1 |
| Crecer | 530/mes | 500 | 300 | 3 |
| Pro | 800/mes | ∞ | ∞ | 10 |
| Empresarial | 1,250/mes | ∞ | ∞ | ∞ |

## Features por plan

| Feature | Plan mínimo |
|---|---|
| Reportes | CRECER |
| Proveedores | CRECER |
| CSV import/export | CRECER |
| Página pública de registro | PRO |
| Email básico | PRO |
| Email avanzado | EMPRESARIAL |
| Sucursales | EMPRESARIAL |
| Roles avanzados | EMPRESARIAL |
| Audit log | EMPRESARIAL |

## Add-ons (todos próximamente)

| Add-on | Precio |
|---|---|
| WhatsApp Business | $40/mes — 300 conversaciones |
| Facturación SIAT | $25/mes — facturas electrónicas Bolivia |
| Pagos QR Bolivia | $15/mes — Tigo Money, BiPago, QR SWITCH |
| E-commerce | $20/mes — tienda online sincronizada |
| Exportación Contable | $18/mes — CSV/Excel para contador |

## Roles

`SUPERADMIN → ADMIN → MANAGER → STAFF → VIEWER`

- **SUPERADMIN**: panel interno, puede impersonar cualquier organización
- **ADMIN**: acceso completo a su organización
- **MANAGER**: ventas, reportes, clientes — sin billing ni settings
- **STAFF**: solo ventas y clientes básicos
- **VIEWER**: solo lectura de clientes, reportes, caja
