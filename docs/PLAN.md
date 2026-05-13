# GestiOS — Plan de Trabajo

Generado: 2026-05-06. Basado en análisis completo del codebase y documentación.

---

## Resumen Ejecutivo

| Métrica | Valor |
|---|---|
| API Routes | 54+ |
| Lib Files | 22 |
| Test Files | 12 (229 tests) |
| Estado | Producción activa |
| Stack | Next.js 16 + React 19 + Prisma + Supabase |

### Estado por Área

| Área | Estado | Detalle |
|---|---|---|
| Auth + Multi-tenancy | ✅ Completo | Supabase Auth, getTenantProfile(), RLS en profiles |
| POS + Variantes | ✅ Completo | Carrito, loyalty canje, barcode scanner, QR personal |
| Inventario | ✅ Completo | CRUD, variantes, stock entries, imagen |
| Pedidos | ✅ Completo | Estados, email, transacciones atómicas |
| Clientes | ✅ Completo | CRM, loyalty, CSV import/export |
| Reportes | ✅ Completo | Ventas, margen, caja, CSV |
| Staff | ✅ Completo | CRUD, roles, permisos |
| Cron Jobs | ✅ 7 jobs | Birthday, expiry, inactive, plan, low-stock, CUFD, QR |
| Sentry | ✅ Activo | Error monitoring en producción |
| Tests | ✅ 229 pasando | 12 test files con Vitest |
| Rate Limiting | ✅ Distribuido | Upstash Redis + in-memory fallback |
| Email System | ✅ Completo | Brevo con logging, rate limiting, webhook, dashboard |
| QR Bolivia | ✅ Parcial | Upload personal implementado, PSP pendiente |
| WhatsApp | ⚠️ Backend listo | Falta config externa |
| SIAT | ⚠️ Scaffold | Requiere intermediario externo |
| E-commerce | ✅ Implementado | /{slug}/tienda |

---

## Fase 1 — Mejoras de Seguridad (Prioridad Alta)

### 1.1 Rate Limiting Mejorado

**Estado actual:** `lib/rate-limit.ts` (66 líneas) — in-memory, solo en `/api/registro`.

**Problemas:**
- No hay cleanup de buckets expirados (posible memory leak)
- No hay rate limiting en endpoints sensibles
- Fixed window (permite bursts en bordes)

**Plan:**
1. Mejorar `lib/rate-limit.ts`:
   - Agregar cleanup automático de buckets expirados cada 60s
   - Agregar función helper `withRateLimit(handler, options)` para middleware
   - Documentar limitaciones (serverless = best-effort por instancia)

2. Aplicar rate limiting a endpoints sensibles:
   - `POST /api/setup` — creación de org (10 req/min por IP)
   - `POST /api/team` — invitación de staff (5 req/min por org)
   - `POST /api/payments` — solicitud de pago (5 req/min por org)
   - `POST /api/products` — creación de productos (30 req/min por org)
   - `POST /api/orders` — creación de pedidos (60 req/min por org)

**Archivos a modificar:**
- `lib/rate-limit.ts` — mejorar implementación
- `app/api/setup/route.ts` — agregar rate limit
- `app/api/team/route.ts` — agregar rate limit
- `app/api/payments/route.ts` — agregar rate limit
- `app/api/products/route.ts` — agregar rate limit
- `app/api/orders/route.ts` — agregar rate limit

**Verificación:**
- Tests unitarios para cleanup de buckets
- Tests para función withRateLimit
- Verificar que rate limits se aplican correctamente

**Anti-patrones:**
- NO usar Redis/Upstash (overkill para etapa actual)
- NO crear middleware global (rate limits son por endpoint)
- NO documentar como distribuido (es best-effort por instancia)

---

### 1.2 Validación de Input Mejorada

**Estado actual:** Validación con Zod en la mayoría de endpoints.

**Plan:**
1. Auditar todos los endpoints POST/PUT/PATCH
2. Verificar que TODOS tienen validación Zod
3. Agregar validación faltante si existe

**Endpoints a auditar:**
- Todos los 54 API routes
- Verificar body parsing con Zod antes de DB operations

---

## Fase 2 — Testing (Prioridad Alta)

### 2.1 Expansión de Test Coverage

**Estado actual:** 7 archivos de test, 94 tests pasando.

**Archivos de test existentes:**
- `audit.test.ts`
- `currency.test.ts`
- `permissions.test.ts`
- `plans.test.ts`
- `plans-addons.test.ts`
- `rate-limit.test.ts`
- `staff.test.ts`

**Tests pendientes (críticos):**
1. `orders.test.ts` — Stock decrement por variante/producto
2. `orders.test.ts` — Canje de loyalty points
3. `products.test.ts` — Plan limit check (maxProducts)
4. `customers.test.ts` — Plan limit check (maxCustomers)
5. `email.test.ts` — Verificar envío de emails (mock)

**Tests pendientes (secundarios):**
6. `cron.test.ts` — Lógica de filtrado por fecha
7. `audit.test.ts` — Verificar que solo actúa para plan EMPRESARIAL
8. `whatsapp.test.ts` — Webhook verification

**Archivos a crear:**
- `tests/orders.test.ts`
- `tests/products.test.ts`
- `tests/customers.test.ts`
- `tests/email.test.ts`
- `tests/cron.test.ts`

