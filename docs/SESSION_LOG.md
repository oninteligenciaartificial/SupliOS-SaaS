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