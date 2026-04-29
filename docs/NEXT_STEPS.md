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

### BUG 2 — Webhook WhatsApp no distingue org por phoneNumberId
**Archivo:** `app/api/webhooks/whatsapp/route.ts` líneas 61–67

Busca org con `addons: { some: { addon: "WHATSAPP", active: true } }` — toma la **primera** org que tenga el addon activo. Si dos orgs tienen WhatsApp activo, los mensajes de ambas van a la misma org.

```typescript
// Bug: toma la primera org con WA activo, no la correcta
const org = await prisma.organization.findFirst({
  where: { addons: { some: { addon: "WHATSAPP", active: true } } },
})

// Fix: mapear phoneNumberId a org
// Necesita campo phoneNumberId en Organization o en OrgAddon
```

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
| `app/api/webhooks/whatsapp/route.ts` | Routing multi-tenant incorrecto (Bug 2) |
| `lib/audit.ts` | Lista pero sin callers en ningún route (Bug 4) |
| *(no existe)* `app/(dashboard)/audit/page.tsx` | Falta UI para audit log (plan EMPRESARIAL) |

---

## Add-ons pendientes de implementar

Todos están en `comingSoon: true`. La UI ya existe (read-only). Solo falta el backend de cada uno.

### WhatsApp Business — El más cercano
El backend ya existe (conversaciones API + webhook). Solo faltan variables de entorno y registrar el webhook en Meta.

**Pasos para activar:**
1. Configurar en Vercel: `WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN`, `WA_APP_SECRET`, `WA_VERIFY_TOKEN`
2. Registrar `https://gestios.app/api/webhooks/whatsapp` en Meta Business Dashboard
3. Resolver Bug 2 (multi-tenant routing)
4. Quitar `comingSoon: true` de `ADDON_META.WHATSAPP` en `lib/plans.ts`

### Facturación SIAT Bolivia
Integración con el SIN Bolivia. Requiere investigar intermediario (Nube Fiscal, FacturAPI) o API directa del SIN. Es la más compleja por regulación.

### Pagos QR Bolivia
Integrar con PSP boliviano: Tigo Money, BiPago, o QR SWITCH del BCB.

### E-commerce
Storefront público en `/{slug}/tienda`. La DB ya soporta productos con variantes y precios. Falta: UI pública + carrito + checkout.

### Exportación Contable
CSV/Excel con formato para contadores bolivianos. El más simple de implementar — es básicamente un query + formateo.

---

## Funcionalidades con modelo pero sin UI

| Feature | Modelo DB | Backend | UI |
|---|---|---|---|
| Canje de puntos de lealtad | ✅ `Customer.loyaltyPoints` | ❌ | ❌ |
| Audit log viewer | ✅ `AuditLog` | ✅ `lib/audit.ts` | ❌ sin página |
| Foto de producto | ✅ `Product.imageUrl` | ❌ sin upload | ❌ |
| Barcode scanner en POS | ✅ `Product.barcode` | — | ❌ |
| Filtro por sucursal en reportes | ✅ `Order.branchId` | ❌ | ❌ |

---

## Infraestructura

- [ ] **Tests** — Cero cobertura. Prioridad: `POST /api/orders` (stock decrement), plan limit checks.
- [ ] **Cron jobs en Vercel** — Confirmar que los 4 jobs están en `vercel.json` con schedules.
- [ ] **Rate limiting** — Sin rate limiting. Urgente en `/api/registro` (endpoint público sin auth).
- [ ] **Transacciones atómicas en órdenes** — El create order + stock decrement no son atómicos. Si el decrement falla, la orden queda registrada con stock incorrecto. Envolver en `prisma.$transaction()`.
- [ ] **Error monitoring** — Sin Sentry. Múltiples `.catch(() => {})` en emails y audit logs son invisibles en producción.

---

## Prioridades sugeridas

**P1 — Bugs que afectan datos:**
1. ✅ Bug 1: stock restore en cancel para variantes — resuelto 2026-04-29
2. ✅ Bug 3: stock entry para variantes — resuelto 2026-04-29
3. Transacciones atómicas en POST /api/orders

**P2 — Activar revenue:**
4. Activar add-on WhatsApp (backend ya listo)
5. Exportación Contable (más simple de los add-ons)

**P3 — Completar features existentes:**
6. Audit log UI para plan EMPRESARIAL
7. Canje de puntos de lealtad en POS
8. logAudit() en routes críticos

**P4 — Nuevas features:**
9. Facturación SIAT
10. Pagos QR Bolivia
11. E-commerce storefront
