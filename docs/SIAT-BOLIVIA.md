# SIAT Bolivia — Facturación Electrónica

## Estado

Scaffold completo implementado. **Requiere credenciales externas para activar.**

## Variables de entorno requeridas

```env
SIAT_API_KEY=...          # API key del intermediario (Nube Fiscal o FacturAPI Bolivia)
SIAT_API_URL=https://api.facturapi.bo/v1   # URL del intermediario elegido
```

## Credenciales por tenant (en Organization)

| Campo | Descripción |
|---|---|
| `nitEmisor` | NIT de la empresa (9 dígitos) — ingresar en Settings |
| `razonSocial` | Nombre legal para facturas |
| `siatCuis` | Código mensual del SIN — se renueva automático |
| `siatCufd` | Código diario del SIN — cron a las 06:00 diario |
| `siatNroFactura` | Secuencia incremental de facturas |
| `siatCertExpiry` | Fecha de vencimiento del certificado digital |

## Flujo de facturación

```
1. Org configura NIT + razonSocial en Settings
2. Superadmin activa addon FACTURACION para la org
3. Sistema obtiene CUIS (mensual) y CUFD (diario) del SIN vía intermediario
4. En cada pedido: POST /api/invoices/[orderId] → genera factura → retorna CUFE
5. CUFE se imprime como QR en la factura PDF
6. Si hay error: DELETE /api/invoices/[orderId] → anula en el SIN
```

## API Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/invoices/[orderId]` | Genera factura SIAT para un pedido |
| GET | `/api/invoices/[orderId]` | Consulta estado de la factura |
| DELETE | `/api/invoices/[orderId]` | Anula la factura en el SIN |

### Body POST

```json
{
  "razonReceptor": "Juan Pérez",
  "nitReceptor": "12345678"  // opcional — "99999999" si consumidor final
}
```

## Cron jobs

| Cron | Horario | Función |
|---|---|---|
| `/api/cron/siat-cufd` | 06:00 diario | Renueva CUFD para todas las orgs con addon FACTURACION activo |

## Intermediarios compatibles

| Intermediario | URL | Notas |
|---|---|---|
| **FacturAPI Bolivia** | https://facturapi.bo | REST, sandbox disponible, recomendado |
| **Nube Fiscal** | https://nubefiscal.com.bo | REST + SOAP |
| **Directo SIN** | https://siat.impuestos.gob.bo | SOAP, requiere certificado propio, complejo |

## Para activar en producción

1. Contratar intermediario (FacturAPI Bolivia recomendado)
2. Obtener `SIAT_API_KEY` y `SIAT_API_URL` del intermediario
3. Agregar a Vercel → Environment Variables
4. El tenant ingresa su NIT y razón social en Settings → Facturación
5. Superadmin activa addon `FACTURACION` para la org
6. Sistema auto-obtiene CUIS/CUFD al primer uso

## Plan requerido

`EMPRESARIAL` — feature gate `facturacion_siat` en `lib/plans.ts`

## Archivos implementados

- `lib/siat.ts` — `refreshCUIS`, `refreshCUFD`, `generateInvoice`, `voidInvoice`
- `app/api/invoices/[orderId]/route.ts` — GET / POST / DELETE
- `app/api/cron/siat-cufd/route.ts` — cron diario CUFD
- `prisma/schema.prisma` — modelo `Invoice` + campos SIAT en `Organization`
- `prisma/migrations/20260430000000_siat_invoice/migration.sql`
