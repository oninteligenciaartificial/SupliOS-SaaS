---

## 2026-05-11 — RLS en profiles + Brevo email system + QR Bolivia addon

### Fix: RLS habilitado en public.profiles (Supabase lint 0013)

**Problema:** Supabase alertó que `public.profiles` tenía RLS deshabilitado, exponiendo todas las filas via PostgREST al rol `anon`.

**Solución:** RLS habilitado + políticas para que usuarios solo vean/editen su propio perfil. El `service_role` (usado por Prisma y admin client) bypassa RLS automáticamente.

**SQL aplicado en Supabase:**
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles read own"
ON public.profiles FOR SELECT TO authenticated
USING ("userId" = auth.uid()::text);

CREATE POLICY "Profiles update own"
ON public.profiles FOR UPDATE TO authenticated
USING ("userId" = auth.uid()::text)
WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Profiles insert own"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK ("userId" = auth.uid()::text);
```

**Nota clave:** `"userId"` es `TEXT` en el schema, pero `auth.uid()` devuelve `UUID` — requiere cast `::text`.

### Feat: Brevo email system con logging, rate limiting y métricas

**Cambios:**
- `lib/email.ts` — Wrapper con `EmailLog` en DB, rate limiting diario (280 emails), sender fallback a `BREVO_SENDER_EMAIL`
- `prisma/schema.prisma` — Modelo `EmailLog` agregado
- `prisma/migrations/20260511181518_create_email_log/migration.sql` — Migration manual para Supabase
- `app/api/webhooks/brevo/route.ts` — Webhook para tracking delivery/bounce (requiere `BREVO_WEBHOOK_KEY`)
- `app/api/superadmin/email-stats/route.ts` — API de métricas para SUPERADMIN
- `app/(dashboard)/email-stats/page.tsx` — Dashboard de métricas de email
- `n8n/brevo-email-tracking.json` — Workflow n8n para bridge Brevo → GestiOS (free plan no tiene webhooks nativos)
- `tests/email.test.ts` — 18 tests nuevos para funciones de email
- `scripts/test-emails.ts` — Script para enviar emails de prueba
- `docs/EMAIL-MIGRATION-GUIDE.md` — Guía para migrar a dominio personalizado
- `docs/BREVO-SETUP.md` — Actualizado con nueva configuración

**IMPORTANTE:** La migration `email_logs` debe aplicarse manualmente a Supabase.

### Feat: QR Bolivia addon con upload de QR personal

**Cambios:**
- `app/(dashboard)/billing/page.tsx` — UI de addon QR Bolivia con branching NIT vs No-NIT
- `app/api/addons/qr-bolivia/route.ts` — GET para POS fetch del QR URL
- `app/api/addons/qr-bolivia/upload/route.ts` — Upload de imagen QR a Supabase Storage
- `app/(dashboard)/pos/ManualQrModal.tsx` — Modal mostrando QR subido en checkout
- `docs/QR-BOLIVIA.md` — Documentación del sistema

### Deploy
- Vercel env vars configurados: `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `BREVO_WEBHOOK_KEY`
- Producción: https://gesti-os.vercel.app

---

## 2026-05-09 (sesión tarde) — Categorías por tipo de negocio

### Feat: Categorías scopeadas por businessType

**Problema:** Al cambiar de "Suplementos" a "Farmacia", las categorías de suplementos seguían apareciendo en farmacia.

**Solución:** Cada categoría ahora tiene un campo `businessType`. Por defecto solo se muestran las del tipo de negocio activo, pero hay un toggle "Mostrar todas" para ver las de otros tipos.

**Cambios:**
- `prisma/schema.prisma` — Agregado `businessType String @default("GENERAL")` al modelo Category
- `prisma/migrations/20260509000000_add_category_business_type/migration.sql` — Migration para Supabase
- `lib/auth.ts` — `getTenantProfile()` ahora incluye `businessType` del org
- `app/api/categories/route.ts` — GET filtra por `businessType` (con `?all=1` para ver todas), POST taguea con el businessType actual
- `app/(dashboard)/categories/page.tsx` — Toggle "Solo [tipo]" / "Mostrando todas", badge de tipo por categoría, placeholder contextual en el form

