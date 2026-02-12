function moneyAR(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function fechaAR(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR");
}

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[ch];
  });
}

function setConfigPanelState(isConfigured) {
  const panel = document.getElementById("configPanel");
  if (!panel) return;
  panel.style.display = isConfigured ? "none" : "block";
}

function cargarConfigEnFormulario() {
  const urlInput = document.getElementById("supabaseUrlInput");
  const keyInput = document.getElementById("supabaseAnonKeyInput");
  if (!urlInput || !keyInput) return;

  const cfg = window.backendPedidos.getSupabaseConfig();
  urlInput.value = cfg.url || "";
  keyInput.value = cfg.anonKey || "";
}

function inicializarFormularioConfig() {
  const form = document.getElementById("configForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const urlInput = document.getElementById("supabaseUrlInput");
    const keyInput = document.getElementById("supabaseAnonKeyInput");
    const url = (urlInput?.value || "").trim().replace(/\/+$/, "");
    const anonKey = (keyInput?.value || "").trim();

    if (!url || !anonKey) {
      alert("Completa URL y anon key.");
      return;
    }

    localStorage.setItem("supabase_url", url);
    localStorage.setItem("supabase_anon_key", anonKey);
    setConfigPanelState(true);
    await cargarPedidos();
  });
}

async function actualizarEstadoPedido(idPedido, estado) {
  await window.backendPedidos.supabaseRequest(`pedidos?id=eq.${idPedido}`, {
    method: "PATCH",
    body: JSON.stringify({ estado })
  });
}

function renderPedidos(pedidos) {
  const body = document.getElementById("pedidosBody");
  const kpiPedidos = document.getElementById("kpiPedidos");
  const kpiTotal = document.getElementById("kpiTotal");

  if (!body || !kpiPedidos || !kpiTotal) return;

  kpiPedidos.textContent = pedidos.length;
  const total = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
  kpiTotal.textContent = moneyAR(total);

  if (!pedidos.length) {
    body.innerHTML = '<tr><td colspan="7" class="muted">No hay pedidos.</td></tr>';
    return;
  }

  body.innerHTML = pedidos
    .map((pedido) => {
      const cliente = pedido.cliente || {};
      const itemsCount = Array.isArray(pedido.items) ? pedido.items.length : 0;
      const estado = safeText(pedido.estado || "nuevo");

      return `
        <tr>
          <td>${safeText(fechaAR(pedido.created_at))}</td>
          <td>${safeText(pedido.numero || "-")}</td>
          <td>${safeText(cliente.nombre || "-")}</td>
          <td>${safeText(cliente.whatsapp || "-")}</td>
          <td>${itemsCount}</td>
          <td>${safeText(moneyAR(pedido.total))}</td>
          <td>
            <select class="estado-select" data-id="${safeText(pedido.id)}">
              <option value="nuevo" ${estado === "nuevo" ? "selected" : ""}>nuevo</option>
              <option value="en_proceso" ${estado === "en_proceso" ? "selected" : ""}>en_proceso</option>
              <option value="entregado" ${estado === "entregado" ? "selected" : ""}>entregado</option>
              <option value="cancelado" ${estado === "cancelado" ? "selected" : ""}>cancelado</option>
            </select>
          </td>
        </tr>
      `;
    })
    .join("");

  body.querySelectorAll(".estado-select").forEach((select) => {
    select.addEventListener("change", async () => {
      const idPedido = select.dataset.id;
      try {
        await actualizarEstadoPedido(idPedido, select.value);
      } catch (error) {
        console.error(error);
        alert("No se pudo actualizar el estado.");
      }
    });
  });
}

async function cargarPedidos() {
  const body = document.getElementById("pedidosBody");
  if (body) {
    body.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';
  }

  const cfg = window.backendPedidos.getSupabaseConfig();
  setConfigPanelState(cfg.enabled);
  if (!cfg.enabled) {
    if (body) {
      body.innerHTML =
        '<tr><td colspan="7">Configura Supabase en este panel para usar admin.</td></tr>';
    }
    return;
  }

  try {
    const query =
      "pedidos?select=id,numero,total,estado,created_at,cliente:clientes(nombre,whatsapp),items:pedido_items(id)&order=created_at.desc";
    const pedidos = await window.backendPedidos.supabaseRequest(query);
    renderPedidos(Array.isArray(pedidos) ? pedidos : []);
  } catch (error) {
    console.error(error);
    if (body) {
      body.innerHTML = '<tr><td colspan="7">Error al cargar pedidos.</td></tr>';
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.getElementById("refreshBtn");
  refreshBtn?.addEventListener("click", cargarPedidos);
  cargarConfigEnFormulario();
  inicializarFormularioConfig();
  cargarPedidos();
});
