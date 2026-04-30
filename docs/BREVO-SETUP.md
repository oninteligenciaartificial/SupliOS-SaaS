# Brevo (Email) — Setup

## Variables de entorno requeridas

```env
BREVO_API_KEY=xkeysib-...                        # API key de Brevo — obtener en Brevo → Settings → SMTP & API → API Keys
EMAIL_FROM_ADDRESS=oninteligenciaartificial@gmail.com  # Remitente verificado en Brevo (temporal hasta tener dominio propio)
CRON_SECRET=...                                   # String aleatorio largo — Vercel lo envía en header Authorization
```

## Estado actual ✅ FUNCIONANDO

- **Brevo API key:** configurada en Vercel ✅
- **Remitente temporal:** `oninteligenciaartificial@gmail.com` — verificado en Brevo, emails llegando ✅
- **Pendiente:** verificar dominio propio con DKIM/SPF para usar `noreply@gestios.app`
  - Requiere dominio propio (no funciona con `.vercel.app`)
  - Comprar en Namecheap/Porkbun ~$12/año
  - Agregar registros SPF + DKIM + DMARC en DNS del dominio
  - Una vez verificado: cambiar `EMAIL_FROM_ADDRESS=noreply@gestios.app`

## Pasos para configurar Brevo

### 1. Crear cuenta
- Ir a https://app.brevo.com → Crear cuenta gratuita
- Plan gratuito: 300 emails/día, sin límite de contactos

### 2. Obtener API Key
- Dashboard → **Settings** → **SMTP & API** → **API Keys**
- Click "Create a new API key"
- Nombre: `gestios-production`
- Copiar la key → pegar en `BREVO_API_KEY` en Vercel

### 3. Verificar dominio remitente
- **Settings** → **Senders & IPs** → **Domains**
- Agregar tu dominio (ej. `gestios.app`)
- Agregar los registros DNS que Brevo indica (SPF, DKIM, DMARC)
- Sin verificación: emails van a spam o son rechazados

### 4. Verificar dirección alternativa (sin dominio propio)
- Si usás `@gmail.com` u otro dominio externo: **Senders & IPs** → **Senders** → Agregar y verificar
- Solo recomendado para desarrollo/testing

### 5. Configurar en Vercel
- Vercel Dashboard → tu proyecto → **Settings** → **Environment Variables**
- Agregar `BREVO_API_KEY` y `EMAIL_FROM_ADDRESS`
- Aplicar a Production + Preview

---

## Emails automáticos implementados

| Email | Disparador | Plan requerido |
|---|---|---|
| Bienvenida al cliente | POST `/api/registro` | Todos |
| Confirmación de pedido | POST `/api/orders` + checkout tienda | Todos |
| Alerta nuevo pedido (admin) | POST `/api/orders` | Todos |
| Actualización de estado | PATCH `/api/orders/[id]` | Todos |
| Puntos de lealtad acumulados | PATCH `/api/orders/[id]` (ENTREGADO) | Todos |
| Cumpleaños + código descuento | Cron 09:00 diario | EMPRESARIAL |
| Cliente inactivo (30 días) | Cron 10:00 diario | EMPRESARIAL |
| Productos por vencer (7 días) | Cron 08:00 diario | EMPRESARIAL |
| Stock bajo | Cron 08:30 diario | CRECER+ |
| Plan próximo a vencer | Cron 07:00 diario | Todos |
| Plan vencido | Cron 07:00 diario | Todos |
| Plan activado (pago aprobado) | Superadmin aprueba pago | Todos |

---

## Variable CRON_SECRET

Todos los cron jobs requieren header `Authorization: Bearer <CRON_SECRET>`.
Vercel lo agrega automáticamente. Solo asegurarse de tener:

```env
CRON_SECRET=un-string-largo-y-aleatorio
```

En Vercel Settings → Environment Variables.

---

## Testing local

Para probar sin Brevo real: dejar `BREVO_API_KEY` vacío → los emails se ignoran silenciosamente (ver `lib/email.ts`).

Para probar con Mailtrap:
1. Crear cuenta en https://mailtrap.io (gratis)
2. Usar SMTP credentials de Mailtrap — pero la integración actual usa la API REST de Brevo, no SMTP genérico
3. Alternativa: crear cuenta Brevo con email real de prueba y verificar esa dirección

---

## Límites del plan gratuito de Brevo

| Límite | Valor |
|---|---|
| Emails/día | 300 |
| Emails/mes | 9,000 |
| Contactos | Ilimitado |
| Templates | Ilimitado |

Para producción con múltiples orgs: actualizar a plan Starter ($25/mes → 20,000 emails/mes).
