# Arquitectura Técnica

## Estructura de carpetas

```
app/
├── (dashboard)/          # Layout autenticado con sidebar
│   ├── layout.tsx        # Auth check, plan check, impersonación
│   ├── pos/              # Punto de venta
│   ├── inventory/        # Inventario + variantes
│   ├── orders/           # Pedidos
│   ├── customers/        # CRM
│   ├── settings/         # Configuración org
│   ├── billing/          # Plan y add-ons
│   ├── superadmin/       # Panel interno (solo SUPERADMIN)
│   └── ...               # Resto de módulos
├── api/                  # Route handlers (Next.js API)
│   ├── me/               # Perfil y org del usuario autenticado
│   ├── products/         # CRUD + variantes + stock-entry + CSV
│   ├── orders/           # CRUD + stock decrement
│   ├── customers/        # CRUD + export/import CSV
│   ├── categories/       # CRUD
│   ├── suppliers/        # CRUD (plan CRECER+)
│   ├── discounts/        # CRUD
│   ├── branches/         # CRUD (plan EMPRESARIAL)
│   ├── reports/          # Agregados de ventas (plan CRECER+)
│   ├── addons/           # Estado de add-ons de la org
│   ├── payments/         # Solicitudes de pago QR manual
│   ├── activity-log/     # Feed de actividad
│   ├── cron/             # Jobs automatizados
│   ├── webhooks/whatsapp # Recepción de mensajes Meta
│   └── superadmin/       # Impersonación
├── login/, signup/       # Auth pages
├── setup/                # Onboarding (crea organización)
├── registro/[slug]/      # Página pública de registro (plan PRO+)
└── plan-vencido/         # Página de acceso suspendido

lib/
├── auth.ts               # getTenantProfile() — contexto del usuario
├── plans.ts              # Planes, límites, feature gates
├── permissions.ts        # RBAC por rol
├── business-types.ts     # Schemas de variantes por tipo de negocio
├── email.ts              # Envío via Brevo
├── whatsapp.ts           # Envío via Meta Business API
├── currency.ts           # Formateo de moneda
├── audit.ts              # Registro de auditoría
├── prisma.ts             # Singleton de PrismaClient
└── supabase/             # Clientes server/client/admin/middleware

prisma/
├── schema.prisma         # Definición de modelos
└── migrations/           # SQL versionado
```

## Flujo de autenticación

```
Request
  → middleware (supabase/middleware.ts)   # refresca sesión
  → layout.tsx (dashboard)               # verifica user + plan
  → getTenantProfile()                   # profile + org + plan
  → API route                            # queries scoped a organizationId
```

`getTenantProfile()` — tres casos:
1. Usuario normal → usa `profile.organizationId`
2. SUPERADMIN sin impersonar → retorna `null` (va a `/superadmin`)
3. SUPERADMIN impersonando → usa cookie `impersonate_org_id`, fuerza role `ADMIN`

## Multi-tenancy

Todo query a la DB lleva `where: { organizationId: profile.organizationId }`. No hay RLS de Supabase; el aislamiento se hace a nivel de aplicación en cada route handler.

## Autorización

```typescript
// Plan gate
canUseFeature(plan, "reports")       // CRECER+
canUseFeature(plan, "sucursales")    // EMPRESARIAL+

// Permission gate (RBAC)
hasPermission(profile.role, "orders:create")

// Limit gate
PLAN_LIMITS[plan].maxProducts        // 150 / 500 / ∞ / ∞
```

## Permisos por rol

| Permiso | ADMIN | MANAGER | STAFF | VIEWER |
|---|---|---|---|---|
| products:create/edit/delete | ✓ | create/edit | create/edit | — |
| orders:create/edit/delete | ✓ | ✓ | create/edit | — |
| customers:view/create/edit | ✓ | ✓ | view/create | view |
| reports:view / caja:view | ✓ | ✓ | — | ✓ |
| suppliers:view/create | ✓ | view | — | — |
| discounts:view/create | ✓ | ✓ | view | — |
| staff:manage / branches:manage | ✓ | — | — | — |
| billing:view / settings:edit | ✓ | — | — | — |
| audit:view | ✓ | — | — | — |

## API: convenciones

- Todos los handlers llaman `getTenantProfile()` primero
- Validación de body con Zod antes de tocar la DB
- Stock decrements son operaciones separadas post-insert (no transacción atómica)
- Emails se envían con `.catch(() => {})` — nunca bloquean la respuesta
- Paginación: `?page=1&limit=50` (máx 200)

## Automatizaciones (Cron)

| Job | Acción |
|---|---|
| `/api/cron/birthday` | Email con descuento a clientes con cumpleaños hoy |
| `/api/cron/expiry` | Alerta de productos próximos a vencer (7 días) |
| `/api/cron/inactive-customers` | Email a clientes sin compras en 30+ días |
| `/api/cron/plan-expiry` | Alerta y suspensión de planes vencidos |

## Variables de entorno requeridas

```
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
BREVO_API_KEY
EMAIL_FROM_ADDRESS
WA_PHONE_NUMBER_ID
WA_ACCESS_TOKEN
WA_APP_SECRET
```
