const PEDIDOS_STORAGE_KEY = "llenalod_pedidos_v1";
const MOVIMIENTOS_STORAGE_KEY = "llenalod_movimientos_v1";

function leerPedidosLocal() {
  try {
    const raw = localStorage.getItem(PEDIDOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function guardarPedidosLocal(pedidos) {
  localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidos));
}

function leerMovimientosLocal() {
  try {
    const raw = localStorage.getItem(MOVIMIENTOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function guardarMovimientosLocal(movimientos) {
  localStorage.setItem(MOVIMIENTOS_STORAGE_KEY, JSON.stringify(movimientos));
}

function generarIdLocal() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `loc-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function calcularTotal(items) {
  return items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
}

async function guardarPedidoCompletoEnNube(payload) {
  try {
    const pedidos = leerPedidosLocal();
    const total = calcularTotal(payload.carrito || []);

    const pedido = {
      id: generarIdLocal(),
      numero: payload.numeroPedido || "",
      total,
      estado: "nuevo",
      canal: "whatsapp",
      created_at: new Date().toISOString(),
      cliente: {
        nombre: payload.nombre || "",
        whatsapp: payload.whatsappCliente || ""
      },
      items: (payload.carrito || []).map((item) => ({
        id: generarIdLocal(),
        producto_id: item.id,
        codigo: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        subtotal: item.precio * item.cantidad,
        imagen: item.imagen
      }))
    };

    pedidos.unshift(pedido);
    guardarPedidosLocal(pedidos);
    return { ok: true, pedidoId: pedido.id };
  } catch (error) {
    return { ok: false, reason: "local_storage_error", error };
  }
}

async function listarPedidos() {
  return leerPedidosLocal();
}

async function actualizarEstadoPedido(idPedido, estado) {
  const pedidos = leerPedidosLocal();
  const idx = pedidos.findIndex((p) => p.id === idPedido);
  if (idx === -1) {
    throw new Error("Pedido no encontrado.");
  }
  pedidos[idx].estado = estado;
  guardarPedidosLocal(pedidos);
  return pedidos[idx];
}

async function listarMovimientosFinancieros() {
  return leerMovimientosLocal();
}

async function guardarMovimientoFinanciero(payload) {
  const movimientos = leerMovimientosLocal();
  const monto = Number(payload.monto || 0);
  if (!(monto > 0)) {
    throw new Error("El monto debe ser mayor a 0.");
  }

  const movimiento = {
    id: generarIdLocal(),
    fecha: payload.fecha || new Date().toISOString(),
    tipo: payload.tipo === "egreso" ? "egreso" : "ingreso",
    origen: String(payload.origen || "otro"),
    descripcion: String(payload.descripcion || "").trim() || "Movimiento manual",
    monto,
    created_at: new Date().toISOString()
  };

  movimientos.unshift(movimiento);
  guardarMovimientosLocal(movimientos);
  return movimiento;
}

async function eliminarMovimientoFinanciero(idMovimiento) {
  const movimientos = leerMovimientosLocal();
  const next = movimientos.filter((m) => m.id !== idMovimiento);
  guardarMovimientosLocal(next);
  return true;
}

window.backendPedidos = {
  guardarPedidoCompletoEnNube,
  listarPedidos,
  actualizarEstadoPedido,
  listarMovimientosFinancieros,
  guardarMovimientoFinanciero,
  eliminarMovimientoFinanciero
};
