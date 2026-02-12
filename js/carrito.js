let carrito = [];
const WHATSAPP_NEGOCIO = "541173633880";

function agregarAlCarrito(idProducto) {
  const producto = productos.find((p) => p.id === idProducto);
  if (!producto) return;

  const itemExistente = carrito.find((item) => item.id === idProducto);

  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1
    });
  }

  actualizarCarritoUI();
}

function actualizarCarritoUI() {
  const cartCount = document.getElementById("cartCount");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrecio = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  cartCount.textContent = totalItems;

  cartItems.innerHTML = carrito
    .map(
      (item) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <span class="cart-item-name">${item.nombre}</span>
          <span class="cart-item-meta">${item.cantidad} x $${item.precio}</span>
        </div>
        <button class="btn-remove-item" onclick="quitarDelCarrito('${item.id}')">Quitar</button>
      </div>
    `
    )
    .join("");

  cartTotal.textContent = totalPrecio;
}

function quitarDelCarrito(idProducto) {
  carrito = carrito.filter((item) => item.id !== idProducto);
  actualizarCarritoUI();
}

function vaciarCarrito() {
  carrito = [];
  actualizarCarritoUI();
}

function cerrarCarrito() {
  document.getElementById("cart").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

function normalizarTelefono(valor) {
  return valor.replace(/\D/g, "");
}

function construirMensajePedido(nombre, whatsappCliente) {
  const lineas = [
    "Hola, quiero hacer este pedido:",
    ""
  ];

  carrito.forEach((item) => {
    lineas.push(`- ${item.nombre} x${item.cantidad} ($${item.precio} c/u)`);
  });

  const totalPrecio = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  lineas.push("");
  lineas.push(`Total: $${totalPrecio}`);
  lineas.push(`Nombre: ${nombre}`);
  lineas.push(`WhatsApp: ${whatsappCliente}`);

  return lineas.join("\n");
}

function enviarPedidoWhatsApp(event) {
  event.preventDefault();

  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  const nombreInput = document.getElementById("clienteNombre");
  const whatsappInput = document.getElementById("clienteWhatsapp");
  const nombre = nombreInput.value.trim();
  const whatsappCliente = normalizarTelefono(whatsappInput.value);

  if (!nombre || !whatsappCliente) {
    alert("Completa nombre y WhatsApp para enviar el pedido.");
    return;
  }

  const mensaje = construirMensajePedido(nombre, whatsappCliente);
  const url = `https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, "_blank");
}

document.addEventListener("DOMContentLoaded", () => {
  const checkoutForm = document.getElementById("checkoutForm");
  const clearCartBtn = document.getElementById("clearCartBtn");

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", enviarPedidoWhatsApp);
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", vaciarCarrito);
  }
});