**Verificación:**
- `npm test` → todos los tests pasan
- Cobertura > 80% en lógica crítica

---

## Fase 3 — Code Quality (Prioridad Media)

### 3.1 Documentación Actualizada

**Estado actual:** Documentación completa en `docs/` pero con datos desactualizados.

**Plan:**
1. Actualizar `docs/NEXT_STEPS.md` con estado real (2026-05-06)
2. Actualizar `docs/ANALYSIS.md` con métricas actuales
3. Actualizar `docs/00-PROJECT-CONTEXT.md` con nuevo estado
4. Crear `docs/PLAN.md` (este documento)

**Archivos a modificar:**
- `docs/NEXT_STEPS.md`
- `docs/ANALYSIS.md`
- `docs/00-PROJECT-CONTEXT.md`
- `docs/PLAN.md` (nuevo)

---

### 3.2 Mejoras de Código

**Estado actual:** Código limpio, sin TODOs/FIXMEs, sin console.log en producción.

**Plan:**
1. Revisar archivos grandes (>400 líneas):
   - `app/(dashboard)/superadmin/organizations/page.tsx` (423 líneas)
   - `app/(dashboard)/orders/page.tsx` (394 líneas)
   - `app/(dashboard)/reports/page.tsx` (391 líneas)

2. Extraer componentes si es necesario (pero NO por refactorizar si funciona)

---

## Fase 4 — Features Pendientes (Prioridad Baja)

### 4.1 WhatsApp Business

**Estado:** Backend listo, falta config externa.

**Pasos para activar:**
1. Configurar env vars en Vercel:
   - `WA_PHONE_NUMBER_ID`
   - `WA_ACCESS_TOKEN`
   - `WA_APP_SECRET`
   - `WA_VERIFY_TOKEN`
2. Registrar webhook en Meta Business Dashboard
3. Activar addon para tenant en superadmin

**Documentación:** `docs/NEXT_STEPS.md`

---

### 4.2 SIAT Bolivia

**Estado:** Scaffold completo, requiere intermediario.

**Pasos para activar:**
1. Contratar FacturAPI Bolivia
2. Obtener `SIAT_API_KEY` y `SIAT_API_URL`
3. Configurar en Vercel
4. Tenant ingresa NIT en Settings
5. Superadmin activa addon FACTURACION

**Documentación:** `docs/SIAT-BOLIVIA.md`

---

### 4.3 QR Bolivia

**Estado:** Scaffold completo, requiere PSP.

**Pasos para activar:**
1. Contratar PSP (Kuapay/PaymentsGateway.bo)
2. Obtener credenciales
3. Configurar en Vercel
4. Superadmin activa addon QR_BOLIVIA

**Documentación:** `docs/QR-BOLIVIA.md`

---

### 4.4 Emails con Dominio Propio

**Estado:** Brevo configurado con logging, rate limiting 280/día, webhook tracking, dashboard métricas. Remitente actual: `oninteligenciaartificial@gmail.com`.

**Pasos para activar:**
1. Comprar dominio gestios.app (~$12/año)
2. Configurar DNS en Brevo (SPF, DKIM, DMARC)
3. Verificar dominio
4. Cambiar `BREVO_SENDER_EMAIL=noreply@gestios.app` en Vercel
5. Deploy

**Documentación:** `docs/BREVO-SETUP.md`, `docs/EMAIL-MIGRATION-GUIDE.md`

---

## Cronología de Ejecución

| Semana | Fase | Tareas |
|---|---|---|
| 1 | Fase 1 | Rate limiting mejorado + auditoría de validación |
| 2 | Fase 2 | Tests críticos (orders, products, customers) |
| 3 | Fase 3 | Documentación actualizada + code quality |
| 4 | Fase 4 | Features pendientes (requiere acción externa) |

---

## Métricas de Éxito

| Métrica | Actual | Objetivo |
|---|---|---|
| Tests pasando | 229 | 250+ |
| Cobertura | ~70% | >80% |
| Rate limited endpoints | 12+ | 12+ ✅ |
| Documentación actualizada | 100% | 100% ✅ |
| Bugs conocidos | 0 | 0 |

---

## Referencias

- `docs/00-PROJECT-CONTEXT.md` — Contexto del proyecto
- `docs/ARCHITECTURE.md` — Arquitectura técnica
- `docs/DATABASE.md` — Modelos de datos
- `docs/API_REFERENCE.md` — Endpoints
- `docs/NEXT_STEPS.md` — Estado actual
- `docs/ANALYSIS.md` — Análisis completo
- `docs/SESSION_LOG.md` — Log de sesiones
- `docs/BREVO-SETUP.md` — Configuración email
- `docs/EMAIL-MIGRATION-GUIDE.md` — Migrar a dominio propio
- `docs/EMAILS.md` — Emails automáticos
- `docs/QR-BOLIVIA.md` — Pagos QR
- `docs/SIAT-BOLIVIA.md` — Facturación electrónica
- `docs/SECURITY_REPORT.md` — Reporte de seguridad
- `docs/SENTRY.md` — Error monitoring
- `docs/ONBOARDING_FLOW.md` — Flujo de onboarding
- `docs/BUSINESS_TYPES.md` — Tipos de negocio y variantes
- `docs/SENTRY.md` — Error monitoring
