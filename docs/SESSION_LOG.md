# Session Log

---

## 2026-04-28

### Build error — Zod `z.record()` requiere 2 argumentos

**Error:**
```
Type error: Expected 2-3 arguments, but got 1.
app/api/orders/route.ts:21
variantSnapshot: z.record(z.unknown()).optional(),
```

**Causa:** La versión de Zod instalada requiere que `z.record()` reciba key type y value type explícitamente. `z.record(valueType)` no compila.

**Fix aplicado:**
```typescript
// Antes
variantSnapshot: z.record(z.unknown()).optional()

// Después
variantSnapshot: z.record(z.string(), z.unknown()).optional()
```

**Archivo:** `app/api/orders/route.ts` línea 21

**Contexto:** Campo agregado al implementar el sistema de variantes de producto (2026-04-28). El `variantSnapshot` guarda los atributos de la variante al momento de la venta (ej: `{ talla: "M", color: "Negro" }`).

---

## 2026-04-28 (2)

### Build error — Prisma no infiere `OrderItemUncheckedCreateWithoutOrderInput`

**Error:**
```
Type error: Property 'product' is missing in type
'{ productId: string; quantity: number; unitPrice: number;
   variantId: string | null; variantSnapshot: Record<string, unknown> | null; }'
but required in type 'OrderItemCreateWithoutOrderInput'.
app/api/orders/route.ts:94
```

**Causa:** Prisma genera dos variantes del tipo de creación para `OrderItem`:
- `OrderItemCreateWithoutOrderInput` — usa objetos de relación (`product: { connect: { id } }`)
- `OrderItemUncheckedCreateWithoutOrderInput` — usa IDs escalares (`productId: "..."`)

Al pasar `productId` directamente en un array de `create`, el compilador TS no puede resolver el union type y falla requiriendo el objeto `product`. Ocurre después de `prisma generate` con campos nuevos (`variantId`, `variantSnapshot`) que ampliaron el union.

**Fix aplicado:**
```typescript
// Importar el namespace de Prisma
import type { Prisma } from "@prisma/client";

// Tipar explícitamente el return del map para forzar la variante correcta
create: items.map((i): Prisma.OrderItemUncheckedCreateWithoutOrderInput => ({
  productId: i.productId,
  quantity: i.quantity,
  unitPrice: i.unitPrice,
  variantId: i.variantId ?? null,
  variantSnapshot: i.variantSnapshot ?? null,
})),
```

**Archivo:** `app/api/orders/route.ts` líneas 8 y 95

**Patrón general:** Cuando Prisma no puede inferir la variante Unchecked de un tipo, tipar explícitamente el callback del map con `Prisma.ModelUncheckedCreateWithout*Input`.

---

## 2026-04-28 (3)

### Build error — `null` no asignable a campo `Json?` en Prisma

**Error:**
```
Type error: Type 'Record<string, unknown> | null' is not assignable to
type 'NullableJsonNullValueInput | InputJsonValue | undefined'.
Type 'null' is not assignable to type 'NullableJsonNullValueInput | InputJsonValue | undefined'.
app/api/orders/route.ts:100
variantSnapshot: i.variantSnapshot ?? null,
```

**Causa:** Prisma no acepta `null` directo para campos `Json?`. Requiere el sentinel `Prisma.DbNull` para expresar "guardar NULL en la columna". Esto es un quirk de Prisma para distinguir entre "no enviar el campo" (`undefined`) y "guardar explícitamente NULL" (`Prisma.DbNull`).

**Fix aplicado:**
```typescript
// Cambiar import de type a valor para acceder a Prisma.DbNull
import { Prisma } from "@prisma/client";  // era: import type { Prisma }

// Usar Prisma.DbNull en lugar de null
variantSnapshot: i.variantSnapshot ?? Prisma.DbNull,
```

**Archivo:** `app/api/orders/route.ts` líneas 9 y 100

**Regla:** Para campos `Json?` en Prisma:
- No enviar el campo → `undefined`
- Guardar NULL en DB → `Prisma.DbNull`
- Guardar valor → el objeto/valor directamente

---
