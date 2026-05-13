# GestiOS — Plan para Completar el SaaS

> Generado: 2026-05-10 | Estado actual: ~80% completado | Objetivo: 100% vendible

---

## Diagnóstico Actual

### ✅ Lo que YA funciona (vendible hoy para BASICO/CRECER)
- Auth completo (signup → email confirm → setup → dashboard)
- Aislamiento multi-tenant (app-level, no RLS)
- Sistema de 4 planes con feature gates y límites
- 6 tipos de negocio con UI dinámica (labels, atributos, secciones)
- POS con carrito, variantes, descuentos, puntos de lealtad, pagos QR
- Gestión de productos con categorías, proveedores, variantes
- Gestión de pedidos con tracking de estado
- Gestión de clientes con puntos de lealtad
- Corte de caja
- Activity logging
- 10+ templates de email vía Brevo
- 7 cron jobs configurados
- Panel superadmin con impersonation
- Permisos por roles (5 roles)
- Audit logging (EMPRESARIAL)
- Schema SIAT + lib (falta intermediario real)
- Schema QR payments + lib (falta proveedor real)
- Sentry monitoring
- Security headers

### ❌ Lo que BLOQUEA ventas
1. **Sin billing automatizado** — No hay Paddle/Stripe. Los planes se gestionan manualmente con `PaymentRequest`. No se puede cobrar automáticamente.
2. **QR Bolivia es stub** — `qr-providers/AggregatorProvider` tiene `BASE_URL` y `API_KEY` vacíos. No acepta pagos reales.
3. **SIAT es stub** — `lib/siat.ts` apunta a `api.facturapi.bo/v1` (placeholder). Sin contrato con intermediario, no se pueden emitir facturas legales.
4. **WhatsApp no es multi-tenant** — Usa un solo `WA_PHONE_NUMBER_ID`. No rutea por tenant vía `OrgAddon.phoneNumberId`.
5. **Rate limiter es in-memory** — No funciona correctamente en serverless distribuido de Vercel.

### ⚠️ Implementaciones parciales
- E-commerce addon — API `/api/tienda` existe, no hay UI storefront
- Export contable — No hay implementación
- Páginas secundarias (ventas, reports, suppliers, branches, staff, caja, billing, addons, audit, discounts, categories) — existen pero profundidad variable
- Offline mode POS — No existe

---

## Análisis Competitivo

### Lo que TODOS los competidores tienen (table stakes)
| Feature | GestiOS | Alegra | Odoo | Lightspeed |
|---------|---------|--------|------|------------|
| Catálogo de productos | ✅ | ✅ | ✅ | ✅ |
| Facturación | ⚠️ (SIAT pending) | ✅ | ✅ | ✅ |
| Gestión de clientes | ✅ | ✅ | ✅ | ✅ |
| Inventario básico | ✅ | ✅ | ✅ | ✅ |
| Dashboard/reportes | ✅ | ✅ | ✅ | ✅ |
| Multi-usuario | ✅ | ✅ | ✅ | ✅ |
| POS integrado | ✅ | ⚠️ básico | ✅ | ✅ |
| **Personalización por vertical** | ✅ **ÚNICO** | ❌ | ❌ | ❌ |
| **Expiry/warranty tracking** | ✅ | ❌ | ✅ | ❌ |
| **Loyalty program nativo** | ✅ | ❌ | ✅ | ✅ |
| **WhatsApp nativo** | ✅ | ❌ | ⚠️ módulo | ❌ |
| **QR Bolivia** | ⚠️ (stub) | ❌ | ❌ | ❌ |
| Modo offline POS | ❌ | ❌ | ✅ | ✅ |
| Purchase orders | ❌ | ⚠️ básico | ✅ | ✅ |
| Multi-almacén | ⚠️ (sucursales schema) | ⚠️ limitado | ✅ | ✅ |
| Contabilidad integrada | ❌ | ✅ | ✅ | ❌ |

