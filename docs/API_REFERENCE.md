# API Reference

Base path: `/api`. Todas las rutas requieren sesión Supabase activa.  
Formato de respuesta paginada: `{ data: T[], meta: { total, page, limit, pages } }`  
Formato de error: `{ error: string, upgrade?: true, requiredPlan?: PlanType }`

---

## /api/me

### GET /api/me
Retorna el perfil del usuario autenticado + org.

**Response:** `Profile & { email: string, organization: Organization }`

Si SUPERADMIN está impersonando: retorna con `role: "ADMIN"` y org impersonada.

### PATCH /api/me
Actualiza perfil y/o organización.

**Permiso requerido:** Solo ADMIN puede editar datos de org.

**Body:**
```json
{
  "name": "string",
  "orgName": "string",
  "orgPhone": "string",
  "orgAddress": "string",
  "orgRfc": "string",
  "orgLogoUrl": "string",
  "orgCurrency": "string",
  "orgBusinessType": "GENERAL|ROPA|SUPLEMENTOS|ELECTRONICA|FARMACIA|FERRETERIA"
}
```

**Response:** `{ ok: true }`

---

## /api/products

### GET /api/products
Lista productos activos de la org.

**Query params:**
- `search` — filtro por nombre (insensible a mayúsculas)
- `categoryId` — filtro por categoría
- `page` (default 1), `limit` (default 100, max 200)

**Response:** paginada. Incluye `category`, `supplier`, `variants[]` (solo activos).

### POST /api/products
**Permiso:** `products:create`  
**Límite plan:** BASICO 150, CRECER 500, PRO/EMPRESARIAL ∞

**Body:**
```json
{
  "name": "string (required)",
  "description": "string?",
  "sku": "string?",
  "barcode": "string?",
  "unit": "string?",
  "categoryId": "string?",
  "supplierId": "string?",
  "price": 0,
  "cost": 0,
  "stock": 0,
  "minStock": 5,
  "batchExpiry": "ISO date?",
  "imageUrl": "string?",
  "hasVariants": false,
  "attributeSchema": { "talla": ["XS","S","M"], "color": [] }
}
```

Nota: si `hasVariants=true`, `stock` se guarda como 0 (se maneja por variantes).

---

## /api/products/[id]

### PATCH /api/products/[id]
**Permiso:** solo ADMIN.  
Campos actualizables: `name`, `description`, `sku`, `categoryId`, `supplierId`, `price`, `cost`, `stock`, `minStock`, `active`.

### DELETE /api/products/[id]
**Permiso:** solo ADMIN.  
Soft-delete: pone `active: false`.

---

## /api/products/[id]/variants

### GET /api/products/[id]/variants
Retorna variantes activas del producto.

### POST /api/products/[id]/variants
**Permiso:** `products:create`

**Body:**
```json
{
  "attributes": { "talla": "M", "color": "Negro" },
  "sku": "string?",
  "stock": 0,
  "price": null
}
```

### PATCH /api/products/[id]/variants?variantId=xxx
**Permiso:** `products:edit`

**Body (todos opcionales):** `attributes`, `sku`, `stock`, `price`, `active`

### DELETE /api/products/[id]/variants?variantId=xxx
**Permiso:** `products:delete`  
Soft-delete: `active: false`.

---

## /api/products/stock-entry

### POST /api/products/stock-entry
**Permiso:** solo ADMIN.  
Incrementa stock del producto base (no soporta variantes aún).

**Body:**
```json
{
  "productId": "string",
  "quantity": 1,
  "notes": "string?"
}
```

**Response:** producto actualizado.

---

## /api/products/export — /api/products/import

### GET /api/products/export
**Permiso:** `products:export` (CRECER+)  
Descarga CSV de productos.

### POST /api/products/import
**Permiso:** `products:import` (CRECER+)  
Sube CSV de productos. `multipart/form-data` con campo `file`.

---

## /api/orders

### GET /api/orders
**Query params:**
- `status` — `PENDIENTE|CONFIRMADO|ENVIADO|ENTREGADO|CANCELADO`
- `page`, `limit` (max 200)

**Response:** paginada. Incluye `items[].product`, `customer`, `staff`.

### POST /api/orders
**Permiso:** `orders:create`

**Body:**
```json
{
  "customerName": "string (required)",
  "customerId": "string?",
  "paymentMethod": "EFECTIVO|TARJETA|TRANSFERENCIA",
  "shippingAddress": "string?",
  "notes": "string?",
  "items": [
    {
      "productId": "string",
      "quantity": 1,
      "unitPrice": 0,
      "variantId": "string?",
      "variantSnapshot": { "talla": "M" }
    }
  ]
}
```

**Efectos secundarios:**
- Decrementa stock (variante si `variantId`, producto si no)
- Envía email de confirmación al cliente (si tiene email)
- Envía alerta de nuevo pedido a admins de la org

