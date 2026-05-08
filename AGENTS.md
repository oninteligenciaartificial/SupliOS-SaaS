<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Prisma + Supabase — CRITICAL RULES

### NO agregar campos al schema sin plan de migración

**Problema:** La DB vive en Supabase. No hay `DATABASE_URL` local. El build de Vercel NO ejecuta `prisma db push`. Si agregás un campo al schema Prisma sin aplicar la migración a la DB real, TODAS las queries que usen ese modelo fallarán en producción con `P2022: The column X does not exist`.

**Regla:** ANTES de agregar un campo nullable al schema Prisma:
1. Crear el SQL en `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql`
2. Aplicar manualmente a Supabase: `npx prisma db push` (requiere `DATABASE_URL`)
3. SOLO DESPUÉS de confirmar que la columna existe en la DB, agregar el campo al schema

**Si no podés aplicar la migración:** NO agregues el campo al schema. Usá `user.email` de Supabase Auth u otra fuente existente.

### Modelo Profile — campos que NO existen en la DB

El modelo `Profile` en `prisma/schema.prisma` NO tiene estas columnas en la DB real de Supabase:
- `email` — removido (usar `user.email` de Supabase Auth)
- `createdAt` — removido (usar `id` para ordering)
- `updatedAt` — removido

**NO agregues estos campos de vuelta al schema** a menos que primero apliques la migración manualmente a Supabase.

### Lazy Prisma initialization

`lib/prisma.ts` usa un `Proxy` para lazy initialization. NO cambies esto a instanciación directa — el build estático de Next.js fallaría sin `DATABASE_URL`.

### Todos los queries deben filtrar por `organizationId`

No hay RLS en Supabase. El aislamiento multi-tenant es a nivel de aplicación.

### Emails fire-and-forget

Siempre usar `.catch(() => {})` en envíos de email. Nunca bloquear la respuesta.

### Zod `z.record()` requiere 2 argumentos

`z.record(z.string(), valueType)` — un argumento no compila.

### Campos `Json?` en Prisma

Usar `Prisma.DbNull` para NULL, `undefined` para omitir, valor directo para guardar.

### Supabase env vars — requeridas en Vercel

Estas variables DEBEN estar configuradas en Vercel → Settings → Environment Variables:

| Variable | Dónde obtenerla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role (secret) |
| `DATABASE_URL` | Supabase Dashboard → Settings → Database → Connection string (Transaction mode) |

Si falta alguna, la app falla con error explícito en `lib/supabase/*.ts`.