### Diferenciadores únicos de GestiOS
1. **UI adaptativa por tipo de negocio** — Ningún competidor cambia labels, atributos, y secciones según vertical (ropa=tallas/colores, farmacia=vencimientos, electrónica=garantías).
2. **Precio plano sin per-user tax** — Odoo cobra $8.95/user, Holded €7.50-49.50 + add-ons. GestiOS cobra por plan, no por usuario.
3. **QR Bolivia + SIAT Bolivia** — Integración local que competidores globales no tienen.
4. **WhatsApp nativo como feature core** — No un módulo separado.

---

## Plan de Ejución — 4 Fases

### Fase 1: "Cobrá" — Billing QR Local (1 semana)
**Objetivo:** Mejorar el flujo de pago QR local existente. NO se usa Stripe/Paddle.

**Flujo actual (ya funciona):**
1. Usuario elige plan + meses en `/billing`
2. Click "Solicitar por WhatsApp" → mensaje pre-armado a `59175470140`
3. Escanea QR Banco Ganadero (`/QR GANADERO GESTIOS.jpeg`) o transfiere a cuenta `1311455296`
4. Manda comprobante por WhatsApp → admin activa plan manualmente

**Mejoras necesarias:**

| Paso | Descripción | Archivos | Dependencias |
|------|-------------|----------|-------------|
| 1.1 | Crear QR de pago dinámico por solicitud (monto exacto visible) | `app/(dashboard)/billing/page.tsx`, `lib/qr-bolivia.ts` | — |
| 1.2 | Polling de estado de pago QR (confirmar automáticamente) | `app/(dashboard)/billing/page.tsx`, `app/api/qr-payments/route.ts` | 1.1 |
| 1.3 | Auto-activar plan cuando QR se confirma como PAGADO | `app/api/qr-payments/webhook/route.ts`, `lib/plans.ts` | 1.2 |
| 1.4 | Mantener flujo WhatsApp como fallback | `app/(dashboard)/billing/page.tsx` | — |

**Criterio de éxito:** Usuario elige plan → ve QR con monto exacto → paga → sistema detecta pago → activa plan automáticamente. WhatsApp como backup.

---

### Fase 2: "Cobra de verdad" — QR Bolivia + SIAT (3 semanas)
**Objetivo:** Habilitar pagos QR reales y facturación electrónica legal en Bolivia.

| Paso | Descripción | Archivos | Dependencias |
|------|-------------|----------|-------------|
| 2.1 | Integrar proveedor QR real (QR Switch / Tigo / BiPago) | `lib/qr-providers/qr-switch.ts`, `lib/qr-providers/tigo.ts`, `lib/qr-providers/bipago.ts` | — |
| 2.2 | Actualizar `qr-providers/index.ts` con factory real | `lib/qr-providers/index.ts` | 2.1 |
| 2.3 | Webhook de confirmación de pago QR | `app/api/qr-payments/webhook/route.ts` (actualizar) | 2.1 |
| 2.4 | Integrar intermediario SIAT real (FacturAPI.bo o similar) | `lib/siat.ts` | — |
| 2.5 | Flujo completo de emisión de factura electrónica | `app/api/invoices/route.ts` (actualizar) | 2.4 |
| 2.6 | PDF de factura para descarga/impresión | `app/print/factura/` | 2.5 |
| 2.7 | Renovación automática de CUFD vía cron | `app/api/cron/siat-cufd/route.ts` (actualizar) | 2.4 |

**Criterio de éxito:** Un cliente PRO puede generar un QR de pago → el cliente paga → el sistema confirma → se emite factura electrónica con CUFE válido.

---

### Fase 3: "Escala" — Infraestructura + Features Missing (2 semanas)
**Objetivo:** Resolver gaps de infraestructura y features que bloquean planes superiores.

| Paso | Descripción | Archivos | Dependencias |
|------|-------------|----------|-------------|
| 3.1 | Rate limiter con Redis/Upstash | `lib/rate-limit.ts` (reemplazar) | — |
| 3.2 | WhatsApp multi-tenant routing | `lib/whatsapp.ts`, `app/api/webhooks/whatsapp/route.ts` | — |
| 3.3 | Offline mode POS (service worker + IndexedDB) | `app/(dashboard)/pos/`, `public/sw.js` | — |
| 3.4 | Purchase orders (schema + API + UI) | `prisma/schema.prisma`, `app/api/purchase-orders/`, `app/(dashboard)/purchase-orders/` | — |
| 3.5 | Export contable (CSV/Excel para contador) | `app/api/accounting-export/`, `lib/accounting-export.ts` | — |
| 3.6 | E-commerce storefront básico | `app/tienda/[slug]/`, `app/api/tienda/` (completar) | — |
| 3.7 | Multi-warehouse/branch inventory | `app/api/branches/` (completar), UI de transferencia entre sucursales | — |

