# Flujo de Onboarding

Dos flujos distintos: **registro del negocio** (owner) y **registro de cliente** (cliente del negocio).

---

## Flujo 1: Registro del negocio (owner/admin)

### Paso 1 — Crear cuenta Supabase
`/signup` → formulario email + contraseña → Supabase crea el usuario.

### Paso 2 — Setup de organización
El middleware detecta que el usuario tiene sesión pero no tiene `Profile`. Redirige a `/setup`.

`/setup` → dos campos:
- **Nombre de la tienda** → se convierte en `slug` único: `nombre-en-minusculas-timestamp36`
- **Tu nombre** → nombre del perfil ADMIN

POST `/api/setup`:
- Crea `Organization` con `plan: BASICO`, `trialEndsAt: ahora + 7 días`
- Crea `Profile` con `role: ADMIN`
- Todo en una `prisma.$transaction`
- Retorna `{ organizationId }`

### Paso 3 — Dashboard
Redirect a `/` → layout detecta perfil y org → redirige a `/dashboard`.

**Primera vez en el dashboard:** el negocio tiene:
- Plan BASICO activo (7 días de trial)
- 0 productos, 0 clientes
- businessType = "GENERAL"
- Sin categorías, sin staff

### Pasos opcionales de configuración
En `/settings`:
1. Cambiar nombre, teléfono, dirección, RFC
2. Seleccionar **tipo de negocio** (ROPA, SUPLEMENTOS, etc.)
3. Seleccionar moneda (default BOB)

---

## Flujo 2: Registro de cliente (cliente del negocio)

Solo disponible en plan **PRO+**.

### Página pública
`/registro/[slug]` — accesible sin autenticación. El slug identifica el negocio.

**Datos del formulario:** nombre, teléfono, email, dirección, fecha de nacimiento.

### Backend
POST `/api/registro` → crea `Customer` vinculado a la org del slug.  
Envía email de bienvenida (`sendWelcomeEmail`) si el cliente tiene email.

---

## Flujo 3: Plan vencido

Si `planExpiresAt < ahora` y el trial terminó:

```
layout.tsx detecta plan vencido
  → redirect("/plan-vencido")
```

En `/plan-vencido`:
- Mensaje de cuenta suspendida
- Instrucciones para renovar (contactar soporte / pagar via WhatsApp)
- Datos **no se pierden** — solo acceso bloqueado

Para renovar: el owner hace un `PaymentRequest` (QR boliviano). El superadmin confirma en `/superadmin/payments` → activa plan → envía email de confirmación.

---

## Flujo 4: Invitar staff

En `/staff` (ADMIN o MANAGER):
1. Envía invitación con email del nuevo usuario
2. El usuario se registra en Supabase
3. Al hacer login → detecta que no tiene perfil
4. El sistema lo conecta a la org del ADMIN que lo invitó

*(El flujo exacto de invitación depende de la implementación actual de `/api/team`)*

---

## Diagrama general

```
Nuevo owner
  → /signup (Supabase Auth)
  → /setup (crea org + profile ADMIN)
  → /dashboard
      ├── /settings (configura tipo de negocio, moneda)
      ├── /inventory (agrega productos)
      ├── /customers (agrega clientes)
      └── /pos (primera venta)

Cliente del negocio
  → /registro/[slug] (formulario público)
  → se crea Customer en la org
  → email de bienvenida

Plan vencido
  → redirect /plan-vencido
  → PaymentRequest (QR manual)
  → Superadmin confirma
  → Plan activo de nuevo
```

---

## Estados de trial y plan

| Estado | Condición | Efecto |
|---|---|---|
| Trial activo | `trialEndsAt > ahora` | Acceso completo (plan BASICO limits) |
| Trial vencido, plan activo | `planExpiresAt > ahora` | Acceso según plan |
| Plan vencido | `planExpiresAt < ahora && !trialActivo` | Redirect a /plan-vencido |
| Sin `planExpiresAt` | null | Acceso indefinido (cuentas manuales) |
