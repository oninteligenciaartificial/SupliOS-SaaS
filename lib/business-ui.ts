import type { BusinessType } from "./business-types";

export interface BusinessUIConfig {
  // Labels generales
  productSingular: string;       // "Producto" | "Prenda" | "Suplemento" | ...
  productPlural: string;         // "Productos" | "Prendas" | ...
  categoryLabel: string;         // "Categoría" | "Colección" | "Línea" | "Marca" | "Laboratorio" | "Área"
  skuLabel: string;              // "SKU" | "Referencia" | "Modelo" | "Código"
  unitLabel: string;             // "Unidad" siempre pero con sugerencias distintas
  stockLabel: string;            // "Stock" | "Unidades" | "Stock"
  variantLabel: string;          // "Variante" | "Talla / Color" | "Sabor / Peso" | ...
  supplierLabel: string;         // "Proveedor" | "Marca / Proveedor" | ...

  // Placeholders
  searchPlaceholder: string;
  namePlaceholder: string;
  unitPlaceholder: string;

  // Visibilidad de campos en el formulario
  showBatchExpiry: boolean;      // prominente para FARMACIA y SUPLEMENTOS
  showBarcode: boolean;
  showUnit: boolean;

  // Textos de la página de inventario
  pageTitle: string;
  pageSubtitle: string;
  newButtonLabel: string;
  emptyStateMessage: string;

  // Textos en POS
  posProductLabel: string;       // label en el carrito
  posVariantHint: string;        // hint debajo del nombre de variante
}

const CONFIGS: Record<BusinessType, BusinessUIConfig> = {
  GENERAL: {
    productSingular: "Producto",
    productPlural: "Productos",
    categoryLabel: "Categoría",
    skuLabel: "SKU",
    unitLabel: "Unidad",
    stockLabel: "Stock",
    variantLabel: "Variante",
    supplierLabel: "Proveedor",
    searchPlaceholder: "Buscar por nombre o SKU...",
    namePlaceholder: "Nombre del producto",
    unitPlaceholder: "ej: kg, litro, caja",
    showBatchExpiry: false,
    showBarcode: true,
    showUnit: true,
    pageTitle: "Inventario",
    pageSubtitle: "Gestión de productos y alertas de stock",
    newButtonLabel: "Nuevo Producto",
    emptyStateMessage: "Aún no tienes productos. Crea el primero.",
    posProductLabel: "Producto",
    posVariantHint: "Selecciona una variante",
  },
  ROPA: {
    productSingular: "Prenda",
    productPlural: "Prendas",
    categoryLabel: "Colección",
    skuLabel: "Referencia",
    unitLabel: "Unidad",
    stockLabel: "Unidades",
    variantLabel: "Talla / Color",
    supplierLabel: "Marca / Proveedor",
    searchPlaceholder: "Buscar por nombre o referencia...",
    namePlaceholder: "ej: Camiseta Polo, Jeans Slim Fit",
    unitPlaceholder: "ej: par, unidad",
    showBatchExpiry: false,
    showBarcode: true,
    showUnit: false,
    pageTitle: "Catálogo de Ropa",
    pageSubtitle: "Gestión de prendas, tallas y colores",
    newButtonLabel: "Nueva Prenda",
    emptyStateMessage: "Aún no tienes prendas en el catálogo. Agrega la primera.",
    posProductLabel: "Prenda",
    posVariantHint: "Selecciona talla y color",
  },
  SUPLEMENTOS: {
    productSingular: "Suplemento",
    productPlural: "Suplementos",
    categoryLabel: "Línea",
    skuLabel: "Código",
    unitLabel: "Unidad",
    stockLabel: "Stock",
    variantLabel: "Sabor / Peso",
    supplierLabel: "Marca / Proveedor",
    searchPlaceholder: "Buscar por nombre o código...",
    namePlaceholder: "ej: Whey Protein, Creatina Monohidrato",
    unitPlaceholder: "ej: lb, kg, sobre",
    showBatchExpiry: true,
    showBarcode: true,
    showUnit: true,
    pageTitle: "Catálogo de Suplementos",
    pageSubtitle: "Gestión de suplementos, sabores y presentaciones",
    newButtonLabel: "Nuevo Suplemento",
    emptyStateMessage: "Aún no tienes suplementos. Agrega el primero.",
    posProductLabel: "Suplemento",
    posVariantHint: "Selecciona sabor y peso",
  },
  ELECTRONICA: {
    productSingular: "Producto",
    productPlural: "Productos",
    categoryLabel: "Marca",
    skuLabel: "Modelo",
    unitLabel: "Unidad",
    stockLabel: "Stock",
    variantLabel: "Capacidad / Color",
    supplierLabel: "Distribuidor",
    searchPlaceholder: "Buscar por nombre o modelo...",
    namePlaceholder: "ej: Auriculares Bluetooth, Cargador USB-C",
    unitPlaceholder: "ej: unidad, kit",
    showBatchExpiry: false,
    showBarcode: true,
    showUnit: true,
    pageTitle: "Inventario",
    pageSubtitle: "Gestión de productos electrónicos y stock",
    newButtonLabel: "Nuevo Producto",
    emptyStateMessage: "Aún no tienes productos. Crea el primero.",
    posProductLabel: "Producto",
    posVariantHint: "Selecciona capacidad y color",
  },
  FARMACIA: {
    productSingular: "Medicamento",
    productPlural: "Medicamentos",
    categoryLabel: "Laboratorio",
    skuLabel: "Código",
    unitLabel: "Unidad",
    stockLabel: "Stock",
    variantLabel: "Presentación / Dosis",
    supplierLabel: "Laboratorio / Proveedor",
    searchPlaceholder: "Buscar por nombre o código...",
    namePlaceholder: "ej: Paracetamol 500mg, Ibuprofeno",
    unitPlaceholder: "ej: caja, frasco, blíster",
    showBatchExpiry: true,
    showBarcode: true,
    showUnit: true,
    pageTitle: "Inventario Farmacia",
    pageSubtitle: "Gestión de medicamentos y fecha de vencimiento",
    newButtonLabel: "Nuevo Medicamento",
    emptyStateMessage: "Aún no tienes medicamentos. Agrega el primero.",
    posProductLabel: "Medicamento",
    posVariantHint: "Selecciona presentación y dosis",
  },
  FERRETERIA: {
    productSingular: "Material",
    productPlural: "Materiales",
    categoryLabel: "Área",
    skuLabel: "Código",
    unitLabel: "Unidad de medida",
    stockLabel: "Stock",
    variantLabel: "Medida / Material",
    supplierLabel: "Proveedor",
    searchPlaceholder: "Buscar por nombre o código...",
    namePlaceholder: "ej: Tornillo 3/8, Cable eléctrico",
    unitPlaceholder: "ej: metro, kg, unidad, rollo",
    showBatchExpiry: false,
    showBarcode: true,
    showUnit: true,
    pageTitle: "Inventario",
    pageSubtitle: "Gestión de materiales y herramientas",
    newButtonLabel: "Nuevo Material",
    emptyStateMessage: "Aún no tienes materiales. Agrega el primero.",
    posProductLabel: "Material",
    posVariantHint: "Selecciona medida y material",
  },
};

export function getBusinessUI(type: BusinessType): BusinessUIConfig {
  return CONFIGS[type] ?? CONFIGS.GENERAL;
}
