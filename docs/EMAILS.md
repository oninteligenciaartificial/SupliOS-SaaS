# Emails Automáticos

Proveedor: **Brevo API** (`BREVO_API_KEY`).  
Remitente: configurable con `EMAIL_FROM_ADDRESS` — actualmente `oninteligenciaartificial@gmail.com` (temporal).  
Template: HTML con diseño dark, fondo `#0a0a0a`, acento naranja `#ff6b00`.  
Todos los envíos son fire-and-forget (`.catch(() => {})`).

> **Pendiente:** verificar dominio propio para usar `noreply@gestios.app`. Ver `docs/BREVO-SETUP.md`.

---

## 1. Confirmación de pedido
**Función:** `sendOrderConfirmation()`  
**Trigger:** POST /api/orders — cuando el cliente tiene email  
**Destinatario:** cliente  
**Asunto:** `Pedido recibido — {orgName}`  
**Contenido:** tabla de items, total, método de pago, folio (últimos 8 chars del ID)

---

## 2. Alerta de nuevo pedido
**Función:** `sendNewOrderAlert()`  
**Trigger:** POST /api/orders — siempre  
**Destinatario:** todos los usuarios ADMIN de la org (via Supabase Auth)  
**Asunto:** `Nuevo pedido de {customerName} — {orgName}`  
**Contenido:** tabla de items, total, método de pago, nombre del cliente

---

## 3. Actualización de estado de pedido
**Función:** `sendOrderStatusUpdate()`  
**Trigger:** PATCH /api/orders/[id] — cuando el estado cambia y el cliente tiene email  
**Destinatario:** cliente  
**Asunto:** `Tu pedido está {estado} — {orgName}`  
**Contenido:** nombre del nuevo estado (color verde=ENTREGADO, rojo=CANCELADO, naranja=otros)

---

## 4. Puntos de lealtad acumulados
**Función:** `sendLoyaltyPointsEmail()`  
**Trigger:** PATCH /api/orders/[id] → estado ENTREGADO, cliente con email  
**Destinatario:** cliente  
**Asunto:** `+{n} puntos acumulados en {orgName}`  
**Contenido:** puntos ganados en el pedido, total acumulado  
**Regla:** 1 punto por cada Bs. 10 del total del pedido (`POINTS_PER_BOB = 0.1`)

---

## 5. Bienvenida al cliente
**Función:** `sendWelcomeEmail()`  
**Trigger:** registro en página pública `/registro/[slug]` (plan PRO+)  
**Destinatario:** cliente  
**Asunto:** `Bienvenido/a a {orgName}`  
**Contenido:** mensaje de bienvenida, aviso de puntos y ofertas

---

## 6. Feliz cumpleaños
**Función:** `sendBirthdayEmail()`  
**Trigger:** cron `GET /api/cron/birthday` — diario  
**Destinatario:** clientes con birthday = hoy y email registrado  
**Asunto:** `Feliz cumpleaños {nombre}! Regalo de {orgName}`  
**Contenido:** código de descuento + porcentaje. El código debe existir previamente en la org.

---

## 7. Alerta de stock bajo
**Función:** `sendLowStockAlert()`  
**Trigger:** `/api/email/stock-alert` (manual desde UI) y reportes  
**Destinatario:** admins de la org  
**Asunto:** `{n} producto(s) con stock bajo — {orgName}`  
**Contenido:** tabla con producto, stock actual, mínimo

---

## 8. Productos próximos a vencer
**Función:** `sendExpiryAlert()`  
**Trigger:** cron `GET /api/cron/expiry` — diario  
**Destinatario:** admins de la org  
**Asunto:** `{n} producto(s) próximos a vencer — {orgName}`  
**Contenido:** tabla con producto, fecha de vencimiento, días restantes (rojo ≤3, amarillo >3)

---

## 9. Cliente inactivo
**Función:** `sendInactiveCustomerEmail()`  
**Trigger:** cron `GET /api/cron/inactive-customers` — semanal  
**Destinatario:** clientes sin compras en 30+ días  
**Asunto:** `Te echamos de menos — {orgName}`  
**Contenido:** días desde última compra, llamado a volver

---

## 10. Advertencia de plan por vencer
**Función:** `sendPlanExpiryWarning()`  
**Trigger:** cron `GET /api/cron/plan-expiry`  
**Destinatario:** admin de la org  
**Asunto:** `Tu plan vence en {n} día(s) — {orgName}`  
**Contenido:** días restantes en amarillo, instrucciones de renovación

---

## 11. Plan activado
**Función:** `sendPlanActivatedEmail()`  
**Trigger:** superadmin confirma pago en `/superadmin/payments`  
**Destinatario:** admin de la org  
**Asunto:** `Plan {nombre} activado — {orgName}`  
**Contenido:** nombre del plan, fecha de vencimiento

---

## 12. Plan vencido
**Función:** `sendPlanExpired()`  
**Trigger:** cron `GET /api/cron/plan-expiry` — cuando el plan expira  
**Destinatario:** admin de la org  
**Asunto:** `Plan vencido — {orgName} necesita renovación`  
**Contenido:** aviso de suspensión, instrucciones para renovar

---

## Resumen de triggers

| Email | Quién lo dispara | Automático |
|---|---|---|
| Confirmación de pedido | POST /api/orders | Sí |
| Alerta nuevo pedido | POST /api/orders | Sí |
| Actualización de estado | PATCH /api/orders/[id] | Sí |
| Puntos de lealtad | PATCH /api/orders/[id] (ENTREGADO) | Sí |
| Bienvenida | Registro público | Sí |
| Cumpleaños | Cron diario | Sí (cron) |
| Stock bajo | Manual o cron | Mixto |
| Productos por vencer | Cron diario | Sí (cron) |
| Cliente inactivo | Cron semanal | Sí (cron) |
| Plan por vencer | Cron diario | Sí (cron) |
| Plan activado | Superadmin confirma pago | Manual |
| Plan vencido | Cron diario | Sí (cron) |
