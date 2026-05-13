# Análisis técnico completo — GestiOS

Generado: 2026-04-29. Actualizado: 2026-05-13. Basado en lectura directa del código y ejecución de herramientas.

---

## Resumen ejecutivo

| Check | Estado |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ Sin errores |
| Tests (Vitest) | ✅ 229/229 pasando |
| Build Next.js | ❌ Falla localmente — esperado (sin `.env` local, la DB vive en Supabase) |
| `console.log` en producción | ✅ Ninguno |
| TODOs/FIXMEs en código | ✅ Ninguno |
| Secrets hardcodeados | ✅ Ninguno detectado |
| RLS en Supabase | ✅ Habilitado en `public.profiles` |

---

## Hallazgos por severidad

### HIGH — Permisos faltantes en customers/[id]

**Archivo:** `app/api/customers/[id]/route.ts`

El handler `PUT` (actualizar cliente) y el `DELETE` (eliminar cliente) tienen autenticación (`getTenantProfile`) pero **no tienen verificación de permiso** (`hasPermission`). Cualquier usuario autenticado de la org puede modificar o eliminar clientes, sin importar su rol.

```typescript
// Línea 16 — PUT — falta hasPermission
export async function PUT(request: Request, ...) {
  const profile = await getTenantProfile();
  if (!profile) return ...  // ← auth ✅
  // FALTA: if (!hasPermission(profile.role, "customers:update")) return ...
  ...
}

// Línea 49 — DELETE — falta hasPermission
export async function DELETE(...) {
  const profile = await getTenantProfile();
  if (!profile) return ...  // ← auth ✅
  // FALTA: if (!hasPermission(profile.role, "customers:delete")) return ...
  ...
}
```

**Fix:** Agregar `hasPermission(profile.role, "customers:update")` y `"customers:delete"` antes de ejecutar la operación. Ver patrón en `app/api/products/[id]/route.ts:22`.

---

### MEDIUM — logAudit() no se llama en products ni customers

**Contexto:** `logAudit()` en `lib/audit.ts` registra operaciones críticas, pero solo para plan EMPRESARIAL. Actualmente se invoca en `POST /api/orders` y `PATCH /api/orders/[id]`, pero **no** en productos ni clientes.

**Rutas sin logAudit:**

| Ruta | Método | Operación |
|---|---|---|
| `app/api/products/route.ts:63` | POST | crear producto |
| `app/api/products/[id]/route.ts:19` | PATCH | actualizar producto |
| `app/api/products/[id]/route.ts:41` | DELETE | desactivar producto |
| `app/api/customers/route.ts:53` | POST | crear cliente |
| `app/api/customers/[id]/route.ts:16` | PUT | actualizar cliente |
| `app/api/customers/[id]/route.ts:49` | DELETE | eliminar cliente |

**Fix:** Agregar `logAudit({ orgId, orgPlan, userId, action, entityType, entityId, before?, after? })` al final de cada handler, siguiendo el patrón de `app/api/orders/route.ts:138`.

---

### MEDIUM — getSuperAdmin() duplicado

**Archivos:**
- `app/api/superadmin/route.ts` — define y exporta `getSuperAdmin()`
- `app/api/superadmin/impersonate/route.ts` — define su propio `getSuperAdmin()` local idéntico

Si la lógica de autenticación del superadmin cambia (ej: agregar 2FA, audit), `impersonate/route.ts` no se actualizará automáticamente.

**Fix:** En `impersonate/route.ts`, reemplazar la definición local por:
```typescript
import { getSuperAdmin } from "@/app/api/superadmin/route";
```

---

### MEDIUM — Cobertura de tests insuficiente

**Estado actual:** Solo existe `tests/rate-limit.test.ts` (5 tests unitarios de la función `consumeRateLimit`).

**Sin cobertura:**
- `POST /api/orders` — stock decrement por variante/producto
- `POST /api/orders` — plan limit check (maxOrders no existe, pero sí los decrements)
- `PLAN_LIMITS` — lógica de gates por plan
- `POST /api/products` — plan limit check (maxProducts)
- `POST /api/customers` — plan limit check (maxCustomers)
- Cron jobs — lógica de filtrado de clientes/productos por fecha
- `logAudit()` — verificar que solo actúa para plan EMPRESARIAL

**Meta:** 80% de cobertura según reglas del proyecto.

---

### LOW — Archivos grandes (cerca del límite 800 líneas)

| Archivo | Líneas |
|---|---|
| `app/(dashboard)/inventory/page.tsx` | 716 |
| `app/(dashboard)/pos/page.tsx` | 633 |
| `app/(dashboard)/superadmin/organizations/page.tsx` | 423 |
| `app/(dashboard)/orders/page.tsx` | 394 |
| `app/(dashboard)/reports/page.tsx` | 391 |

`inventory/page.tsx` está a 84 líneas del límite. Si se agrega la UI de foto de producto o barcode scanner, romperá el límite. Considerar extraer el formulario de producto a `components/inventory/ProductForm.tsx`.

