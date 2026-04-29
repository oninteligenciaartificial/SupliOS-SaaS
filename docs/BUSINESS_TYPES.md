# Tipos de Negocio y Variantes

## Configuración

Cada organización elige un `businessType` en Configuración → campo "Tipo de negocio". Determina qué ejes de variantes se ofrecen al crear productos.

Archivo: `lib/business-types.ts`

## Tipos disponibles

| Clave | Etiqueta |
|---|---|
| `GENERAL` | General |
| `ROPA` | Tienda de Ropa |
| `SUPLEMENTOS` | Suplementos Deportivos |
| `ELECTRONICA` | Electrónica |
| `FARMACIA` | Farmacia / Salud |
| `FERRETERIA` | Ferretería / Construcción |

## Schemas de variantes

Cada eje tiene opciones predefinidas (`string[]`) o es texto libre (array vacío).

### GENERAL
Sin variantes. El toggle "tiene variantes" no aparece.

### ROPA
```
talla: [XS, S, M, L, XL, XXL, XXXL]
color: []  ← texto libre
```

### SUPLEMENTOS
```
sabor: []  ← texto libre
peso:  [1lb, 2lb, 5lb, 10lb, 15lb]
```

### ELECTRONICA
```
capacidad: []  ← texto libre
color:     []  ← texto libre
```

### FARMACIA
```
presentacion: [Caja, Frasco, Blíster, Ampolla, Sobre]
dosis:        []  ← texto libre
```

### FERRETERIA
```
medida:   []  ← texto libre
material: []  ← texto libre
```

## Flujo en Inventario

1. Org con `businessType = "ROPA"` → al crear producto aparece toggle **"Este producto tiene variantes"**
2. Al activar → campo stock base se oculta
3. Panel de variantes: por cada eje del schema → dropdown (opciones predefinidas) o input (texto libre)
4. Cada variante tiene: atributos, SKU opcional, stock propio, precio propio (opcional)
5. Si `price` de variante es `null` → hereda precio del producto base
6. El `attributeSchema` elegido se guarda en el producto como snapshot

## Flujo en POS

1. Producto con `hasVariants=true` → al tocar abre `VariantSelectorModal`
2. Modal lista variantes activas con `stock > 0` (out-of-stock aparece tachado)
3. Al seleccionar → agrega al carrito con `cartKey = ${productId}__${variantId}`
4. Mismo producto en variante distinta = entrada separada en carrito
5. Al vender → `OrderItem` guarda `variantId` + `variantSnapshot` (atributos congelados al momento de la venta)

## Modelo de datos

```
Product
  hasVariants     Boolean   -- activa modo variantes
  attributeSchema Json?     -- { talla: [...], color: [...] }

ProductVariant
  attributes      Json      -- { talla: "M", color: "Negro" }
  sku             String?
  stock           Int       -- stock propio de esta variante
  price           Decimal?  -- null = hereda precio del producto

OrderItem
  variantId       String?
  variantSnapshot Json?     -- copia de attributes al momento de la venta
```

## Reglas importantes

- Si `hasVariants=true` → stock se descuenta de `ProductVariant`, NO de `Product`
- Si `hasVariants=false` → comportamiento original sin cambios (backward compatible)
- `GENERAL` → no muestra toggle de variantes (schema vacío)
- Eliminar variante = soft-delete (`active=false`), historial de pedidos intacto via `variantSnapshot`
