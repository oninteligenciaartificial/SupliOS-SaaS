# GestiOS — Contexto para Claude Code

Pega este archivo al inicio de una sesión nueva para dar contexto completo.

---

## Qué es

SaaS multi-tenant de gestión comercial para negocios bolivianos. Stack: **Next.js 16 · React 19 · TypeScript · Prisma · PostgreSQL (Supabase) · Tailwind**.

Deploy en **Vercel**. Sin base de datos local — la DB vive en Supabase. No hay `.env` local.

## Reglas críticas

- **No ejecutar `prisma migrate dev`** — no hay `DATABASE_URL` local. Las migraciones se aplican en Vercel. Si necesitas cambiar el schema: edita `schema.prisma` + crea el SQL en `prisma/migrations/` manualmente.
- **`prisma generate` sí funciona** — actualiza los tipos del cliente sin necesitar DB.
- Cada tenant tiene `organizationId`. **Todos los queries deben filtrarse por `organizationId`** — RLS está habilitado solo en `public.profiles`, el resto del aislamiento es a nivel de código.
- Emails se envían con `.catch(() => {})` — no bloquean la respuesta. Intencionado.
- Stock decrements van a `ProductVariant` si `item.variantId` existe, a `Product` si no. No cambiar esta lógica.
- **Campos `Json?` en Prisma** — nunca asignar `null` directo. Usar `Prisma.DbNull` para NULL, `undefined` para omitir, valor directo para guardar. Requiere `import { Prisma }` (no `import type`). Ver `SESSION_LOG.md` entradas 3-6 para el patrón completo.
- **Zod `z.record()`** — esta versión requiere 2 argumentos: `z.record(z.string(), valueType)`. Un argumento no compila.
- **RLS en profiles:** `"userId"` es TEXT, `auth.uid()` devuelve UUID — requiere cast `::text` en políticas SQL.

## Archivos clave

| Archivo | Qué hace |
|---|---|
| `lib/auth.ts` | `getTenantProfile()` — contexto del usuario en cada request |
| `lib/plans.ts` | Feature gates, plan limits, add-on meta |
| `lib/permissions.ts` | RBAC — `hasPermission(role, permission)` |
| `lib/business-types.ts` | Schemas de variantes por tipo de negocio |
| `lib/business-ui.ts` | UI labels dinámicos por tipo de negocio |
| `lib/email.ts` | Envío de emails con logging, rate limiting (280/día) |
| `lib/rate-limit.ts` | Rate limiting distribuido (Upstash Redis + in-memory) |
| `lib/qr-bolivia.ts` | Generación y tracking de pagos QR |
| `prisma/schema.prisma` | Fuente de verdad de la DB |

## Estructura de una API route típica

```typescript
export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "X:Y")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  // Siempre filtrar por organizationId
  const data = await prisma.model.findMany({
    where: { organizationId: profile.organizationId }
  });
  return NextResponse.json({ data, meta: { total, page, limit, pages } });
}
```

## Módulos y rutas

```
/dashboard    /pos          /inventory    /orders
/customers    /reports      /caja         /suppliers
/discounts    /categories   /branches     /conversations
/staff        /settings     /billing      /addons
/superadmin   (panel interno)
```

## Planes y límites

| Plan | BOB/mes | Productos | Clientes | Staff |
|---|---|---|---|---|
| BASICO | 350 | 150 | 50 | 1 |
| CRECER | 530 | 500 | 300 | 3 |
| PRO | 800 | ∞ | ∞ | 10 |
| EMPRESARIAL | 1250 | ∞ | ∞ | ∞ |

## Estado actual (2026-05-13)

- **Deploy:** Todos los cambios desplegados (67 archivos, 3808 inserciones)
- **Producción:** https://gesti-os.vercel.app
- Sistema de variantes por tipo de negocio: **implementado**
- Add-ons: WhatsApp backend listo, SIAT/QR Bolivia scaffold, QR Bolivia upload implementado
- QR Bolivia: merchants sin NIT pueden subir QR personal de banco/Tigo
- Email system: Brevo con logging en DB (`EmailLog`), rate limiting 280/día, dashboard métricas `/email-stats`
- Webhook Brevo: `/api/webhooks/brevo` para tracking delivery/bounce
- n8n workflow: `n8n/brevo-email-tracking.json` bridge para plan gratuito de Brevo
- RLS: habilitado en `public.profiles` con políticas de acceso propio
- Rate limiting: Upstash Redis con fallback in-memory, aplicado en múltiples endpoints
- Sentry: error monitoring activo en producción
- Tests: 229 tests pasando (13 archivos)
- Sidebar dinámico: labels cambian según `businessType` del org
- Plan gating completo: variantes requieren CRECER+, tienda PRO+, etc.
- Ver análisis completo en `docs/ANALYSIS.md`, log de sesiones en `docs/SESSION_LOG.md`

## Documentación completa

Ver carpeta `docs/`:
- `PROJECT.md` — descripción completa
- `ARCHITECTURE.md` — estructura técnica
- `DATABASE.md` — todos los modelos
- `BUSINESS_TYPES.md` — variantes por tipo de negocio
- `API_REFERENCE.md` — todos los endpoints
- `EMAILS.md` — emails automáticos
- `BREVO-SETUP.md` — configuración de Brevo
- `EMAIL-MIGRATION-GUIDE.md` — migrar a dominio propio
- `QR-BOLIVIA.md` — pagos QR Bolivia
- `SIAT-BOLIVIA.md` — facturación electrónica
- `ONBOARDING_FLOW.md` — flujo de registro
- `NEXT_STEPS.md` — tareas pendientes
- `PLAN.md` — plan de trabajo
- `SECURITY_REPORT.md` — reporte de seguridad
- `SENTRY.md` — error monitoring
- `SESSION_LOG.md` — log de sesiones
- `00-PROJECT-CONTEXT.md` — este archivo