---

### LOW — Rate limiting solo en /api/registro

Solo `POST /api/registro` tiene rate limiting. Endpoints sensibles sin rate limit:

| Endpoint | Riesgo |
|---|---|
| `POST /api/setup` | Creación de org — podría abusarse en teoría |
| `POST /api/team` | Invitación de staff |
| `POST /api/payments` | Solicitud de pago |

Para el volumen actual del SaaS boliviano esto es bajo riesgo, pero documentar como deuda técnica.

---

## Rutas sin getTenantProfile — verificadas como correctas

Estas rutas no usan `getTenantProfile` por diseño:

| Ruta | Auth usada | Correcto |
|---|---|---|
| `app/api/cron/*` | `CRON_SECRET` header | ✅ |
| `app/api/me/route.ts` | Supabase direct | ✅ |
| `app/api/registro/route.ts` | Pública + rate limit | ✅ |
| `app/api/setup/route.ts` | Supabase direct | ✅ |
| `app/api/superadmin/*` | `getSuperAdmin()` | ✅ |
| `app/api/webhooks/whatsapp/route.ts` | Firma HMAC de Meta | ✅ |

---

## Estado de features por módulo

### Completamente implementado ✅
- Auth (Supabase) + multi-tenancy
- Dashboard (KPIs, stock alerts)
- POS + variantes + carrito + canje de loyalty points + QR personal
- Inventario + variantes por tipo de negocio + imagen de producto
- Pedidos (CRUD, estados, email, transacciones atómicas)
- Clientes (CRM, búsqueda, loyalty acumulación)
- Categorías / Proveedores / Descuentos / Sucursales
- Reportes + exportación CSV contable
- Configuración org, tipo de negocio, moneda
- Facturación (planes, add-ons)
- Equipo (staff management)
- Emails (12 tipos via Brevo con logging, rate limiting, webhook)
- Cron jobs (cumpleaños, vencimiento, inactivos, plan, stock bajo)
- Pagos QR + aprobación superadmin + upload QR personal
- Registro público `/registro/[slug]` (plan PRO+)
- Panel superadmin + métricas de email
- WhatsApp backend + webhook multi-tenant
- Audit log backend (`lib/audit.ts`) + UI `/audit`
- Rate limiting distribuido (Upstash Redis + in-memory fallback)
- Error monitoring (Sentry + `reportAsyncError`)
- Sidebar dinámico por tipo de negocio
- Plan gating completo (variantes CRECER+, tienda PRO+, etc.)
- RLS habilitado en `public.profiles`

### Modelo en DB, sin backend/UI ❌
| Feature | DB | Backend | UI |
|---|---|---|---|
| Foto de producto | ✅ `imageUrl` | ✅ `POST /api/products/upload-image` | ✅ Upload con preview |
| Barcode scanner en POS | ✅ `barcode` | — | ✅ Input de escaneo |
| Filtro por sucursal en reportes | ✅ `branchId` | ✅ param `branchId` | ✅ Selector en UI |

### Add-ons pendientes (comingSoon: true)
| Add-on | Estado |
|---|---|
| WhatsApp Business | ✅ Backend listo — falta config Vercel + Meta |
| Facturación SIAT Bolivia | ⚠️ Scaffold completo — requiere intermediario |
| Pagos QR Bolivia (PSP) | ⚠️ Upload personal implementado — PSP pendiente |
| E-commerce storefront | ✅ Implementado — `/{slug}/tienda` |

---

## Infraestructura

| Item | Estado |
|---|---|
| Cron jobs en Vercel (`vercel.json`) | ✅ 7 jobs |
| Rate limiting | ✅ Upstash Redis + in-memory fallback |
| Transacciones atómicas en órdenes | ✅ |
| Error monitoring | ✅ Sentry activo en producción |
| Tests (Vitest) | ✅ 229 tests, 13 files |
| RLS en Supabase | ✅ Habilitado en `public.profiles` |
| Email logging | ✅ `EmailLog` table + webhook tracking |

---

## Prioridades de acción

### P1 — Bugs de seguridad/permisos
1. **Agregar `hasPermission` en `customers/[id]` PUT y DELETE** — cualquier usuario autenticado puede modificar clientes

### P2 — Completar audit trail
2. **`logAudit()` en products y customers** — 6 handlers sin auditoría (plan EMPRESARIAL)

### P3 — Deuda técnica
3. **Unificar `getSuperAdmin()`** — eliminar duplicación en `impersonate/route.ts`
4. **Ampliar tests** — órdenes, plan limits, productos, clientes
5. **Considerar split de `inventory/page.tsx`** — 716 líneas, extraer `ProductForm`

### P4 — Nuevas features
6. Foto de producto (upload + storage)
7. Barcode scanner en POS
8. Filtro por sucursal en reportes
9. Facturación SIAT Bolivia
10. Pagos QR Bolivia
11. E-commerce storefront