**Criterio de éxito:** Rate limiter funciona en serverless distribuido, WhatsApp rutea por tenant, POS funciona sin internet, existen purchase orders, export contable genera archivos válidos.

---

### Fase 4: "Pule" — UX, Testing, Launch (1 semana)
**Objetivo:** Pulir la experiencia del usuario y preparar para lanzamiento público.

| Paso | Descripción | Archivos | Dependencias |
|------|-------------|----------|-------------|
| 4.1 | Completar páginas secundarias (ventas, reports, suppliers, caja) | Páginas existentes | — |
| 4.2 | Landing page con pricing actualizado | `app/page.tsx`, `app/pricing/page.tsx` | — |
| 4.3 | Onboarding mejorado (tour interactivo, sample data) | `app/setup/`, `lib/sample-data.ts` | — |
| 4.4 | Tests de integración para flujos críticos | `tests/` | — |
| 4.5 | Documentación para usuarios (help center básico) | `app/help/` o docs externo | — |
| 4.6 | Analytics de producto (PostHog o similar) | `lib/analytics.ts`, middleware | — |
| 4.7 | Performance audit + optimización | Varios | — |

**Criterio de éxito:** Un usuario nuevo puede registrarse, completar setup, y hacer su primera venta en < 5 minutos sin soporte.

---

## Planes Recomendados (Actualizados)

### BASICO — $350 BOB/mes (~$50 USD)
**Para:** Negocio pequeño que recién empieza
- ✅ Hasta 150 productos
- ✅ Hasta 50 clientes
- ✅ 1 usuario staff
- ✅ POS básico
- ✅ Inventario (sin variantes)
- ✅ Pedidos
- ✅ Corte de caja
- ✅ 3 descuentos
- ✅ Categorías
- ✅ Dashboard con KPIs
- ❌ Reportes avanzados
- ❌ Proveedores
- ❌ Import/Export CSV
- ❌ Variantes de productos
- ❌ QR payments
- ❌ Tienda online
- ❌ Sucursales
- ❌ Facturación SIAT

### CRECER — $530 BOB/mes (~$76 USD)
**Para:** Negocio en crecimiento que necesita control
- ✅ Todo lo del Básico
- ✅ Hasta 500 productos
- ✅ Hasta 300 clientes
- ✅ 3 usuarios staff
- ✅ Variantes de productos
- ✅ Reportes avanzados
- ✅ Proveedores
- ✅ Import/Export CSV
- ✅ Alertas de stock
- ✅ Vencimientos (Farmacia/Suplementos)
- ✅ Descuentos ilimitados
- ❌ Tienda online
- ❌ QR payments
- ❌ Sucursales
- ❌ Facturación SIAT

### PRO — $800 BOB/mes (~$114 USD)
**Para:** Negocio establecido que quiere vender más
- ✅ Todo lo del Crecer
- ✅ Productos ilimitados
- ✅ Clientes ilimitados
- ✅ 10 usuarios staff
- ✅ Tienda Online (e-commerce)
- ✅ Pagos QR Bolivia
- ✅ Registro público de clientes
- ✅ Email marketing básico
- ✅ Garantías (Electrónica)
- ❌ Sucursales múltiples
- ❌ Facturación SIAT
- ❌ Audit log completo

### EMPRESARIAL — $1,250 BOB/mes (~$179 USD)
**Para:** Empresa con múltiples sucursales
- ✅ Todo lo del Pro
- ✅ Usuarios ilimitados
- ✅ Sucursales múltiples
- ✅ Audit log completo
- ✅ Facturación SIAT Bolivia
- ✅ Roles avanzados
- ✅ Email avanzado
- ✅ Export contable
- ✅ Soporte prioritario

