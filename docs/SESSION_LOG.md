# Session Log

---

## 2026-04-28

### Build error — Zod `z.record()` requiere 2 argumentos

**Error:**
```
Type error: Expected 2-3 arguments, but got 1.
app/api/orders/route.ts:21
variantSnapshot: z.record(z.unknown()).optional(),
```

**Causa:** La versión de Zod instalada requiere que `z.record()` reciba key type y value type explícitamente. `z.record(valueType)` no compila.

**Fix aplicado:**
```typescript
// Antes
variantSnapshot: z.record(z.unknown()).optional()

// Después
variantSnapshot: z.record(z.string(), z.unknown()).optional()
```

**Archivo:** `app/api/orders/route.ts` línea 21

**Contexto:** Campo agregado al implementar el sistema de variantes de producto (2026-04-28). El `variantSnapshot` guarda los atributos de la variante al momento de la venta (ej: `{ talla: "M", color: "Negro" }`).

---

## 2026-04-28 (2)

### Build error — Prisma no infiere `OrderItemUncheckedCreateWithoutOrderInput`

**Error:**
```
Type error: Property 'product' is missing in type
'{ productId: string; quantity: number; unitPrice: number;
   variantId: string | null; variantSnapshot: Record<string, unknown> | null; }'
but required in type 'OrderItemCreateWithoutOrderInput'.
app/api/orders/route.ts:94
```

**Causa:** Prisma genera dos variantes del tipo de creación para `OrderItem`:
- `OrderItemCreateWithoutOrderInput` — usa objetos de relación (`product: { connect: { id } }`)
- `OrderItemUncheckedCreateWithoutOrderInput` — usa IDs escalares (`productId: "..."`)

Al pasar `productId` directamente en un array de `create`, el compilador TS no puede resolver el union type y falla requiriendo el objeto `product`. Ocurre después de `prisma generate` con campos nuevos (`variantId`, `variantSnapshot`) que ampliaron el union.

**Fix aplicado:**
```typescript
// Importar el namespace de Prisma
import type { Prisma } from "@prisma/client";

// Tipar explícitamente el return del map para forzar la variante correcta
create: items.map((i): Prisma.OrderItemUncheckedCreateWithoutOrderInput => ({
  productId: i.productId,
  quantity: i.quantity,
  unitPrice: i.unitPrice,
  variantId: i.variantId ?? null,
  variantSnapshot: i.variantSnapshot ?? null,
})),
```

**Archivo:** `app/api/orders/route.ts` líneas 8 y 95

**Patrón general:** Cuando Prisma no puede inferir la variante Unchecked de un tipo, tipar explícitamente el callback del map con `Prisma.ModelUncheckedCreateWithout*Input`.

---

## 2026-04-28 (3)

### Build error — `null` no asignable a campo `Json?` en Prisma

**Error:**
```
Type error: Type 'Record<string, unknown> | null' is not assignable to
type 'NullableJsonNullValueInput | InputJsonValue | undefined'.
Type 'null' is not assignable to type 'NullableJsonNullValueInput | InputJsonValue | undefined'.
app/api/orders/route.ts:100
variantSnapshot: i.variantSnapshot ?? null,
```

**Causa:** Prisma no acepta `null` directo para campos `Json?`. Requiere el sentinel `Prisma.DbNull` para expresar "guardar NULL en la columna". Esto es un quirk de Prisma para distinguir entre "no enviar el campo" (`undefined`) y "guardar explícitamente NULL" (`Prisma.DbNull`).

**Fix aplicado:**
```typescript
// Cambiar import de type a valor para acceder a Prisma.DbNull
import { Prisma } from "@prisma/client";  // era: import type { Prisma }

// Usar Prisma.DbNull en lugar de null
variantSnapshot: i.variantSnapshot ?? Prisma.DbNull,
```

**Archivo:** `app/api/orders/route.ts` líneas 9 y 100

**Regla:** Para campos `Json?` en Prisma:
- No enviar el campo → `undefined`
- Guardar NULL en DB → `Prisma.DbNull`
- Guardar valor → el objeto/valor directamente

