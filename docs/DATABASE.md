# Base de Datos

PostgreSQL vía Supabase. ORM: Prisma. Fuente de verdad: `prisma/schema.prisma`.

## Enums

```
PlanType:             BASICO | CRECER | PRO | EMPRESARIAL
AddonType:            WHATSAPP | FACTURACION | MERCADOPAGO | ECOMMERCE | CONTABILIDAD
Role:                 SUPERADMIN | ADMIN | MANAGER | STAFF | VIEWER
OrderStatus:          PENDIENTE | CONFIRMADO | ENVIADO | ENTREGADO | CANCELADO
PaymentMethod:        EFECTIVO | TARJETA | TRANSFERENCIA
DiscountType:         PORCENTAJE | MONTO_FIJO
PaymentRequestStatus: PENDIENTE | CONFIRMADO | RECHAZADO
```

## Modelos

### Organization (`organizations`)
Tenant raíz. Todo dato lleva `organizationId`.

| Campo | Tipo | Notas |
|---|---|---|
| id | cuid | PK |
| name | String | |
| slug | String | unique — URL pública |
| currency | String | default "BOB" |
| businessType | String | default "GENERAL" |
| plan | PlanType | default BASICO |
| planExpiresAt | DateTime? | null = sin expiración |
| trialEndsAt | DateTime? | |
| stripeCustomerId / stripeSubId | String? | unique, para Stripe futuro |

---

### Profile (`profiles`)
Un profile por usuario Supabase. Liga `userId` (Auth UID) con org y rol.

| Campo | Tipo | Notas |
|---|---|---|
| userId | String | unique |
| organizationId | String? | null = SUPERADMIN sin org |
| role | Role | default STAFF |
| branchId | String? | sucursal asignada |

---

### Branch (`branches`)
Sucursales físicas. Solo plan EMPRESARIAL.

---

### OrgAddon (`org_addons`)
Add-ons activos por org. `unique([organizationId, addon])`.

| Campo | Tipo |
|---|---|
| addon | AddonType |
| active | Boolean |
| stripeItemId | String? |

---

### Product (`products`)

| Campo | Tipo | Notas |
|---|---|---|
| categoryId | String? | FK → Category (SetNull) |
| supplierId | String? | FK → Supplier (SetNull) |
| sku | String? | unique per org |
| price / cost | Decimal(10,2) | |
| stock | Int | ignorado si hasVariants=true |
| minStock | Int | threshold de alerta |
| batchExpiry | DateTime? | para farmacia/alimentos |
| hasVariants | Boolean | default false |
| attributeSchema | Json? | schema de ejes |
| active | Boolean | soft-delete |

Índice único: `(organizationId, sku)`

---

### ProductVariant (`product_variants`)

| Campo | Tipo | Notas |
|---|---|---|
| productId | String | FK → Product (cascade delete) |
| attributes | Json | `{ talla: "M", color: "Negro" }` |
| sku | String? | unique per org |
| stock | Int | stock propio |
| price | Decimal? | null = hereda precio del producto |
| active | Boolean | soft-delete |

Índices: `(productId, active)`, `(organizationId)`

---

### Customer (`customers`)

| Campo | Tipo |
|---|---|
| name / phone / email / address / rfc | String? |
| birthday | DateTime? |
| loyaltyPoints | Int |
| notes | String? |

---

### Order (`orders`)

| Campo | Tipo | Notas |
|---|---|---|
| customerId | String? | FK (SetNull) |
| staffId | String? | FK (SetNull) |
| branchId | String? | FK (SetNull) |
| customerName | String | snapshot del nombre |
| status | OrderStatus | |
| paymentMethod | PaymentMethod | |
| total | Decimal(10,2) | |

---

### OrderItem (`order_items`)

| Campo | Tipo | Notas |
|---|---|---|
| orderId | String | FK → Order (cascade) |
| productId | String | FK → Product (restrict) |
| variantId | String? | FK → ProductVariant (SetNull) |
| quantity | Int | |
| unitPrice | Decimal(10,2) | precio al momento de la venta |
| variantSnapshot | Json? | atributos congelados al vender |

Índice: `(variantId)`

---

### Discount (`discounts`)
`unique([organizationId, code])`

| Campo | Tipo |
|---|---|
| code | String |
| type | DiscountType |
| value | Decimal |
| active | Boolean |
| expiresAt | DateTime? |

---

### ActivityLog (`activity_logs`)
Feed de actividad. Disponible en todos los planes.

---

### AuditLog (`audit_logs`)
Log con JSON `before`/`after`. Solo plan EMPRESARIAL.

Índices: `(organizationId, createdAt)`, `(entityType, entityId)`

---

### PaymentRequest (`payment_requests`)
Solicitudes de pago manual via QR boliviano. Gestionadas desde superadmin.

| Campo | Tipo |
|---|---|
| plan | PlanType |
| months | Int |
| amountBOB | Decimal |
| status | PaymentRequestStatus |
| confirmedAt / confirmedBy | — |

---

### WaConversation (`wa_conversations`)
Conversaciones entrantes de WhatsApp. Solo si add-on WHATSAPP activo.

Índice: `(organizationId, openedAt)`

---

## Diagrama de relaciones (simplificado)

```
Organization
  ├── Profile[]
  ├── Branch[]
  ├── OrgAddon[]
  ├── Category[]
  ├── Supplier[]
  ├── Discount[]
  ├── Product[]
  │     └── ProductVariant[]
  ├── Customer[]
  ├── Order[]
  │     └── OrderItem[] → Product / ProductVariant
  ├── ActivityLog[]
  ├── AuditLog[]
  ├── PaymentRequest[]
  └── WaConversation[]
```

## Migraciones

Están en `prisma/migrations/`. Sin `DATABASE_URL` local — las migraciones se aplican en Vercel vía `prisma migrate deploy` en el build.

### `20260428000000_add_variants`
Agrega:
- `organizations.businessType`
- `products.hasVariants`, `products.attributeSchema`
- Tabla `product_variants` completa
- `order_items.variantId`, `order_items.variantSnapshot`
