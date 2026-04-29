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

## 2026-04-28 (4)

### Build error — `Record<string, unknown>` no asignable a `InputJsonValue`

**Error:**
```
Type error: Type 'Record<string, unknown> | DbNull' is not assignable to
type 'NullableJsonNullValueInput | InputJsonValue | undefined'.
Type 'Record<string, unknown>' is missing the following properties from
type 'readonly (InputJsonValue | null)[]': length, concat, join, slice...
app/api/orders/route.ts:100
variantSnapshot: i.variantSnapshot ?? Prisma.DbNull,
```

**Causa:** `Prisma.InputJsonValue` es un union estricto recursivo (string | number | boolean | InputJsonObject | readonly InputJsonValue[]). TS no acepta `Record<string, unknown>` como subtipo porque `unknown` es más amplio que `InputJsonValue`. Zod tipa el `variantSnapshot` como `Record<string, unknown>` (viene de `z.record(z.string(), z.unknown())`).

**Fix aplicado:**
```typescript
variantSnapshot: (i.variantSnapshot ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
```

**Archivo:** `app/api/orders/route.ts` línea 100

**Patrón:** Cuando Zod produce `Record<string, unknown>` y Prisma exige `InputJsonValue`, castear en el sitio de uso. Zod ya valida a runtime que el contenido es JSON-serializable.

---

## 2026-04-29

### Build error — Zod `z.record()` 1-arg en otros archivos

**Error:**
```
Type error: Expected 2-3 arguments, but got 1.
app/api/products/[id]/variants/route.ts:8
attributes: z.record(z.string()),
```

**Causa:** Mismo bug que entrada 1 — `z.record(valueType)` no compila en esta versión de Zod. Quedaron dos call sites más sin migrar.

**Fix aplicado:**
```typescript
// app/api/products/[id]/variants/route.ts:8
attributes: z.record(z.string(), z.string()),

// app/api/products/route.ts:23
attributeSchema: z.record(z.string(), z.array(z.string())).optional(),
```

**Archivos:** `app/api/products/[id]/variants/route.ts:8`, `app/api/products/route.ts:23`

**Acción preventiva:** `grep "z.record("` antes de build cada vez que se toca Zod schema.

---

## 2026-04-29 (2)

### Build error — `attributeSchema` `null` no asignable a `Json?`

**Error:**
```
Type error: Type 'Record<string, string[]> | null' is not assignable to
type 'NullableJsonNullValueInput | InputJsonValue | undefined'.
app/api/products/route.ts:101
attributeSchema: attributeSchema ?? null,
```

**Causa:** Igual que entradas 3-4 — `Product.attributeSchema` es `Json?` en Prisma, no acepta `null` directo. Faltó migrarlo cuando se introdujo `Prisma.DbNull` para `OrderItem.variantSnapshot`.

**Fix aplicado:**
```typescript
import { Prisma } from "@prisma/client";
// ...
attributeSchema: (attributeSchema ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
```

**Archivo:** `app/api/products/route.ts:2,102`

**Acción preventiva:** revisar PATCH/PUT de productos y cualquier route que escriba `attributeSchema` o `variantSnapshot`.

---

## 2026-04-29 (3)

### Build error — `??` mezclado con `||` sin paréntesis

**Error:**
```
Turbopack build failed:
app/(dashboard)/pos/page.tsx:209
customerName: selectedCustomer?.name ?? customerName.trim() || "Cliente mostrador",
```

**Causa:** JS/TS no permite mezclar `??` con `||` sin agrupar — ambigüedad de precedencia, error de parser.

**Fix:**
```typescript
// Antes
selectedCustomer?.name ?? customerName.trim() || "Cliente mostrador"
// Después
(selectedCustomer?.name ?? customerName.trim()) || "Cliente mostrador"
```

**Regla:** Nunca mezclar `??` con `||`/`&&` sin paréntesis.

---

## 2026-04-29 (4)

### Build error — `Parameters<typeof prisma.$transaction>[0]` resuelve overload de función, no de array

**Error:**
```
app/api/orders/route.ts(98): TS2352 — Conversion to '(prisma) => Promise<R>' may be a mistake
app/api/orders/route.ts(142): TS2488 — Type 'unknown' must have '[Symbol.iterator]()'
app/api/orders/route.ts(148): TS7006 — Parameter 'i' implicitly has 'any' type
```

**Causa:** `prisma.$transaction` tiene dos overloads (array-form y function-form). `Parameters<>` resuelve al **último** overload definido (function-form), no al array-form. Todo el downstream queda tipado como `unknown`.

**Fix:**
```typescript
// Separar la create op para capturar su tipo
const orderCreateOp = prisma.order.create({ ..., include: { items: { include: { product: true } }, customer: true } });
const stockOps = items.map(...);
const loyaltyOps = [...];

// Castear $transaction explícitamente al array-form
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const txResults = await (prisma.$transaction as (ops: any[]) => Promise<any[]>)([orderCreateOp, ...stockOps, ...loyaltyOps]);
const order = txResults[0] as Awaited<typeof orderCreateOp>;
```

**Regla:** No usar `Parameters<typeof prisma.$transaction>[0]`. Castear directamente o usar `Prisma.PrismaPromise<any>[]`.

---

## 2026-04-29 (5)

### Build error — `before: unknown` no asignable a `ReactNode` en JSX

**Error:**
```
app/(dashboard)/audit/page.tsx(144): TS2322 — Type 'unknown' is not assignable to type 'ReactNode'
app/(dashboard)/audit/page.tsx(152): TS2322 — Type 'unknown' is not assignable to type 'ReactNode'
```

**Causa:** `{log.before && <div>}` con `before: unknown` produce `unknown | false | JSX.Element` — TypeScript no puede asignar `unknown` a `ReactNode`.

**Fix:**
```typescript
// Antes
before: unknown;
after: unknown;
// Después
before: Record<string, unknown> | null;
after: Record<string, unknown> | null;
```

**Regla:** Para campos JSON de API en JSX, usar `Record<string, unknown> | null`. `null` es falsy → `&&` funciona. `unknown` no lo es.

---
