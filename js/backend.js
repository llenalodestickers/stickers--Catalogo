function getSupabaseConfig() {
  const cfg = window.SUPABASE_CONFIG || {};
  const storedUrl = localStorage.getItem("supabase_url") || "";
  const storedAnonKey = localStorage.getItem("supabase_anon_key") || "";
  const url = String(cfg.url || storedUrl).trim().replace(/\/+$/, "");
  const anonKey = String(cfg.anonKey || storedAnonKey).trim();
  const enabled = Boolean(url && anonKey);
  return { url, anonKey, enabled };
}

function getSupabaseHeaders(extra) {
  const cfg = getSupabaseConfig();
  const headers = {
    apikey: cfg.anonKey,
    Authorization: `Bearer ${cfg.anonKey}`,
    "Content-Type": "application/json",
    ...(extra || {})
  };
  return headers;
}

async function supabaseRequest(path, options) {
  const cfg = getSupabaseConfig();
  if (!cfg.enabled) {
    throw new Error("Supabase no configurado.");
  }

  const response = await fetch(`${cfg.url}/rest/v1/${path}`, {
    method: "GET",
    ...options,
    headers: getSupabaseHeaders(options?.headers)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Error Supabase ${response.status}: ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function buscarClientePorWhatsapp(whatsapp) {
  const filtro = `whatsapp=eq.${encodeURIComponent(whatsapp)}&select=id,nombre,whatsapp&limit=1`;
  const data = await supabaseRequest(`clientes?${filtro}`);
  return Array.isArray(data) && data.length ? data[0] : null;
}

async function guardarCliente(nombre, whatsapp) {
  const existente = await buscarClientePorWhatsapp(whatsapp);
  if (existente) {
    const data = await supabaseRequest(`clientes?id=eq.${existente.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ nombre })
    });
    return data[0];
  }

  const creado = await supabaseRequest("clientes", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([{ nombre, whatsapp }])
  });
  return creado[0];
}

function calcularTotal(items) {
  return items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
}

async function guardarPedido(cliente, carrito, numeroPedido) {
  const total = calcularTotal(carrito);
  const pedidoResp = await supabaseRequest("pedidos", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([
      {
        numero: numeroPedido,
        cliente_id: cliente.id,
        total,
        estado: "nuevo",
        canal: "whatsapp"
      }
    ])
  });

  const pedido = pedidoResp[0];
  const items = carrito.map((item) => ({
    pedido_id: pedido.id,
    producto_id: item.id,
    codigo: item.nombre,
    cantidad: item.cantidad,
    precio: item.precio,
    subtotal: item.precio * item.cantidad,
    imagen: item.imagen
  }));

  if (items.length) {
    await supabaseRequest("pedido_items", {
      method: "POST",
      body: JSON.stringify(items)
    });
  }

  return pedido;
}

async function guardarPedidoCompletoEnNube(payload) {
  const cfg = getSupabaseConfig();
  if (!cfg.enabled) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const cliente = await guardarCliente(payload.nombre, payload.whatsappCliente);
    const pedido = await guardarPedido(cliente, payload.carrito, payload.numeroPedido);
    return { ok: true, pedidoId: pedido.id };
  } catch (error) {
    return { ok: false, reason: "request_error", error };
  }
}

window.backendPedidos = {
  getSupabaseConfig,
  supabaseRequest,
  guardarPedidoCompletoEnNube
};
