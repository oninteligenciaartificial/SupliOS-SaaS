# Estado Técnico del Proyecto

Análisis al 2026-04-28. Basado en lectura directa del código.

---

## Qué funciona completamente

| Módulo | Estado |
|---|---|
| Auth (Supabase) + multi-tenancy | ✅ Completo |
| Dashboard (KPIs, stock alerts) | ✅ Completo |
| POS + selector de variantes + carrito | ✅ Completo |
| Inventario + variantes por tipo de negocio | ✅ Completo |
| Pedidos (CRUD, estados, email automático) | ✅ Completo |
| Clientes (CRM, búsqueda, loyaltyPoints acumulación) | ✅ Completo |
| Categorías / Proveedores / Descuentos / Sucursales | ✅ Completo |
| Reportes (ingresos, margen, top productos, caja) | ✅ Completo |
| Configuración (org, tipo de negocio, moneda) | ✅ Completo |
| Facturación (plan, add-ons read-only) | ✅ Completo |
| Equipo (staff management) | ✅ Completo |
| Sistema de emails (12 tipos via Brevo) | ✅ Completo |
| Cron jobs (cumpleaños, vencimiento, inactivos, plan) | ✅ Completo |
| Solicitudes de pago QR + aprobación superadmin | ✅ Completo |
| Página pública `/registro/[slug]` (plan PRO+) | ✅ Completo |
| Panel superadmin (orgs, usuarios, pagos, impersonación) | ✅ Completo |
| WhatsApp — API de conversaciones (backend) | ✅ Backend listo |
| WhatsApp — webhook recepción de mensajes | ✅ Backend listo |
| `lib/audit.ts` — función `logAudit()` | ✅ Lista para usar |

---

## Bugs reales en el código actual

### ~~BUG 1 — Cancel de pedido no restaura stock de variantes~~ ✅ RESUELTO 2026-04-29
**Archivo:** `app/api/orders/[id]/route.ts`

Bifurcación por `variantId` aplicada tanto en cancel como en un-cancel. Mismo patrón que POST /api/orders.

---

### ~~BUG 2 — Webhook WhatsApp no distingue org por phoneNumberId~~ ✅ RESUELTO 2026-04-29
**Archivos:** `prisma/schema.prisma`, `app/api/webhooks/whatsapp/route.ts`

`phoneNumberId` agregado a `OrgAddon`. Webhook ahora busca por `OrgAddon.phoneNumberId` — routing correcto multi-tenant. Migración: `20260429000000_addon_phone_number_id`.

---

### ~~BUG 3 — Stock entry no soporta variantes~~ ✅ RESUELTO 2026-04-29
**Archivo:** `app/api/products/stock-entry/route.ts`

`variantId` opcional agregado al schema. Si se provee, incrementa `ProductVariant.stock` con validación de ownership. Si no, incrementa `Product.stock`.

---

### BUG 4 — `logAudit()` existe pero no se llama en ningún route
**Archivo:** `lib/audit.ts`

La función está lista y respeta el plan gate (solo EMPRESARIAL). Pero ningún route handler la invoca — el audit log para plan EMPRESARIAL está silenciado aunque el modelo existe en DB.

**Fix:** llamar `logAudit()` en los routes críticos: create/update/delete de productos, órdenes y clientes.

---

## Archivos incompletos

| Archivo | Qué falta |
|---|---|
| ~~`app/api/orders/[id]/route.ts`~~ | ✅ Bug 1 resuelto 2026-04-29 |
| ~~`app/api/products/stock-entry/route.ts`~~ | ✅ Bug 3 resuelto 2026-04-29 |
| ~~`app/api/webhooks/whatsapp/route.ts`~~ | ✅ Bug 2 resuelto 2026-04-29 |
| `lib/audit.ts` | Lista pero sin callers en ningún route (Bug 4) |
| *(no existe)* `app/(dashboard)/audit/page.tsx` | Falta UI para audit log (plan EMPRESARIAL) |

---

## Add-ons pendientes de implementar

Todos están en `comingSoon: true`. La UI ya existe (read-only). Solo falta el backend de cada uno.

