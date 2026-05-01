# Pagos QR Bolivia

## Estado

Scaffold completo implementado. **Requiere PSP externo para activar.**

## Variables de entorno requeridas

```env
QR_BOLIVIA_AGGREGATOR_URL=https://api.tu-psp.bo/v1
QR_BOLIVIA_AGGREGATOR_KEY=...
QR_BOLIVIA_WEBHOOK_SECRET=...
QR_BOLIVIA_DEFAULT_EXPIRY_MINUTES=15   # opcional, default 15
```

## Credenciales por tenant (en OrgAddon.config)

| Campo | Descripción |
|---|---|
| `provider` | "AGGREGATOR" (default) — en v2: "QR_SWITCH", "TIGO", "BIPAGO" |
| `merchantId` | ID de comercio asignado por el PSP |
| `accountAlias` | Alias de cuenta (requerido por QR SWITCH BCB) |
| `callbackOverrideUrl` | URL webhook custom (opcional, usa la global por defecto) |

## Flujo de pago

```
1. Org tiene plan PRO+ y addon QR_BOLIVIA activo
2. Superadmin activa addon + configura merchantId en OrgAddon.config
3. En el POS: POST /api/qr-payments/[orderId] → retorna qrPayload + expiresAt
4. Frontend renderiza QR (EMVCo string o qrImageUrl) — cliente escanea con app bancaria
5. PSP llama webhook POST /api/qr-payments/webhook → verifica HMAC → actualiza QrPayment
6. Si webhook no llega: GET /api/qr-payments/[orderId] hace poll al PSP
7. Al confirmar pago: QrPayment.status = PAGADO, Order.status = ENTREGADO
8. Cron /api/cron/expire-qr cada 5 min marca QRs vencidos como EXPIRADO
```

## API Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/qr-payments/[orderId]` | Genera QR para el pedido |
| GET  | `/api/qr-payments/[orderId]` | Estado del QR (con poll al PSP si pendiente) |
| DELETE | `/api/qr-payments/[orderId]` | Cancela QR activo |
| POST | `/api/qr-payments/webhook` | Callback del PSP (HMAC verificado) |

### Body POST (ninguno requerido — usa order.total automático)

```json
{}
```

### Response POST 201

```json
{
  "qrPaymentId": "cuid...",
  "qrPayload": "00020101...",
  "qrImageUrl": "https://...",
  "expiresAt": "2026-05-01T12:15:00Z"
}
```

## Webhook del PSP

El PSP debe enviar POST a `https://gestios.app/api/qr-payments/webhook` con:
- Header `x-qr-signature` o `x-webhook-signature` — HMAC-SHA256 del body con `QR_BOLIVIA_WEBHOOK_SECRET`
- Body JSON con campos: `id` (externalId), `status` (paid/expired/cancelled/failed), `paid_at?`, `payer?`

GestiOS responde 200 inmediatamente y procesa async.

## Cron jobs

| Cron | Horario | Función |
|---|---|---|
| `/api/cron/expire-qr` | cada 5 min | Marca QRs PENDIENTE con `expiresAt < now()` como EXPIRADO |

## PSPs compatibles en v1

| PSP | Integración | Notas |
|---|---|---|
| **Aggregator genérico** | REST via `QR_BOLIVIA_AGGREGATOR_URL` | Default; compatible con Kuapay, PaymentsGateway.bo |
| QR SWITCH BCB | stub (v2) | Requiere afiliación banco + `accountAlias` |
| Tigo Money | stub (v2) | API REST directa |
| BiPago | stub (v2) | API REST directa |

## Plan y addon requeridos

- Plan mínimo: `PRO` — feature gate `pagos_qr` en `lib/plans.ts`
- Addon: `QR_BOLIVIA` debe estar activo en `OrgAddon`

## Para activar en producción

1. Contratar PSP (recomendado: aggregador como Kuapay / PaymentsGateway.bo)
2. Obtener credenciales (`URL`, `API_KEY`, `WEBHOOK_SECRET`)
3. Agregar env vars a Vercel → Environment Variables
4. Correr `prisma migrate deploy` en prod (o ejecutar la migración SQL manual)
5. Superadmin activa addon `QR_BOLIVIA` para la org + configura `merchantId` en config
6. Registrar `https://gestios.app/api/qr-payments/webhook` como callback en el PSP

## Archivos implementados

- `lib/qr-providers/types.ts` — interfaz `QrProvider`, tipos de entrada/salida
- `lib/qr-providers/aggregator.ts` — implementación REST + verificación HMAC-SHA256
- `lib/qr-providers/index.ts` — resolver de provider por config
- `lib/qr-bolivia.ts` — `generateQR`, `checkStatus`, `cancelPayment`, `handleWebhookEvent`, `expireStaleQrs`
- `app/api/qr-payments/[orderId]/route.ts` — GET / POST / DELETE
- `app/api/qr-payments/webhook/route.ts` — POST webhook
- `app/api/cron/expire-qr/route.ts` — cron expiración
- `prisma/schema.prisma` — modelo `QrPayment` + enum `QrPaymentStatus`
- `prisma/migrations/20260501000000_qr_payments/migration.sql`
