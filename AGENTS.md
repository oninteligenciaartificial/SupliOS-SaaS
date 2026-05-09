<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Stack

Next.js 16.2.3 + React 19 + Prisma 7 + Supabase Auth + Tailwind 4 + Zod 4 + Vitest 4

## Commands

```
npm run dev          # dev server
npm run build        # prisma generate + next build (NO db push)
npm test             # vitest run (all tests)
npm test:watch       # vitest watch mode
npm run lint         # eslint
npx tsc --noEmit     # typecheck (not in scripts, but works)
npx prisma generate  # regenerate client types (safe without DATABASE_URL)
npx vercel --prod --yes  # deploy to production
```

## Prisma + Supabase — CRITICAL RULES

### NO agregar campos al schema sin plan de migración

La DB vive en Supabase. No hay `DATABASE_URL` local. El build de Vercel NO ejecuta `prisma db push`. Si agregás un campo al schema sin aplicar la migración a la DB real, TODAS las queries que usen ese modelo fallarán con `P2022: The column X does not exist`.

**Regla:** ANTES de agregar un campo al schema:
1. Crear SQL en `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql`
2. Aplicar manualmente a Supabase (SQL Editor o `npx prisma db push` con DATABASE_URL)
3. SOLO después de confirmar que la columna existe, agregar al schema

**Si no podés aplicar la migración:** NO agregues el campo. Usá otra fuente existente.

### Modelo Profile — campos removidos

El modelo `Profile` NO tiene estas columnas en la DB real:
- `email` — usar `user.email` de Supabase Auth
- `createdAt` / `updatedAt` — usar `id` para ordering

**NO los agregues de vuelta** sin migración previa.

### Modelo Category — campo businessType

`Category` tiene `businessType String @default("GENERAL")`. Las categorías se filtran por este campo en la UI pero persisten en la DB. API: `GET /api/categories?all=1` para ver todas.

### Lazy Prisma initialization

`lib/prisma.ts` usa un `Proxy` para lazy init. NO cambies a instanciación directa — el build estático falla sin `DATABASE_URL`.

### Todos los queries deben filtrar por `organizationId`

No hay RLS en Supabase. El aislamiento multi-tenant es a nivel de aplicación. Usá `getTenantProfile()` de `lib/auth.ts` — devuelve `{ organizationId, plan, businessType, role }`.

### Emails fire-and-forget

Siempre `.catch(() => {})` en envíos de email. Nunca bloquear la respuesta.

### Zod `z.record()` requiere 2 argumentos

`z.record(z.string(), valueType)` — un argumento no compila.

### Campos `Json?` en Prisma

`Prisma.DbNull` para NULL, `undefined` para omitir, valor directo para guardar.

## Auth & Multi-tenant

- **1 cuenta = 1 organización.** `Profile.userId` es `@unique`. No hay switching entre orgs.
- `getTenantProfile()` en `lib/auth.ts` es la fuente de verdad para auth en API routes. Devuelve `{ organizationId, plan, businessType, role }`.
- Superadmin impersonation usa cookies (`impersonate_org_id`) — solo para rol SUPERADMIN.
- Staff se gestiona con `/api/team` — crea usuarios reales en Supabase Auth con email+password. NO hay placeholder `temp_` userIds.

## Plan system

Plans: `BASICO` → `CRECER` → `PRO` → `EMPRESARIAL`. Usá `isPlanAtLeast(plan, required)` y `canUseFeature(plan, feature)` de `lib/plans.ts`.

Feature gates clave:
- `reports`, `suppliers`, `csv_import/export` → CRECER+
- `tienda_online`, `registro_publico`, `pagos_qr` → PRO+
- `sucursales`, `audit_log`, `roles_avanzados`, `facturacion_siat` → EMPRESARIAL+
- Variantes de productos → CRECER+ (gate en UI + API `/api/products` 403)

Plan limits (`PLAN_LIMITS`): BASICO = 150 productos, 50 clientes, 1 staff, 3 descuentos.

## Business types

`GENERAL`, `ROPA`, `SUPLEMENTOS`, `ELECTRONICA`, `FARMACIA`, `FERRETERIA`. Definidos en `lib/business-types.ts`.

`lib/business-ui.ts` tiene configs por tipo: labels de sidebar, nombres de productos, atributos de variantes, secciones extra (Vencimientos para FARMACIA/SUPLEMENTOS, Garantías para ELECTRONICA).

El sidebar en `app/(dashboard)/layout.tsx` usa `getBusinessUI(businessType)` para labels dinámicos.

## Supabase env vars — requeridas en Vercel

| Variable | Dónde |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (Transaction) |

## Cron jobs (vercel.json)

7 crons diarios: birthday, expiry, inactive-customers, plan-expiry, low-stock, siat-cufd, expire-qr.

## Known TODOs

- SIAT Bolivia, QR Bolivia, WhatsApp — requieren credenciales externas no configuradas