### WhatsApp Business ✅ Listo para activar
Bug 2 resuelto, `comingSoon` removido. Solo falta configuración externa:

1. Configurar en Vercel: `WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN`, `WA_APP_SECRET`, `WA_VERIFY_TOKEN`
2. Registrar `https://gestios.app/api/webhooks/whatsapp` en Meta Business Dashboard
3. Al activar el addon para un tenant: guardar su `phoneNumberId` en `OrgAddon.phoneNumberId`

### Facturación SIAT Bolivia
Integración con el SIN Bolivia. Requiere investigar intermediario (Nube Fiscal, FacturAPI) o API directa del SIN. Es la más compleja por regulación.

### Pagos QR Bolivia
Integrar con PSP boliviano: Tigo Money, BiPago, o QR SWITCH del BCB.

### E-commerce
Storefront público en `/{slug}/tienda`. La DB ya soporta productos con variantes y precios. Falta: UI pública + carrito + checkout.

### Exportación Contable ✅ Implementado
`GET /api/reports/export?from=&to=` — requiere addon CONTABILIDAD activo. Exporta detalle de items con fecha, folio, cliente, categoría, producto, qty, precio, costo, subtotal, margen. Botón "Contabilidad CSV" en `/reports`.

---

## Funcionalidades con modelo pero sin UI

| Feature | Modelo DB | Backend | UI |
|---|---|---|---|
| Canje de puntos de lealtad | ✅ `Customer.loyaltyPoints` | ✅ decrement en POST /api/orders | ✅ POS con búsqueda cliente |
| Audit log viewer | ✅ `AuditLog` | ✅ `lib/audit.ts` + GET /api/audit | ✅ `/audit` página |
| Foto de producto | ✅ `Product.imageUrl` | ❌ sin upload | ❌ |
| Barcode scanner en POS | ✅ `Product.barcode` | — | ❌ |
| Filtro por sucursal en reportes | ✅ `Order.branchId` | ❌ | ❌ |

---

## Infraestructura

- [ ] **Tests** — base de testing agregada con Vitest + primeros unit tests (`tests/rate-limit.test.ts`, 5 tests). Siguiente prioridad: `POST /api/orders` (stock decrement), plan limit checks.
- [x] **Cron jobs en Vercel** — confirmado en `vercel.json` (`birthday`, `expiry`, `inactive-customers`, `plan-expiry`).
- [x] **Rate limiting** — aplicado en `POST /api/registro` (ventana 60s, máx 10 requests por IP, respuesta `429` con headers de límite).
- [x] **Transacciones atómicas en órdenes** — resuelto 2026-04-29. `prisma.$transaction([create, ...decrements])`.
- [x] **Error monitoring (fase 1)** — reemplazados `.catch(() => {})` por `reportAsyncError()` en rutas críticas (orders, cron, registro, superadmin, audit). Fallback a `console.error` + captura Sentry automática si `@sentry/nextjs` está instalado.

---

## Prioridades sugeridas

**P1 — Bugs que afectan datos:**
1. ✅ Bug 1: stock restore en cancel para variantes — resuelto 2026-04-29
2. ✅ Bug 3: stock entry para variantes — resuelto 2026-04-29
3. ✅ Transacciones atómicas en POST /api/orders — resuelto 2026-04-29

**P2 — Activar revenue:**
4. ✅ WhatsApp — Bug 2 resuelto, comingSoon removido. Falta: configurar env vars en Vercel + registrar webhook en Meta
5. ✅ Exportación Contable — API `/api/reports/export` + botón en UI de reportes

**P3 — Completar features existentes:**
6. ✅ Audit log UI — `/audit` con paginación, filtros por entidad, before/after diff — resuelto 2026-04-29
7. ✅ Canje de puntos de lealtad en POS — búsqueda de cliente, balance visible, descuento server-side — resuelto 2026-04-29
8. ✅ logAudit() en routes críticos — orders create/update — resuelto 2026-04-29

**P4 — Nuevas features:**
9. Facturación SIAT
10. Pagos QR Bolivia
11. E-commerce storefront
