import type { BusinessType } from "./business-types";

export interface BusinessUIConfig {
  productSingular: string;
  productPlural: string;
  categoryLabel: string;
  skuLabel: string;
  unitLabel: string;
  stockLabel: string;
  variantLabel: string;
  supplierLabel: string;
  searchPlaceholder: string;
  namePlaceholder: string;
  unitPlaceholder: string;
  unitOptions: string[];
  attrPlaceholders: Record<string, string>;
  showBatchExpiry: boolean;
  showBarcode: boolean;
  showUnit: boolean;
  pageTitle: string;
  pageSubtitle: string;
  newButtonLabel: string;
  emptyStateMessage: string;
  posProductLabel: string;
  posVariantHint: string;
  sidebarLabels: {
    inventory: string;
    categories: string;
    suppliers: string;
  };
  extraSections: { href: string; label: string; minPlan?: string }[];
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
    unitOptions: ["pieza", "kg", "g", "litro", "ml", "caja", "sobre", "frasco", "metro", "rollo", "par"],
    attrPlaceholders: {},
    showBatchExpiry: false,
    showBarcode: true,
    showUnit: true,
    pageTitle: "Inventario",
    pageSubtitle: "Gestión de productos y alertas de stock",
    newButtonLabel: "Nuevo Producto",
    emptyStateMessage: "Aún no tienes productos. Crea el primero.",
    posProductLabel: "Producto",
    posVariantHint: "Selecciona una variante",
    sidebarLabels: { inventory: "Inventario", categories: "Categorias", suppliers: "Proveedores" },
    extraSections: [],
  },
  ROPA: {
    productSingular: "Prenda",
    productPlural: "Prendas",
    categoryLabel: "Colección",
    skuLabel: "Referencia",
    unitLabel: "Unidad",
    stockLabel: "Unidades",
    variantLabel: "Variantes",
    supplierLabel: "Marca / Proveedor",
    searchPlaceholder: "Buscar por nombre o referencia...",
    namePlaceholder: "ej: Camiseta Polo, Jeans Slim Fit",
    unitPlaceholder: "ej: par, unidad",
    unitOptions: ["pieza", "par", "set", "pack"],
    attrPlaceholders: { talla: "ej: S, M, L, XL, 38, 40", color: "ej: Negro, Blanco, Azul" },
    showBatchExpiry: false,
    showBarcode: true,
    showUnit: false,
    pageTitle: "Catálogo de Ropa",
    pageSubtitle: "Gestión de prendas, tallas y colores",
    newButtonLabel: "Nueva Prenda",
    emptyStateMessage: "Aún no tienes prendas en el catálogo. Agrega la primera.",
    posProductLabel: "Prenda",
    posVariantHint: "Selecciona talla y color",
    sidebarLabels: { inventory: "Catálogo de Ropa", categories: "Colecciones", suppliers: "Marcas" },
    extraSections: [],
  },
  SUPLEMENTOS: {
    productSingular: "Suplemento",
    productPlural: "Suplementos",
    categoryLabel: "Línea",
    skuLabel: "Código",
    unitLabel: "Presentación",
    stockLabel: "Stock",
    variantLabel: "Variantes",
    supplierLabel: "Marca / Proveedor",
    searchPlaceholder: "Buscar por nombre o código...",
    namePlaceholder: "ej: Whey Protein, Creatina Monohidrato",
    unitPlaceholder: "ej: lb, kg, sobre",
    unitOptions: ["lb", "kg", "g", "sobre", "cápsula", "tableta", "frasco", "sachet"],
    attrPlaceholders: { sabor: "ej: Chocolate, Vainilla, Fresa", peso: "ej: 1 lb, 2 lb, 5 lb" },
    showBatchExpiry: true,
    showBarcode: true,
    showUnit: true,
    pageTitle: "Catálogo de Suplementos",
    pageSubtitle: "Gestión de suplementos, sabores y presentaciones",
    newButtonLabel: "Nuevo Suplemento",
    emptyStateMessage: "Aún no tienes suplementos. Agrega el primero.",
    posProductLabel: "Suplemento",
    posVariantHint: "Selecciona sabor y peso",
    sidebarLabels: { inventory: "Catálogo de Suplementos", categories: "Líneas", suppliers: "Marcas" },
    extraSections: [{ href: "/inventory?vencimientos=1", label: "Vencimientos", minPlan: "CRECER" }],
  },
  ELECTRONICA: {
    productSingular: "Producto",
    productPlural: "Productos",
    categoryLabel: "Marca",
    skuLabel: "Modelo",
    unitLabel: "Unidad",
    stockLabel: "Stock",
    variantLabel: "Variantes",
    supplierLabel: "Distribuidor",
    searchPlaceholder: "Buscar por nombre o modelo...",
    namePlaceholder: "ej: Auriculares Bluetooth, Cargador USB-C",
    unitPlaceholder: "ej: unidad, kit",
    unitOptions: ["unidad", "kit", "par", "pack"],
    attrPlaceholders: { capacidad: "ej: 64GB, 128GB, 256GB", color: "ej: Negro, Blanco, Gris" },
    showBatchExpiry: false,
    showBarcode: true,
    showUnit: true,
    pageTitle: "Inventario",
    pageSubtitle: "Gestión de productos electrónicos y stock",
    newButtonLabel: "Nuevo Producto",
    emptyStateMessage: "Aún no tienes productos. Crea el primero.",
    posProductLabel: "Producto",
    posVariantHint: "Selecciona capacidad y color",
    sidebarLabels: { inventory: "Inventario", categories: "Marcas", suppliers: "Distribuidores" },
    extraSections: [{ href: "/inventory?garantias=1", label: "Garantías", minPlan: "PRO" }],
  },
  FARMACIA: {
    productSingular: "Medicamento",
    productPlural: "Medicamentos",
    categoryLabel: "Laboratorio",
    skuLabel: "Código",
    unitLabel: "Presentación",
    stockLabel: "Stock",
    variantLabel: "Variantes",
    supplierLabel: "Laboratorio / Proveedor",
    searchPlaceholder: "Buscar por nombre o código...",
    namePlaceholder: "ej: Paracetamol 500mg, Ibuprofeno",
    unitPlaceholder: "ej: caja, frasco, blíster",
    unitOptions: ["caja", "frasco", "blíster", "ampolla", "sobre", "tableta", "cápsula", "ml", "mg"],
    attrPlaceholders: { presentación: "ej: Caja x10, Frasco x30", dosis: "ej: 500mg, 1g" },
    showBatchExpiry: true,
    showBarcode: true,
    showUnit: true,
    pageTitle: "Inventario Farmacia",
    pageSubtitle: "Gestión de medicamentos y fecha de vencimiento",
    newButtonLabel: "Nuevo Medicamento",
    emptyStateMessage: "Aún no tienes medicamentos. Agrega el primero.",
    posProductLabel: "Medicamento",
    posVariantHint: "Selecciona presentación y dosis",
    sidebarLabels: { inventory: "Inventario Farmacia", categories: "Laboratorios", suppliers: "Laboratorios" },
    extraSections: [{ href: "/inventory?vencimientos=1", label: "Vencimientos", minPlan: "CRECER" }],
  },
  FERRETERIA: {
    productSingular: "Material",
    productPlural: "Materiales",
    categoryLabel: "Área",
    skuLabel: "Código",
    unitLabel: "Unidad de medida",
    stockLabel: "Stock",
    variantLabel: "Variantes",
    supplierLabel: "Proveedor",
    searchPlaceholder: "Buscar por nombre o código...",
    namePlaceholder: "ej: Tornillo 3/8, Cable eléctrico",
    unitPlaceholder: "ej: metro, kg, unidad, rollo",
    unitOptions: ["unidad", "metro", "kg", "g", "litro", "rollo", "par", "kit", "caja"],
    attrPlaceholders: { medida: "ej: 1/4\", 3/8\", 10mm", material: "ej: Acero, Madera, PVC" },
    showBatchExpiry: false,
    showBarcode: true,
    showUnit: true,
    pageTitle: "Inventario",
    pageSubtitle: "Gestión de materiales y herramientas",
    newButtonLabel: "Nuevo Material",
    emptyStateMessage: "Aún no tienes materiales. Agrega el primero.",
    posProductLabel: "Material",
    posVariantHint: "Selecciona medida y material",
    sidebarLabels: { inventory: "Inventario", categories: "Áreas", suppliers: "Proveedores" },
    extraSections: [],
  },
};

export function getBusinessUI(type: BusinessType): BusinessUIConfig {
  return CONFIGS[type] ?? CONFIGS.GENERAL;
}
