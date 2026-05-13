# Brevo (Email) — Setup

## Variables de entorno requeridas

```env
BREVO_API_KEY=xkeysib-...                        # API key de Brevo — obtener en Brevo → Settings → SMTP & API → API Keys
BREVO_SENDER_EMAIL=oninteligenciaartificial@gmail.com  # Remitente verificado en Brevo
BREVO_SENDER_NAME=GestiOS                        # Nombre del remitente
BREVO_WEBHOOK_KEY=string-aleatorio-largo         # Key para verificar webhook (generar con crypto.randomUUID())
EMAIL_FROM_ADDRESS=oninteligenciaartificial@gmail.com  # Fallback si BREVO_SENDER_EMAIL no está
CRON_SECRET=...                                   # String aleatorio largo — Vercel lo envía en header Authorization
```

## Estado actual ✅ FUNCIONANDO CON LOGGING

- **Brevo API key:** configurada en Vercel ✅
- **Remitente:** `oninteligenciaartificial@gmail.com` — verificado en Brevo ✅
- **Email logging:** Cada envío se registra en `EmailLog` table ✅
- **Webhook Brevo:** Endpoint `/api/webhooks/brevo` para tracking de delivery ✅
- **Rate limiting:** 280 emails/día (buffer de 20 sobre el límite de 300) ✅
- **Dashboard métricas:** `/email-stats` para SUPERADMIN ✅
- **Pendiente:** verificar dominio propio para usar `noreply@gestios.app`
  - Ver `docs/EMAIL-MIGRATION-GUIDE.md`

## Arquitectura actualizada

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│  API Routes     │────>│  lib/email   │────>│  Brevo API   │
│  (orders, cron) │     │  (wrapper)   │     │  (SMTP)      │
└─────────────────┘     └──────┬───────┘     └──────────────┘
                               │
                               ▼
                        ┌──────────────┐     ┌──────────────┐
                        │  EmailLog    │<────│  Webhook     │
                        │  (Prisma DB) │     │  /api/webhooks/brevo
                        └──────────────┘     └──────────────┘
```

### n8n bridge (plan gratuito)

Brevo free plan no tiene webhooks nativos. Para tracking de delivery/bounce:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Brevo       │────>│  n8n workflow│────>│  GestiOS         │
│  (email sent)│     │  (polling)   │     │  /api/webhooks   │
└──────────────┘     └──────────────┘     └──────────────────┘
```

Workflow: `n8n/brevo-email-tracking.json`

**Para webhooks nativos:** actualizar a plan Starter ($25/mes) y configurar webhook directo en Brevo → Settings → Webhooks.

## Pasos para configurar Brevo

### 1. Crear cuenta
- Ir a https://app.brevo.com → Crear cuenta gratuita
- Plan gratuito: 300 emails/día, sin límite de contactos

### 2. Obtener API Key
- Dashboard → **Settings** → **SMTP & API** → **API Keys**
- Click "Create a new API key"
- Nombre: `gestios-production`
- Copiar la key → pegar en `BREVO_API_KEY` en Vercel

### 3. Verificar remitente
- **Settings** → **Senders & IPs** → **Senders** → Agregar y verificar
- Email: `oninteligenciaartificial@gmail.com` (o tu dominio propio)

### 4. Configurar webhook
- **Settings** → **Webhooks** → Add a Webhook
- URL: `https://gestios.app/api/webhooks/brevo`
- Eventos: delivered, bounce, blocked, spam
- Agregar `BREVO_WEBHOOK_KEY` en Vercel

### 5. Configurar en Vercel
- Vercel Dashboard → tu proyecto → **Settings** → **Environment Variables**
- Agregar las 5 variables arriba
- Aplicar a Production + Preview

---

## Emails automáticos implementados

| Email | Disparador | Plan requerido | Type |
|---|---|---|---|
| Bienvenida al cliente | POST `/api/registro` | Todos | `welcome_email` |
| Confirmación de pedido | POST `/api/orders` + checkout tienda | Todos | `order_confirmation` |
| Alerta nuevo pedido (admin) | POST `/api/orders` | Todos | `new_order_alert` |
| Actualización de estado | PATCH `/api/orders/[id]` | Todos | `order_status_update` |
| Puntos de lealtad acumulados | PATCH `/api/orders/[id]` (ENTREGADO) | Todos | `loyalty_points_email` |
| Cumpleaños + código descuento | Cron 09:00 diario | EMPRESARIAL | `birthday_email` |
| Cliente inactivo (30 días) | Cron 10:00 diario | EMPRESARIAL | `inactive_customer_email` |
| Productos por vencer (7 días) | Cron 08:00 diario | EMPRESARIAL | `expiry_alert` |
| Stock bajo | Cron 08:30 diario | CRECER+ | `low_stock_alert` |
| Plan próximo a vencer | Cron 07:00 diario | Todos | `plan_expiry_warning` |
| Plan activado (pago aprobado) | Superadmin aprueba pago | Todos | `plan_activated` |
| Plan vencido | Cron 07:00 diario | Todos | `plan_expired` |

---

## Testing

### Tests unitarios
```bash
npm test -- tests/email.test.ts
```

### Test manual (envía emails reales)
```bash
TEST_EMAIL=tu-email@gmail.com npx tsx scripts/test-emails.ts
```

### Dashboard de métricas
- URL: `/email-stats` (solo SUPERADMIN y ADMIN)
- Muestra: total enviados, entregados, rebotados, fallidos
- Filtros por tipo y estado

---

## Rate Limiting

- **Límite diario:** 280 emails (buffer de 20 sobre el límite de Brevo de 300)
- **Contador:** Usa Upstash Redis con fallback in-memory
- **Cuando se excede:** Los emails se registran como FAILED con error "Daily email limit reached"
- **Reset:** Automático a medianoche UTC

---

## Migración a dominio propio

Ver `docs/EMAIL-MIGRATION-GUIDE.md` para pasos completos.

Resumen rápido:
1. Comprar dominio (Namecheap, Porkbun, Cloudflare)
2. Configurar SPF, DKIM, DMARC en DNS
3. Verificar dominio en Brevo
4. Actualizar `BREVO_SENDER_EMAIL` en Vercel
5. Deploy

---

## Límites del plan gratuito de Brevo

| Límite | Valor |
|---|---|
| Emails/día | 300 |
| Emails/mes | 9,000 |
| Contactos | Ilimitado |
| Templates | Ilimitado |

Para producción con múltiples orgs: actualizar a plan Starter ($25/mes → 20,000 emails/mes).