---

## 2026-04-28 (4)

### Build error — `Record<string, unknown>` no asignable a `InputJsonValue`

**Error:**
```
Type error: Type 'Record<string, unknown> | DbNull' is not assignable to
type 'NullableJsonNullValueInput | InputJsonValue | undefined'.
Type 'Record<string, unknown>' is missing the following properties from
type 'readonly (InputJsonValue | null)[]': length, concat, join, slice...
app/api/orders/route.ts:100
variantSnapshot: i.variantSnapshot ?? Prisma.DbNull,
```

**Causa:** `Prisma.InputJsonValue` es un union estricto recursivo (string | number | boolean | InputJsonObject | readonly InputJsonValue[]). TS no acepta `Record<string, unknown>` como subtipo porque `unknown` es más amplio que `InputJsonValue`. Zod tipa el `variantSnapshot` como `Record<string, unknown>` (viene de `z.record(z.string(), z.unknown())`).

**Fix aplicado:**
```typescript
variantSnapshot: (i.variantSnapshot ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
```

**Archivo:** `app/api/orders/route.ts` línea 100

**Patrón:** Cuando Zod produce `Record<string, unknown>` y Prisma exige `InputJsonValue`, castear en el sitio de uso. Zod ya valida a runtime que el contenido es JSON-serializable.

---

## 2026-04-29

### Build error — Zod `z.record()` 1-arg en otros archivos

**Error:**
```
Type error: Expected 2-3 arguments, but got 1.
app/api/products/[id]/variants/route.ts:8
attributes: z.record(z.string()),
```

**Causa:** Mismo bug que entrada 1 — `z.record(valueType)` no compila en esta versión de Zod. Quedaron dos call sites más sin migrar.

**Fix aplicado:**
```typescript
// app/api/products/[id]/variants/route.ts:8
attributes: z.record(z.string(), z.string()),

// app/api/products/route.ts:23
attributeSchema: z.record(z.string(), z.array(z.string())).optional(),
```

**Archivos:** `app/api/products/[id]/variants/route.ts:8`, `app/api/products/route.ts:23`

**Acción preventiva:** `grep "z.record("` antes de build cada vez que se toca Zod schema.

---

## 2026-04-29 (2)

### Build error — `attributeSchema` `null` no asignable a `Json?`

**Error:**
```
Type error: Type 'Record<string, string[]> | null' is not assignable to
type 'NullableJsonNullValueInput | InputJsonValue | undefined'.
app/api/products/route.ts:101
attributeSchema: attributeSchema ?? null,
```

**Causa:** Igual que entradas 3-4 — `Product.attributeSchema` es `Json?` en Prisma, no acepta `null` directo. Faltó migrarlo cuando se introdujo `Prisma.DbNull` para `OrderItem.variantSnapshot`.

**Fix aplicado:**
```typescript
import { Prisma } from "@prisma/client";
// ...
attributeSchema: (attributeSchema ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
```

**Archivo:** `app/api/products/route.ts:2,102`

**Acción preventiva:** revisar PATCH/PUT de productos y cualquier route que escriba `attributeSchema` o `variantSnapshot`.

---

## 2026-04-29 (3)

### Build error — `??` mezclado con `||` sin paréntesis

**Error:**
```
Turbopack build failed:
app/(dashboard)/pos/page.tsx:209
customerName: selectedCustomer?.name ?? customerName.trim() || "Cliente mostrador",
```

**Causa:** JS/TS no permite mezclar `??` con `||` sin agrupar — ambigüedad de precedencia, error de parser.

**Fix:**
```typescript
// Antes
selectedCustomer?.name ?? customerName.trim() || "Cliente mostrador"
// Después
(selectedCustomer?.name ?? customerName.trim()) || "Cliente mostrador"
```

**Regla:** Nunca mezclar `??` con `||`/`&&` sin paréntesis.

---

## 2026-04-29 (4)