### Add-ons (todos los planes)
| Addon | Precio | Descripción |
|-------|--------|-------------|
| WhatsApp Business | $40/mes | 300 conversaciones incluidas, excedente $0.08 c/u |
| Facturación SIAT | $25/mes | Incluido en EMPRESARIAL, addon para PRO |
| Pagos QR Bolivia | $15/mes | Incluido en PRO+, addon para CRECER |
| E-commerce | $20/mes | Incluido en PRO |
| Export Contable | $18/mes | Incluido en EMPRESARIAL |

---

## Priorización (ICE Score)

| Feature | Impact (1-5) | Confidence (1-5) | Effort (1-5) | ICE Score |
|---------|-------------|-----------------|-------------|-----------|
| Paddle billing | 5 | 5 | 3 | **8.3** |
| QR Bolivia real | 5 | 4 | 4 | **5.0** |
| SIAT real | 5 | 4 | 4 | **5.0** |
| Rate limiter Redis | 4 | 5 | 2 | **10.0** |
| WhatsApp multi-tenant | 4 | 4 | 3 | **5.3** |
| Offline POS | 3 | 3 | 5 | **1.8** |
| Purchase orders | 3 | 3 | 3 | **3.0** |
| Export contable | 3 | 4 | 2 | **6.0** |
| E-commerce storefront | 4 | 3 | 4 | **3.0** |
| Landing page + pricing | 5 | 5 | 2 | **12.5** |
| Onboarding mejorado | 4 | 5 | 2 | **10.0** |
| Tests integración | 4 | 5 | 3 | **6.7** |

**Orden de ejecución recomendado:**
1. Landing page + pricing (quick win, habilita ventas)
2. Paddle billing (bloquea revenue automático)
3. Rate limiter Redis (infra crítica)
4. Onboarding mejorado (reduce churn temprano)
5. Export contable (valor para clientes)
6. Tests de integración (confianza)
7. WhatsApp multi-tenant
8. QR Bolivia real
9. SIAT real
10. Purchase orders
11. E-commerce storefront
12. Offline POS (nice-to-have, mayor effort)

---

## Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Paddle/LemonSqueezy fees altos (5%) | Media | Medio | Absorber en pricing o usar Stripe Atlas si escala |
| Proveedor QR Bolivia no responde | Media | Alto | Tener fallback a QR manual + webhook polling |
| Intermediario SIAT caro o inestable | Media | Alto | Evaluar 2+ proveedores, tener modo manual |
| WhatsApp API costoso | Media | Medio | Limitar conversaciones, cobrar excedente |
| Competidor lanza feature similar | Baja | Medio | La personalización por vertical es difícil de copiar |
| Clientes bolivianos sin tarjeta internacional | Alta | Alto | Mantener PaymentRequest manual como fallback + QR Bolivia para cobros |

---

## Timeline Estimado

| Semana | Fase | Entregable |
|--------|------|------------|
| 1 | Fase 1 | Landing page + pricing + onboarding sample data |
| 1 | Fase 3 | Rate limiter Redis/Upstash |
| 1 | Fase 4 | WhatsApp multi-tenant routing |
| 2-3 | Fase 2 | QR Bolivia real + SIAT real |
| 4 | Fase 3 | Features missing (purchase orders, export contable, e-commerce) |
| 5 | Fase 4 | UX polish + tests + launch ready |

**Total: 5 semanas para SaaS 100% vendible**

## Estado Actual (2026-05-10)

### ✅ Completado
- Landing page con diferenciador "tipos de negocio"
- Pricing page con precios en BOB
- Onboarding con sample data generator
- Rate limiter Redis/Upstash con fallback in-memory
- Billing QR local con auto-activación de plan
- WhatsApp multi-tenant routing por OrgAddon.phoneNumberId
- Páginas secundarias (ventas, reports, suppliers, caja) — ya estaban completas
- Tests actualizados (211 passing)

### ⏳ Pendiente (requiere proveedores externos)
- QR Bolivia real — necesita contrato con proveedor (QR Switch, Tigo, BiPago)
- SIAT Bolivia real — necesita intermediario (FacturAPI.bo o similar)
- Purchase orders — schema + API + UI
- Export contable — CSV/Excel para contador
- E-commerce storefront — tienda online sincronizada
