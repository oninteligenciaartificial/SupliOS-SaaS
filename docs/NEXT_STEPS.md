# Estado Técnico del Proyecto

Análisis al 2026-04-29. Basado en lectura directa del código y ejecución de herramientas.
Ver análisis detallado en `docs/ANALYSIS.md`.

---

## Qué funciona completamente

| Módulo | Estado |
|---|---|
| Auth (Supabase) + multi-tenancy | ✅ Completo |
| Dashboard (KPIs, stock alerts) | ✅ Completo |
| POS + selector de variantes + carrito + loyalty canje | ✅ Completo |
| Inventario + variantes por tipo de negocio | ✅ Completo |
| Pedidos (CRUD, estados, email automático, transacciones atómicas) | ✅ Completo |
| Clientes (CRM, búsqueda, loyaltyPoints acumulación) | ✅ Completo |
| Categorías / Proveedores / Descuentos / Sucursales | ✅ Completo |
| Reportes (ingresos, margen, top productos, caja) + exportación CSV | ✅ Completo |
| Configuración (org, tipo de negocio, moneda) | ✅ Completo |
| Facturación (plan, add-ons read-only) | ✅ Completo |
| Equipo (staff management) | ✅ Completo |
| Sistema de emails (12 tipos via Brevo) | ✅ Completo |
| Cron jobs (cumpleaños, vencimiento, inactivos, plan) | ✅ Completo |
| Solicitudes de pago QR + aprobación superadmin | ✅ Completo |
| Página pública `/registro/[slug]` (plan PRO+) | ✅ Completo |
| Panel superadmin (orgs, usuarios, pagos, impersonación) | ✅ Completo |
| WhatsApp — backend + webhook multi-tenant | ✅ Backend listo |
| `lib/audit.ts` + UI `/audit` + `logAudit()` en orders | ✅ Implementado |
| Rate limiting en `/api/registro` | ✅ Implementado |
| Error monitoring (`reportAsyncError`) | ✅ Fase 1 |

---

## Bugs / Issues activos

### ~~BUG 1 — hasPermission faltante en customers/[id]~~ ✅ RESUELTO 2026-04-29
**Archivo:** `app/api/customers/[id]/route.ts`

`PUT` (línea 16) y `DELETE` (línea 49) tienen auth (`getTenantProfile`) pero no verificación de rol (`hasPermission`). Cualquier usuario autenticado de la org puede modificar o eliminar clientes.

**Fix:** Agregar antes de ejecutar la operación:
```typescript
if (!hasPermission(profile.role, "customers:update")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
```

---

### ~~BUG 2 — logAudit() no se llama en products ni customers~~ ✅ RESUELTO 2026-04-29
**Archivos:** `app/api/products/route.ts`, `app/api/products/[id]/route.ts`, `app/api/customers/route.ts`, `app/api/customers/[id]/route.ts`

6 handlers de mutación sin audit trail para plan EMPRESARIAL:
- `POST /api/products` — crear producto
- `PATCH /api/products/[id]` — actualizar producto
- `DELETE /api/products/[id]` — desactivar producto
- `POST /api/customers` — crear cliente
- `PUT /api/customers/[id]` — actualizar cliente
- `DELETE /api/customers/[id]` — eliminar cliente

**Fix:** Agregar `logAudit()` al final de cada handler. Ver patrón en `app/api/orders/route.ts:138`.

---

### ~~BUG 3 — getSuperAdmin() duplicado~~ ✅ RESUELTO 2026-04-29
**Archivos:** `app/api/superadmin/route.ts` (exporta), `app/api/superadmin/impersonate/route.ts` (redefine localmente)

**Fix:** En `impersonate/route.ts`, importar desde el route de superadmin en lugar de redefinir.

---

## Archivos incompletos / con modelo pero sin UI

| Feature | Modelo DB | Backend | UI |
|---|---|---|---|
| Foto de producto | ✅ `Product.imageUrl` | ✅ `POST /api/products/upload-image` (Supabase Storage) | ✅ Upload con preview en inventario |
| Barcode scanner en POS | ✅ `Product.barcode` | — | ✅ Input de escaneo en POS (busca por barcode o SKU, agrega al carrito) |
| Filtro por sucursal en reportes | ✅ `Order.branchId` | ✅ param `branchId` en `/api/reports` | ✅ Selector en UI de reportes |

---

## Add-ons pendientes

### WhatsApp Business ✅ Backend listo — solo config externa
Solo falta configurar en Vercel:
1. `WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN`, `WA_APP_SECRET`, `WA_VERIFY_TOKEN`
2. Registrar `https://gestios.app/api/webhooks/whatsapp` en Meta Business Dashboard
3. Al activar el addon para un tenant: guardar su `phoneNumberId` en `OrgAddon.phoneNumberId`

### Facturación SIAT Bolivia
Integración con el SIN Bolivia. Requiere investigar intermediario (Nube Fiscal, FacturAPI) o API directa del SIN.

### Pagos QR Bolivia
Integrar con PSP boliviano: Tigo Money, BiPago, o QR SWITCH del BCB.

### E-commerce
Storefront público en `/{slug}/tienda`. La DB ya soporta productos con variantes y precios.

---

## Infraestructura

- [x] **Tests** — 31 tests pasando. `plans.test.ts` (plan limits, gates, errors) + `audit.test.ts` (plan gate, fire-and-forget, mock prisma). Pendiente: integración real de orders stock decrement.
- [x] **Cron jobs en Vercel** — confirmado en `vercel.json`.
- [x] **Rate limiting** — aplicado en `POST /api/registro`.
- [x] **Transacciones atómicas en órdenes** — `prisma.$transaction([create, ...decrements])`.
- [x] **Error monitoring (fase 1)** — `reportAsyncError()` en rutas críticas.
- [ ] **Sentry** — fallback automático si se instala `@sentry/nextjs`. Sin instalar aún.

---

## Prioridades

**P1 — Seguridad:**
1. ✅ Bug 1: hasPermission en customers/[id] PUT y DELETE — resuelto 2026-04-29

**P2 — Completar audit trail:**
2. ✅ Bug 2: logAudit() en products y customers (6 handlers) — resuelto 2026-04-29

**P3 — Deuda técnica:**
3. ✅ Bug 3: getSuperAdmin() extraído a `lib/superadmin.ts` — resuelto 2026-04-29
4. ✅ Tests: 31 tests pasando (rate-limit, plans, audit) — resuelto 2026-04-29
5. [ ] Considerar split de `inventory/page.tsx` (716 líneas)

**P4 — Nuevas features:**
6. ✅ Foto de producto — `POST /api/products/upload-image` + UI con preview en inventario (2026-04-29)
   ⚠ Requiere bucket `product-images` en Supabase Storage (crear en dashboard, visibility: public)
7. ✅ Barcode scanner en POS — input de escaneo, busca por barcode o SKU, agrega al carrito directamente (2026-04-29)
8. ✅ Filtro por sucursal en reportes — param branchId en backend + selector de sucursal en UI (2026-04-29)
9. [ ] Facturación SIAT Bolivia
10. [ ] Pagos QR Bolivia
11. [ ] E-commerce storefront
