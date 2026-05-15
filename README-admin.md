# GestiOS — Guia para Administradores

Sistema de gestion de negocios multi-tenant para Bolivia. Stack: Next.js 16, Prisma, Supabase Auth, Tailwind 4.

---

## Inicio Rapido

1. **Crear cuenta** — Registrate en la plataforma con tu email. Se crea una organizacion aislada para tu negocio.
2. **Configurar tienda** — Ve a `Configuracion > Mi Tienda` y completa: nombre, NIT, telefono, direccion, logo y tipo de negocio.
3. **Cargar productos** — Ve a `Inventario` y agrega tu catalogo. Puedes importar desde CSV si tienes plan CRECER+.
4. **Agregar personal** — Ve a `Equipo` y agrega empleados con email. Cada uno recibe credenciales propias.
5. **Primera venta** — Abre `Punto de Venta`, busca un producto y procesa el cobro.

---

## Modulos

| Modulo | Ruta | Descripcion | Plan minimo |
|--------|------|-------------|-------------|
| Dashboard | `/dashboard` | KPIs, alertas de stock, notificaciones | Todos |
| Punto de Venta | `/pos` | Cobro rapido, descuentos, comprobantes | Todos |
| Inventario | `/inventory` | Catalogo, stock, variantes, alertas | Todos |
| Clientes | `/customers` | Registro, historial, link publico | Todos |
| Ventas | `/ventas` | Historial de pedidos, estados | Todos |
| Pedidos | `/orders` | Gestion detallada de ordenes | Todos |
| Categorias | `/categories` | Clasificacion de productos | Todos |
| Descuentos | `/discounts` | Codigos y porcentajes de descuento | Todos |
| Corte de Caja | `/caja` | Cierre diario con desglose por metodo de pago | Todos |
| Reportes | `/reports` | Ventas, ingresos, exportacion contable | CRECER+ |
| Proveedores | `/suppliers` | Gestion de proveedores y ordenes de compra | CRECER+ |
| Personal | `/staff` | Usuarios y roles | BASICO (1 staff) |
| Sucursales | `/branches` | Gestion multi-sucursal | EMPRESARIAL |
| WhatsApp | `/conversations` | Chat con clientes via WhatsApp Business | Add-on |
| Configuracion | `/settings` | Perfil, tienda, facturacion, seguridad | Todos |

---

## Planes

| Plan | Productos | Clientes | Staff | Precio aprox. |
|------|-----------|----------|-------|---------------|
| Basico | 150 | 50 | 1 | Bs. 99/mes |
| Crecer | Ilimitado | Ilimitado | 5 | Bs. 199/mes |
| Pro | Ilimitado | Ilimitado | 15 | Bs. 349/mes |
| Empresarial | Ilimitado | Ilimitado | Ilimitado | Bs. 599/mes |

Para cambiar de plan: `Configuracion > Facturacion > Gestionar` o contactar soporte.

---

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| ADMIN | Acceso total, incluye configuracion y facturacion |
| MANAGER | Ventas, inventario, clientes, reportes. Sin configuracion de plan |
| STAFF | Solo punto de venta e inventario basico |

---

## Add-ons Disponibles

- **WhatsApp Business** — Atencion y notificaciones por WhatsApp. Requiere Meta Business Account.
- **Facturacion SIAT** — Facturas electronicas para el SIN Bolivia. Requiere NIT y credenciales SIAT.
- **QR Bolivia** — Pagos via QR bancario, Tigo Money y BiPago.

Activar add-ons: `Configuracion > Facturacion > Add-ons`.

---

## Preguntas Frecuentes

**Como cambio mi contrasena?**
Usa el enlace de recuperacion desde la pantalla de login (`/login`). No se puede cambiar desde Configuracion.

**Como agrego un miembro del equipo?**
Ve a `Equipo > Agregar miembro`. Ingresa su email y selecciona el rol. Recibira credenciales por email.

**Como exporto mis datos?**
En `Reportes` encontraras opciones de exportacion CSV para ventas, inventario y clientes (plan CRECER+). La exportacion contable genera un archivo compatible con herramientas de contabilidad bolivianas.

**Puedo tener varias sucursales?**
Si, con plan EMPRESARIAL. Ve a `Sucursales` para crear y gestionar cada punto de venta.

**Que pasa si mi plan vence?**
Seras redirigido a una pantalla de renovacion. Tus datos se conservan. Contacta soporte para reactivar.

**Es segura mi informacion?**
Si. Los datos se almacenan en Supabase (cifrado en reposo y en transito). Cada organizacion esta completamente aislada. El acceso requiere autenticacion via Supabase Auth.

**Como configuro la facturacion electronica SIAT?**
Activa el add-on SIAT desde Configuracion. Necesitas tu NIT, CUIS y CUFD obtenidos del Sistema de Impuestos Nacionales (SIN). El soporte de GestiOS puede guiarte en el proceso.

---

## Contacto y Soporte

- **Email:** soporte@gestios.bo
- **Tiempo de respuesta:** 24 horas habiles (plan Empresarial: 4 horas)
- **Ayuda en la app:** `Menu lateral > Centro de Ayuda` o ir a `/help`
