# GestiOS — Changelog Mayo 2026

## 2026-05-13 — Deploy masivo + nuevas features

### Deploy completo
- **Commit:** `8163631`
- **67 archivos** cambiados, 3808 inserciones
- **Producción:** https://gesti-os.vercel.app
- **Build:** Next.js 16.2.3, 83 páginas, TypeScript OK, 44s

### Landing page mejorada (`app/page.tsx`)
- Nueva sección "Cómo funciona" (4 pasos)
- Testimonios de clientes (3 ejemplos)
- FAQ (6 preguntas frecuentes)
- CTA final mejorado
- Nav sticky con backdrop blur

### Pricing page mejorada (`app/pricing/page.tsx`)
- Toggle mensual/anual con descuento 10%
- CTA con plan pre-seleccionado (`/signup?plan=pro`)
- Tabla comparativa detallada (20 features × 4 planes)
- Badges de ahorro anual
- Footer con CTA

### Signup con plan pre-seleccionado (`app/signup/page.tsx`)
- Lee `?plan=` de URL y muestra badge del plan seleccionado
- Suspense boundary para `useSearchParams`

### Export contable mejorado (`lib/accounting-export.ts`)
- **4 tipos de export:**
  1. `ventas` — Detalle de cada venta con margen, categoría, NIT
  2. `resumen` — Resumen financiero por método de pago, mes, estado
  3. `clientes` — CRM completo con total compras, puntos lealtad, última compra
  4. `inventario` — Stock actual con variantes, costos, proveedor
- Gate: add-on CONTABILIDAD o plan CRECER+ (csv_export feature)
- CSV con escape correcto de comas y comillas
- Rate limiting aplicado

### UI de reportes actualizada (`app/(dashboard)/reports/page.tsx`)
- 5 botones de export: Resumen, Ventas, Resumen Financiero, Clientes, Inventario
- Responsive (oculta los menos usados en pantallas pequeñas)

### Purchase Orders — Feature completa

#### Schema (`prisma/schema.prisma`)
- Modelo `PurchaseOrder` con status: BORRADOR → ENVIADO → PARCIAL → RECIBIDO / CANCELADO
- Modelo `PurchaseOrderItem` con productId, quantity, unitCost, received
- Relaciones con Supplier y Product
- Migración: `prisma/migrations/20260513120000_add_purchase_orders/migration.sql`

#### API (`app/api/purchase-orders/route.ts`)
- `GET` — Lista con paginación, filtros por status y supplier
- `POST` — Crea orden con items, valida supplier del org, log audit
- `PATCH` — Actualiza status/notas, si RECIBIDO → actualiza stock de productos
- `DELETE` — Elimina (no permite si ya RECIBIDO)

#### UI (`app/(dashboard)/purchase-orders/page.tsx`)
- Lista con filtros por status (badges con iconos)
- Modal de creación con selector de proveedor, productos, cantidades y costos
- Modal de detalle con opción de cambiar status
- Al marcar RECIBIDO → actualiza stock automáticamente
- Total calculado en tiempo real

### n8n workflows mejorados

#### `n8n/brevo-email-tracking.json` (Webhook)
- Agregado nodo de deduplicación (Code node con staticData)
- Timeout de 10s en HTTP request
- onError: continueRegularOutput (no falla el workflow)
- Filtro doble: existe + no vacío
- Formato de evento normalizado para GestiOS API

#### `n8n/brevo-email-tracking-polling.json` (Polling)
- Cada 5 minutos
- Fetch Brevo Statistics API (100 eventos, último día)
- Deduplicación por messageId (últimos 1000 IDs)
- Filtra eventos de últimos 5 minutos
- Envía batch a GestiOS API

#### `n8n/purchase-order-automation.json` (Nuevo)
- Cada 6 horas
- Fetch POs con status ENVIADO
- Detecta POs vencidas (past expectedDate)
- Calcula días de atraso
- Envía alerta a GestiOS (`/api/notifications/purchase-order-overdue`)
- Requiere env var: `GESTIOS_API_KEY`

### Documentación actualizada
- `docs/NEXT_STEPS.md` — Estado al 2026-05-13
- `docs/ANALYSIS.md` — Tests: 229, 13 files
- `docs/PLAN.md` — Deploy completado
- `docs/00-PROJECT-CONTEXT.md` — Estado actualizado
- `docs/SESSION_LOG.md` — Entrada 2026-05-13

---

## Pendiente para próximo deploy

### Requiere acción externa
1. **Aplicar migración de Purchase Orders a Supabase**
   - SQL en `prisma/migrations/20260513120000_add_purchase_orders/migration.sql`
   - Ejecutar en Supabase SQL Editor o con `npx prisma db push`

2. **Configurar env vars en Vercel**
   - `GESTIOS_API_KEY` — Para n8n purchase order automation

3. **Importar workflows n8n**
   - `n8n/brevo-email-tracking.json` (actualizado)
   - `n8n/brevo-email-tracking-polling.json` (actualizado)
   - `n8n/purchase-order-automation.json` (nuevo)

### Próximo sprint recomendado
1. Tests de integración para purchase orders
2. Tests de integración para export contable
3. Landing page: agregar screenshots reales del producto
4. Onboarding: tour interactivo + sample data auto-generado
5. Analytics: PostHog o similar
