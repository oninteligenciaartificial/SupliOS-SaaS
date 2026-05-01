# Sentry — Error Monitoring

## Estado

Activo en producción desde 2026-04-30.

## Credenciales (en Vercel)

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | `https://6edff81a...ingest.us.sentry.io/...` |
| `SENTRY_ORG` | `onia-agency` |
| `SENTRY_PROJECT` | `javascript-nextjs` |

DSN completo no se documenta aquí — ver Vercel → Environment Variables.

## Dashboard

`onia-agency.sentry.io` — ver errores en tiempo real, stack traces, usuarios afectados.

## Archivos de configuración

| Archivo | Qué hace |
|---|---|
| `sentry.client.config.ts` | Init en browser — captura errores React + replays en error |
| `sentry.server.config.ts` | Init en Node.js (API routes, server components) |
| `sentry.edge.config.ts` | Init en Edge Runtime (middleware) |
| `next.config.ts` | `withSentryConfig` — source maps + Vercel monitors |

## Configuración actual

```typescript
// sentry.client.config.ts
tracesSampleRate: 0.1,          // 10% de requests trackeadas
replaysOnErrorSampleRate: 1.0,  // 100% de sesiones con error grabadas
replaysSessionSampleRate: 0.01, // 1% de sesiones normales grabadas
```

## Integración con lib/monitoring.ts

`reportAsyncError()` ya usa Sentry automáticamente cuando está configurado:

```typescript
// lib/monitoring.ts — fire-and-forget seguro
export function reportAsyncError(context: string, error: unknown, extra?: Record<string, unknown>) {
  // Si NEXT_PUBLIC_SENTRY_DSN está configurado, captura en Sentry
  // Si no, fallback a console.error
}
```

Está integrado en:
- `app/api/orders/route.ts` — errores de stock decrement
- `app/api/cron/siat-cufd/route.ts` — errores de refresh CUFD
- `app/api/qr-payments/webhook/route.ts` — errores de webhook QR
- `lib/qr-bolivia.ts` — errores de webhook event handling

## Alertas

Configurar en `onia-agency.sentry.io` → Alerts:
- **Error nuevo** — alerta inmediata por email
- **Error frecuente** — si un error supera 10 veces en 1 hora

## Plan

Free tier: 5,000 errores/mes. Suficiente para etapa actual.