**IMPORTANTE:** La migration debe aplicarse manualmente a Supabase:
```sql
ALTER TABLE "categories" ADD COLUMN "businessType" TEXT NOT NULL DEFAULT 'GENERAL';
```

---

## 2026-05-08 (sesión noche) — Sidebar dinámico + Plan gating completo

### Feat: Sidebar dinámico por tipo de negocio

**Problema:** Cambiar tipo de negocio en Settings no actualizaba nada en la UI.

**Fix:**
- `lib/business-ui.ts` — Agregados `sidebarLabels` (inventory, categories, suppliers) y `extraSections` por negocio
- `app/(dashboard)/layout.tsx` — Lee `businessType` del org y usa `getBusinessUI()` para labels dinámicos del sidebar
- FARMACIA → "Inventario Farmacia", "Laboratorios", "Laboratorios" + sección "Vencimientos"
- ROPA → "Catálogo de Ropa", "Colecciones", "Marcas"
- ELECTRONICA → "Inventario", "Marcas", "Distribuidores" + sección "Garantías"
- SUPLEMENTOS → "Catálogo de Suplementos", "Líneas", "Marcas" + sección "Vencimientos"

### Feat: Refresh inmediato tras cambiar businessType

**Fix:** `app/(dashboard)/settings/page.tsx` — `router.refresh()` + re-fetch `/api/me` tras guardar. Mensaje: "Navegá a Inventario para ver los cambios."

### Feat: Tabla comparativa de planes

**Fix:** `app/(dashboard)/billing/page.tsx` — Sección colapsable "Comparar planes" con tabla de 22 features × 4 planes (checkmarks/cruces)

### Feat: Tooltips en items bloqueados del sidebar

**Fix:** `app/(dashboard)/SidebarNav.tsx` — Items bloqueados muestran "Requiere plan Crecer" en vez de genérico

### Feat: PLAN_FEATURES en lib/plans.ts

**Nuevo:** `PLAN_FEATURES` con lista descriptiva de features por plan para uso en UI y documentación.

### Feat: Gate de variantes por plan

- `app/(dashboard)/inventory/page.tsx` — Toggle de variantes muestra "Requiere plan Crecer" si BASICO
- `app/(dashboard)/inventory/components/ProductFormModal.tsx` — Sección de gestión de variantes oculta si BASICO
- `app/api/products/route.ts` — Rechaza `hasVariants: true` con 403 si plan BASICO

### Fix: Validación de businessType en API

**Fix:** `app/api/me/route.ts` — `orgBusinessType` ahora usa `z.enum([...])` en vez de `z.string()`

---

## 2026-05-08 (sesión mañana)

### Fix: Variant labels unificados a "Variantes"

**Problema:** Labels como `"Sabor / Peso"`, `"Talla / Color"`, `"Capacidad / Color"` eran confusos — parecían indicar una elección entre dos opciones en lugar de atributos combinables.

**Fix:** Todos los `variantLabel` en `lib/business-ui.ts` cambiados a `"Variantes"`. El subtítulo ya explica los atributos reales (ej: "Selecciona sabor y peso").

**Tipos afectados:** GENERAL, ROPA, SUPLEMENTOS, ELECTRONICA, FARMACIA, FERRETERIA

---

### Feat: Plan management modal en superadmin users

**Cambios en** `app/(dashboard)/superadmin/users/page.tsx`:
- Columna "Plan" en tabla de usuarios con badges de color por plan
- Botón "Administrar Plan" (icono CreditCard) por usuario con organización
- Modal completo con:
  - Selector de plan (BASICO, CRECER, PRO, EMPRESARIAL)
  - Date picker para vencimiento
  - Botones rápidos: +30 días, +90 días, +1 año
  - PATCH a `/api/superadmin/organizations/[id]` para guardar

---

### Deploy exitoso

**Commit:** `904d371` — feat: variant labels unified + plan management modal in superadmin users
**Producción:** https://gesti-os.vercel.app
**Build:** Next.js 16.2.3, 74 páginas, TypeScript OK, 37s

---

## 2026-05-08

### Fix: Supabase env vars missing — error message mejorado

**Error:**
```
Error: Your project's URL and Key are required to create a Supabase client!
```