---

## /api/orders/[id]

### GET /api/orders/[id]
Retorna pedido con items y cliente.

### PATCH /api/orders/[id]
**Permiso:** `orders:edit`

**Body:**
```json
{
  "status": "PENDIENTE|CONFIRMADO|ENVIADO|ENTREGADO|CANCELADO",
  "notes": "string?"
}
```

**Efectos secundarios:**
- Cancela → restaura stock
- Des-cancela → re-decrementa stock
- Cambia estado → envía email de actualización al cliente
- Marca ENTREGADO → acumula puntos de lealtad (1 punto por Bs. 10)

---

## /api/customers

### GET /api/customers
**Permiso:** `customers:view`

**Query params:** `search` (nombre/phone/email), `page`, `limit` (default 100)

### POST /api/customers
**Permiso:** `customers:create`  
**Límite plan:** BASICO 50, CRECER 300, PRO/EMPRESARIAL ∞

**Body:**
```json
{
  "name": "string (required)",
  "phone": "string?",
  "email": "string?",
  "address": "string?",
  "rfc": "string?",
  "birthday": "ISO date?",
  "notes": "string?"
}
```

---

## /api/customers/[id]

### GET, PATCH, DELETE — CRUD estándar
**Permiso:** `customers:view/edit`

---

## /api/customers/export — /api/customers/import
**Permiso:** `csv_export/csv_import` (CRECER+)

---

## /api/categories

### GET /api/categories — lista todas
### POST /api/categories — `{ name: string }`
### PATCH /api/categories/[id] — `{ name: string }`
### DELETE /api/categories/[id] — elimina si no tiene productos

---

## /api/suppliers
Plan CRECER+. CRUD estándar: `{ name, contact?, phone?, email?, notes? }`

---

## /api/discounts
CRUD estándar.

**Body POST:**
```json
{
  "code": "VERANO20",
  "description": "string?",
  "type": "PORCENTAJE|MONTO_FIJO",
  "value": 20,
  "expiresAt": "ISO date?"
}
```

---

## /api/branches
Plan EMPRESARIAL. CRUD: `{ name, address?, phone? }`

---

## /api/reports

### GET /api/reports
Plan CRECER+.

**Query params:** `from` (ISO date), `to` (ISO date) — default mes actual.

**Response:**
```json
{
  "currency": "BOB",
  "totalRevenue": 0,
  "totalOrders": 0,
  "totalCustomers": 0,
  "totalMargin": 0,
  "topSelling": [{ "name", "quantity", "revenue", "margin" }],
  "salesByCategory": [{ "name", "revenue", "quantity" }],
  "topCustomers": [{ "customerId", "customerName", "total", "orders" }],
  "lowStock": [{ "id", "name", "stock", "minStock" }],
  "paymentBreakdown": { "EFECTIVO": 0, "TARJETA": 0 },
  "salesByStaff": [{ "staffId", "staffName", "total", "orders" }],
  "noMovement": [{ "id", "name", "stock", "updatedAt" }]
}
```

---

## /api/reports/caja
Reporte de corte de caja por turno/día.

---

## /api/addons

### GET /api/addons
Retorna add-ons activos de la org.

---

## /api/payments

### POST /api/payments
Crea solicitud de pago manual (QR boliviano). Gestionada desde superadmin.

---

## /api/activity-log

### GET /api/activity-log
Feed de actividad de la org. Todos los planes.

---

## /api/setup

### POST /api/setup
Solo para usuarios sin perfil. Crea org + profile ADMIN.

**Body:**
```json
{
  "organizationName": "string",
  "userName": "string"
}
```

Crea org con slug único y trial de 7 días. **Solo funciona una vez por usuario.**

---

## /api/superadmin/impersonate

### POST — inicia impersonación (guarda cookie `impersonate_org_id`)
### DELETE — termina impersonación

---

## /api/cron/*

Endpoints internos para Vercel Cron. No requieren sesión de usuario pero verifican header de autorización.

| Ruta | Acción |
|---|---|
| `GET /api/cron/birthday` | Emails de cumpleaños |
| `GET /api/cron/expiry` | Alertas de vencimiento (7 días) |
| `GET /api/cron/inactive-customers` | Emails a clientes inactivos 30+ días |
| `GET /api/cron/plan-expiry` | Alerta y suspensión de planes vencidos |

---

## /api/webhooks/whatsapp

### GET — verificación del webhook Meta
### POST — recepción de mensajes entrantes

---

## Códigos de error comunes

| Status | Significado |
|---|---|
| 401 | Sin sesión |
| 403 | Sin permiso, o límite de plan alcanzado (`upgrade: true`) |
| 404 | Recurso no encontrado o no pertenece a la org |
| 400 | Body inválido o JSON malformado |
| 409 | Conflicto (ej: setup duplicado, slug ya existe) |
