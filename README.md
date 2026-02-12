# stickers--Catalogo

Catalogo estatico para GitHub Pages con carrito y envio de pedido por WhatsApp.

## Admin local (sin Supabase)

El panel `admin.html` ahora usa almacenamiento local del navegador (`localStorage`).

- Al enviar un pedido desde `index.html`, se guarda en local.
- `admin.html` muestra esos pedidos y permite cambiar el estado.
- `admin.html` incluye una caja local:
  - suma automaticamente ventas del catalogo como ingresos
  - permite cargar movimientos manuales (ferias, personalizados, otros)
  - calcula ingresos, egresos y balance

## Importante

- Los datos quedan guardados solo en el navegador/dispositivo actual.
- Si abris la web en otro navegador, no vas a ver esos pedidos.
- Si borras datos del navegador, se pierden los pedidos guardados localmente.