**Causa:** Las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` no están configuradas en Vercel, o fueron accidentalmente eliminadas.

**Fix:** Agregados guards explícitos en `lib/supabase/server.ts`, `lib/supabase/client.ts`, y `lib/supabase/admin.ts` que lanzan un error claro indicando exactamente qué vars faltan.

**Acción requerida:** Configurar estas vars en Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — API anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (para admin)

---

## 2026-05-07 (sesión noche)

### Fix: `profiles.createdAt` y `profiles.updatedAt` — removidos del schema (columnas no existen en DB)

**Error:**
```
PrismaClientKnownRequestError: The column `profiles.updatedAt` does not exist in the current database.
PrismaClientKnownRequestError: The column `profiles.createdAt` does not exist in the current database.
```

**Causa:** Mismo problema que `profiles.email` — el schema Prisma tenía columnas de timestamp que nunca se migraron a Supabase.

**Fix:** Removidos `createdAt` y `updatedAt` del modelo `Profile`. Cambiados todos los `orderBy: { createdAt: ... }` a `orderBy: { id: ... }` en staff, team, y superadmin routes.

**Archivos modificados:**
- `prisma/schema.prisma` — removidos `createdAt`, `updatedAt` de Profile
- `app/api/staff/route.ts` — removidos createdAt/updatedAt de select, orderBy id
- `app/api/staff/[id]/route.ts` — removido updatedAt del select
- `app/api/superadmin/users/route.ts` — orderBy id en lugar de createdAt
- `app/api/team/route.ts` — orderBy id en lugar de createdAt

**Nota:** El deploy a Vercel está en cola — hay 7 deployments pendientes por congestión de infraestructura. Los cambios están commiteados y pusheados a GitHub.

---

## 2026-05-07 (sesión tarde)

### Fix 1: `profiles.email` — removido del schema (columna no existe en DB)

**Error:**
```
PrismaClientKnownRequestError: The column `profiles.email` does not exist in the current database.
```

**Causa:** Se agregó `email String?` al modelo `Profile` en el schema Prisma, pero la migración nunca se aplicó a Supabase. Como no hay `DATABASE_URL` local, no se puede hacer `prisma db push`.

**Fix:** Removido `email` del modelo `Profile` en `prisma/schema.prisma`. El email ya se obtiene de Supabase Auth (`user.email`) en `/api/me`. Eliminadas todas las referencias en `app/api/staff/route.ts` y `app/api/staff/[id]/route.ts`.

**Archivos modificados:**
- `prisma/schema.prisma` — removido `email String?` de Profile
- `app/api/staff/route.ts` — removido email de schema, destructuring, select, create
- `app/api/staff/[id]/route.ts` — removido email del select
- `prisma/migrations/20260507000000_add_profile_email/` — eliminado (nunca aplicado)

---

### Fix 2: Lazy Prisma initialization — fix build error `DATABASE_URL no esta configurada`

**Error:**
```
Error: DATABASE_URL no esta configurada
Failed to collect page data for /api/activity-log
```

**Causa:** `PrismaClient` se instanciaba al nivel del módulo (`lib/prisma.ts:17`), lo que lanzaba el error durante el build estático de Next.js cuando `DATABASE_URL` no existe en el entorno de build.

**Fix:** Wrapeé `prisma` en un `Proxy` que crea el cliente solo al primer acceso (lazy). Durante el build estático, las páginas que no acceden a `prisma` no fallan.

**Archivo modificado:** `lib/prisma.ts`

---

### Fix 3: V-02 unitPrice validation en tienda/checkout

**Archivo:** `app/api/tienda/checkout/route.ts`
- Validación de `unitPrice` contra precio real de DB (producto o variante)
- Mismo patrón que V-01 en `/api/orders`

---

### Fix 4: V-07 MIME detection por magic bytes

**Archivo:** `app/api/products/upload-image/route.ts`
- Ya no confía en `file.type` del header
- Lee primeros 12 bytes y verifica magic bytes (JPEG, PNG, GIF, WebP)

---

### Fix 5: Rate limit en /api/tienda/checkout

- 30 req/min por IP en endpoint público

---

### Fix 6: xlsx prototype pollution mitigation

**Archivo:** `app/api/products/import/route.ts`
- `sanitizeRow()` con `Object.create(null)` previene contaminación por `__proto__`

---

### Tests

- `tests/tienda-security.test.ts` — 23 tests nuevos (V-02, V-07, rate limiting)
- **Total: 209 tests pasando, 11 archivos**

---

## 2026-05-07

### Bugfix - `profiles.email` column missing in production DB

**Error:**
```
Error [PrismaClientKnownRequestError]:
The column `profiles.email` does not exist in the current database.
app/api/me/route.ts:12
prisma.profile.findUnique(...)
```

**Causa:** El schema Prisma (`prisma/schema.prisma`) define `email String?` en el modelo `Profile` (línea 110), pero la base de datos de producción no tiene esta columna. Ocurrió porque `prisma db push --accept-data-loss` en el build fue removido para evitar modificar la DB desde CI/CD, pero la columna nunca fue agregada a la DB real.

**Root cause:** El schema local y la DB de Supabase están desincronizados. El build ya no ejecuta `prisma db push`, así que nunca sincroniza el schema hacia la DB.

**Fix aplicado:**
1. **Removido** `prisma db push --accept-data-loss` del script `build` en `package.json`. Ya no se hace sync automático desde CI/CD.
2. **Creado** `prisma/migrations/20260507000000_add_profile_email/migration.sql` con el ALTER para agregar la columna.
3. **Advertencia** en `docs/SESSION_LOG.md`: cuando se agreguen campos nullable nuevos al schema, ejecutar manualmente `npx prisma db push` en un entorno con `DATABASE_URL` configurada para aplicar los cambios a la DB de producción.

**Línea del error:** `app/api/me/route.ts:12` — `prisma.profile.findUnique()` incluye `organization: true` que hace JOIN, pero el error ocurre antes del JOIN en el `findUnique` de la línea 12.

**Nota:** `prisma.config.ts` usa `DIRECT_URL` o `DATABASE_URL` del entorno para conectar. El problema es que localmente no hay `.env` con credenciales, así que `prisma db push` falla localmente. Los cambios deben aplicarse via:
```bash
# En un entorno con credenciales (Vercel CI o local con .env)
npx prisma db push
# O aplicar migraciones:
npx prisma migrate deploy
```

**Patrón preventivo:** Cuando se agreguen campos nullable nuevos al schema Prisma, sincronizar la DB manualmente después de mergear. El build de Vercel NO hace `db push` automáticamente.

---

### Deploy - GitHub + Vercel

**Commits empujados:**
- `1c98e22` — fix: update staff/[id] route to async params for Next.js 16
- `b131710` — feat: POS/orders/caja/dashboard — Bs. currency + icons + UX polish
- `1e0ec01` — feat: improve business type selection UX in setup and settings
- `70455ce` — feat: Sentry improvements + rate limiting + monitoring tests

**Fix de build Vercel:**
- Cron `*/5 * * * *` excedía el límite de Hobby (1 ejecución/día). Cambiado a `0 0 * * *` (diario a medianoche) en `vercel.json`.
- Removido `prisma db push` del build script para evitar errores de sync de schema en CI.
- Actualizado `app/api/staff/[id]/route.ts` para usar `params: Promise<{ id: string }>` (Next.js 16 async params).

**Producción:** https://gesti-os.vercel.app

---

### UX Improvements - Moneda consistente en Bs.

**Cambios realizados:**

| Página | Cambio |
|--------|--------|
| POS | Bs. en lugar de $ en todos los precios y totales |
| POS | Iconos lucide para métodos de pago (Banknote/CreditCard/Landmark) |
| Orders | Status chips con iconos (Clock/CheckCircle/Truck/ShoppingBag/Ban) |
| Orders | Bs. en tabla, modal detalle, formulario creación, ticket print |
| Dashboard | KPI ingresos muestra Bs. |
| Caja | Todo en Bs. (KPIs, productos top, órdenes) |
| Customers | Historial de pedidos en Bs. |
| Inventory ProductFormModal | Precio variante muestra Bs. |

**Verificación:** 186 tests passing

---

### Tests - 186 tests

**Test files creados:**
- `tests/orders-logic.test.ts` — 28 tests (stock decrement, loyalty points, status transitions, order total, pagination, variantSnapshot)
- `tests/products-customers.test.ts` — 50 tests (plan limits, permission checks, pagination, search, audit logging)

**Resultado:** `npm test` → **10 archivos, 186 tests, todos pasando**

---