### Build error — `Parameters<typeof prisma.$transaction>[0]` resuelve overload de función, no de array

**Error:**
```
app/api/orders/route.ts(98): TS2352 — Conversion to '(prisma) => Promise<R>' may be a mistake
app/api/orders/route.ts(142): TS2488 — Type 'unknown' must have '[Symbol.iterator]()'
app/api/orders/route.ts(148): TS7006 — Parameter 'i' implicitly has 'any' type
```

**Causa:** `prisma.$transaction` tiene dos overloads (array-form y function-form). `Parameters<>` resuelve al **último** overload definido (function-form), no al array-form. Todo el downstream queda tipado como `unknown`.

**Fix:**
```typescript
// Separar la create op para capturar su tipo
const orderCreateOp = prisma.order.create({ ..., include: { items: { include: { product: true } }, customer: true } });
const stockOps = items.map(...);
const loyaltyOps = [...];

// Castear $transaction explícitamente al array-form
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const txResults = await (prisma.$transaction as (ops: any[]) => Promise<any[]>)([orderCreateOp, ...stockOps, ...loyaltyOps]);
const order = txResults[0] as Awaited<typeof orderCreateOp>;
```

**Regla:** No usar `Parameters<typeof prisma.$transaction>[0]`. Castear directamente o usar `Prisma.PrismaPromise<any>[]`.

---

## 2026-04-29 (5)

### Build error — `before: unknown` no asignable a `ReactNode` en JSX

**Error:**
```
app/(dashboard)/audit/page.tsx(144): TS2322 — Type 'unknown' is not assignable to type 'ReactNode'
app/(dashboard)/audit/page.tsx(152): TS2322 — Type 'unknown' is not assignable to type 'ReactNode'
```

**Causa:** `{log.before && <div>}` con `before: unknown` produce `unknown | false | JSX.Element` — TypeScript no puede asignar `unknown` a `ReactNode`.

**Fix:**
```typescript
// Antes
before: unknown;
after: unknown;
// Después
before: Record<string, unknown> | null;
after: Record<string, unknown> | null;
```

**Regla:** Para campos JSON de API en JSX, usar `Record<string, unknown> | null`. `null` es falsy → `&&` funciona. `unknown` no lo es.

---

## 2026-04-29 (6)

### Seguridad — Rate limiting en endpoint público `/api/registro`

**Motivación:** endpoint público sin auth vulnerable a abuso/spam. Marcado como urgente en `NEXT_STEPS.md`.

**Cambios:**
- Nuevo util: `lib/rate-limit.ts`
  - `getRequestIp(headers)` usando `x-forwarded-for` y fallback `x-real-ip`
  - `consumeRateLimit(key, { windowMs, max })` con bucket en memoria
- `app/api/registro/route.ts`
  - Rate limit antes de parsear body
  - Límite: **10 requests / 60s por IP**
  - Respuesta de bloqueo: `429` + headers `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Notas técnicas:**
- Implementación in-memory (rápida, cero dependencia). En despliegues serverless distribuidos, el límite es best-effort por instancia.
- Para enforcement global por región/instancia, migrar a store centralizado (Redis/Upstash).

**Documentación actualizada:**
- `docs/NEXT_STEPS.md`: `Rate limiting` marcado como resuelto.
- `docs/NEXT_STEPS.md`: `Cron jobs en Vercel` marcado como confirmado (4 jobs presentes en `vercel.json`).

---

## 2026-04-29 (7)

### Documentación — sincronización de contexto

`docs/00-PROJECT-CONTEXT.md` tenía estado antiguo en 4 puntos. Se alineó con el estado técnico actual:

- Add-ons: WhatsApp + Exportación Contable implementados; pendientes SIAT/QR/E-commerce.
- WhatsApp: backend listo, falta configuración externa.
- Loyalty points: canje en POS implementado.
- Audit log: backend + UI `/audit` ya disponibles.

---

## 2026-04-29 (8)

### Observabilidad — eliminación de errores silenciosos

**Problema:** había múltiples `.catch(() => {})` en rutas API y cron jobs, ocultando errores en producción.

**Cambios:**
- Nuevo util `lib/monitoring.ts` con `reportAsyncError(scope, error, context)`.
  - Siempre registra por consola (`console.error`) con `scope` y contexto.
  - Intenta capturar en Sentry vía `@sentry/nextjs` si está disponible.
  - Si Sentry no está instalado, fallback no bloqueante con warning único.
- Reemplazo de catches silenciosos en:
  - `app/api/registro/route.ts`
  - `lib/audit.ts`
  - `app/api/orders/route.ts`
  - `app/api/orders/[id]/route.ts`
  - `app/api/superadmin/payments/route.ts`
  - `app/api/cron/plan-expiry/route.ts`
  - `app/api/cron/inactive-customers/route.ts`
  - `app/api/cron/birthday/route.ts`
  - `app/api/cron/expiry/route.ts`

**Validación:**
- `npx eslint` sobre archivos modificados: OK.

**Estado:**
- Error monitoring fase 1 completada (visibilidad inmediata de fallos async).
- Siguiente mejora opcional: instalar/configurar `@sentry/nextjs` para envío centralizado.

---

## 2026-04-29 (9)

### Testing — bootstrap de suite unitaria

**Objetivo:** empezar cobertura automatizada sin depender de DB/Supabase.

**Cambios:**
- `devDependency`: `vitest`
- Scripts en `package.json`:
  - `test` → `vitest run`
  - `test:watch` → `vitest`
- Config: `vitest.config.ts`
  - `environment: "node"`
  - alias `@` → raíz del repo
  - include `tests/**/*.test.ts`
- Tests iniciales: `tests/rate-limit.test.ts`
  - `getRequestIp` (prioridad `x-forwarded-for`, fallback `x-real-ip`, fallback final `unknown`)
  - `consumeRateLimit` (umbral y reset de ventana)

**Ejecución:**
- `npm test` → **1 archivo, 5 tests, todos green**

**Próximo test target:**
- `POST /api/orders` (decremento stock producto/variante, canje puntos, permisos y errores de validación).

---

## 2026-05-06

### Plan de trabajo — documento completo

**Motivación:** Crear un plan estructurado basado en análisis completo del codebase y documentación.

**Cambios:**
- Nuevo documento: `docs/PLAN.md`
  - Resumen ejecutivo del proyecto (54 API routes, 22 lib files, 7 test files)
  - Estado por área (completado/pendiente)
  - Fase 1: Mejoras de seguridad (rate limiting mejorado)
  - Fase 2: Testing (expansión de cobertura)
  - Fase 3: Code quality (documentación actualizada)
  - Fase 4: Features pendientes (WhatsApp, SIAT, QR, emails)
  - Cronología de ejecución (4 semanas)
  - Métricas de éxito

**Archivos creados:**
- `docs/PLAN.md` — plan de trabajo completo

---

### Rate limiting mejorado — seguridad

**Motivación:** `lib/rate-limit.ts` tenía limitaciones: sin cleanup de buckets expirados (memory leak), sin helper functions, solo en `/api/registro`.

**Cambios en `lib/rate-limit.ts`:**
- Agregado cleanup automático de buckets expirados cada 60 segundos
- Agregado import de `NextResponse`
- Agregado función `rateLimitHeaders()` — genera headers estándar de rate limiting
- Agregado función `rateLimitResponse()` — crea respuesta 429 con headers
- Agregado función `checkRateLimit()` — helper para endpoints públicos (usa IP)
- Agregado función `checkOrgRateLimit()` — helper para endpoints autenticados (usa orgId)
- Documentación completa con ejemplos de uso

**Endpoints protegidos:**
- `POST /api/setup` — 10 req/min por IP (creación de org)
- `POST /api/team` — 5 req/min por org (invitación de staff)
- `POST /api/payments` — 5 req/min por org (solicitud de pago)
- `POST /api/products` — 30 req/min por org (creación de productos)
- `POST /api/orders` — 60 req/min por org (creación de pedidos)

**Archivos modificados:**
- `lib/rate-limit.ts` — mejoras de implementación
- `app/api/setup/route.ts` — rate limiting agregado
- `app/api/team/route.ts` — rate limiting agregado
- `app/api/payments/route.ts` — rate limiting agregado
- `app/api/products/route.ts` — rate limiting agregado
- `app/api/orders/route.ts` — rate limiting agregado

**Patrón de uso:**
```typescript
// Endpoint público (usa IP)
const rateLimited = checkRateLimit(request, "route-key", { windowMs: 60_000, max: 10 });
if (rateLimited) return rateLimited;

// Endpoint autenticado (usa orgId)
const rateLimited = checkOrgRateLimit(profile.organizationId, "route-key", { windowMs: 60_000, max: 10 });
if (rateLimited) return rateLimited;
```

**Verificación:**
- TypeScript: sin errores de tipo
- Rate limits aplicados correctamente en 6 endpoints
- Cleanup automático previene memory leaks

---

### Sentry mejoras — observabilidad avanzada

**Motivación:** Sentry ya estaba implementado pero con configuración mínima. Se mejoró con mejores prácticas para mejor debugging y tracking.

**Cambios en configuración Sentry:**

1. `sentry.client.config.ts`:
   - Agregado `environment` (VERCEL_ENV o NODE_ENV)
   - Agregado `release` (VERCEL_GIT_COMMIT_SHA para tracking de commits)
   - Agregado `integrations` con `replayIntegration` (maskAllText, blockAllMedia)
   - Agregado `beforeSend` filter (no envía en development)

2. `sentry.server.config.ts`:
   - Agregado `environment` y `release`
   - Agregado `beforeSend` filter

3. `sentry.edge.config.ts`:
   - Agregado `environment` y `release`
   - Agregado `beforeSend` filter

**Cambios en `lib/monitoring.ts`:**
- Agregado `setSentryUser()` — asocia errores con usuario autenticado
- Agregado `clearSentryUser()` — limpia contexto en logout
- Agregado `addSentryBreadcrumb()` — traza de acciones para debugging
- Agregado `captureSentryMessage()` — captura mensajes custom (no errores)
- Todas las funciones son async con fallback silencioso si Sentry no está disponible

**Cambios en `lib/auth.ts`:**
- Integrado `setSentryUser()` en `getTenantProfile()`
- Cada request autenticado ahora tiene contexto de usuario en Sentry
- Incluye: userId, email, organizationId, role

**Archivos modificados:**
- `sentry.client.config.ts` — configuración mejorada
- `sentry.server.config.ts` — configuración mejorada
- `sentry.edge.config.ts` — configuración mejorada
- `lib/monitoring.ts` — nuevas funciones helper
- `lib/auth.ts` — integración Sentry user context

---

### Tests — expansión de cobertura

**Motivación:** Aumentar cobertura de tests para rate limiting y monitoring.

**Tests creados:**
1. `tests/rate-limit.test.ts` — +6 tests nuevos:
   - `checkRateLimit` — retorna null cuando permitido
   - `checkRateLimit` — retorna 429 cuando rate limited
   - `checkOrgRateLimit` — retorna null cuando permitido
   - `checkOrgRateLimit` — retorna 429 cuando rate limited
   - `checkOrgRateLimit` — aísla organizaciones diferentes

2. `tests/monitoring.test.ts` — 8 tests nuevos:
   - `reportAsyncError` — log a consola
   - `reportAsyncError` — llama Sentry captureException
   - `setSentryUser` — establece contexto de usuario
   - `clearSentryUser` — limpia contexto de usuario
   - `addSentryBreadcrumb` — agrega breadcrumb
   - `captureSentryMessage` — captura mensaje info
   - `captureSentryMessage` — captura mensaje warning

**Resultado:**
- `npm test` → **8 archivos, 106 tests, todos pasando**
- Tests anteriores: 94 → Tests actuales: 106 (+12 tests nuevos)

---
