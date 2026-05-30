/**
 * admin.js - Controlador Lógico del Panel de Control y CRM de Ventas
 * Conecta el frontend de admin.html con la API de Google Sheets a través de GoogleSheetsService.
 */

// Estado de la aplicación local
let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
const recordsPerPage = 10;
let selectedOrder = null;

// Instancias globales de gráficos para evitar superposiciones (ghosting)
let salesChartInstance = null;
let categoriesChartInstance = null;

// Al cargar el documento, comprobar sesión
document.addEventListener("DOMContentLoaded", () => {
  const isLogged = sessionStorage.getItem("capelli_admin_logged") === "true";
  if (isLogged) {
    document.getElementById("loginOverlay").classList.add("hidden");
    fetchData();
  }
  
  // Soporte para presionar "Enter" en el login
  document.getElementById("loginPin")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") validateLogin();
  });
});

// ─── VALIDAR INICIO DE SESIÓN ───────────────────────────────────────
function validateLogin() {
  const pinInput = document.getElementById("loginPin");
  const errorEl = document.getElementById("loginError");
  if (!pinInput) return;
  
  const pin = pinInput.value.trim();
  
  // Aceptamos las claves oficiales: 'cescadmin' o 'capelli2026'
  if (pin === "cescadmin" || pin === "capelli2026") {
    sessionStorage.setItem("capelli_admin_logged", "true");
    errorEl.style.display = "none";
    document.getElementById("loginOverlay").classList.add("hidden");
    fetchData();
  } else {
    errorEl.style.display = "block";
    pinInput.value = "";
    pinInput.focus();
  }
}

// ─── CONSUMIR DATOS DESDE GOOGLE SHEETS ──────────────────────────────
async function fetchData() {
  const loader = document.getElementById("loadingScreen");
  loader.classList.add("active");
  
  try {
    const data = await GoogleSheetsService.getOrders();
    
    // Invertir para mostrar las solicitudes más recientes primero
    allOrders = data.reverse();
    filteredOrders = [...allOrders];
    currentPage = 1;
    
    // Actualizar interfaz
    calculateKPIs();
    renderCharts();
    renderTable();
    showToast("📊 Datos actualizados de Google Sheets.");
  } catch (error) {
    console.error("Error al cargar datos en panel:", error);
    showToast("⚠️ Error al conectar con Google Sheets. Verifica tu conexión.");
    
    // Datos de ejemplo para demostración en caso de que no haya conexión (CORS local de file://)
    loadMockData();
  } finally {
    loader.classList.remove("active");
  }
}

// Datos de demostración en modo desconectado local (CORS file:// fallback)
function loadMockData() {
  console.warn("admin.js: Cargando datos simulados de demostración local.");
  allOrders = [
    {
      timestamp: new Date().toISOString(),
      fecha: "30/5/2026",
      hora: "10:30:00",
      numero_de_solicitud: "CC-3005-4819",
      nombre_del_cliente: "Gabriela Paz",
      telefono: "3815049382",
      email: "gabriela@paz.com",
      metodo_de_entrega: "Retiro en Sucursal",
      sucursal___direccion: "Yerba Buena",
      categoria_cliente: "Profesional (Salón)",
      categorias_productos: "capilar, herramientas",
      productos_detalle: "2x Champú Wella Pro, 1x Plancha Wella de luxe",
      cantidad_total: 3,
      total_estimado: 54000,
      observaciones: "Preparar para regalo.",
      medio_de_pago: "Efectivo",
      mensaje_whatsapp: "Detalle de WhatsApp",
      estado: "Pendiente de envío",
      canal: "Web",
      session_id: "sess-1234",
      ip_cliente: "192.168.1.1",
      usuario_responsable: "Cliente Autónomo"
    },
    {
      timestamp: new Date().toISOString(),
      fecha: "29/5/2026",
      hora: "15:20:00",
      numero_de_solicitud: "CC-2905-9281",
      nombre_del_cliente: "Carlos Pérez",
      telefono: "3814839201",
      email: "carlos@gmail.com",
      metodo_de_entrega: "Envío a Domicilio",
      sucursal___direccion: "Av. Sarmiento 120, Yerba Buena",
      categoria_cliente: "Público General",
      categorias_productos: "unas, skincare",
      productos_detalle: "1x Esmalte OPI, 1x Crema Facial Idraet",
      cantidad_total: 2,
      total_estimado: 14800,
      observaciones: "",
      medio_de_pago: "Transferencia Bancaria",
      mensaje_whatsapp: "Detalle de WhatsApp",
      estado: "Enviado",
      canal: "Web",
      session_id: "sess-5678",
      ip_cliente: "192.168.1.20",
      usuario_responsable: "Cliente Autónomo"
    }
  ];
  filteredOrders = [...allOrders];
  calculateKPIs();
  renderCharts();
  renderTable();
}

// ─── CALCULAR METRICAS COMERCIALES (KPIs) ───────────────────────────
function calculateKPIs() {
  const count = filteredOrders.length;
  let revenue = 0;
  let profCount = 0;
  
  filteredOrders.forEach(o => {
    const val = parseTotal(o.total_estimado);
    revenue += val;
    if (o.categoria_cliente && o.categoria_cliente.includes("Profesional")) {
      profCount++;
    }
  });
  
  const avg = count > 0 ? revenue / count : 0;
  const profRatio = count > 0 ? (profCount / count) * 100 : 0;
  
  // Escribir en interfaz
  document.getElementById("kpiRevenue").textContent = formatPrice(revenue);
  document.getElementById("kpiOrders").textContent = count;
  document.getElementById("kpiAvgValue").textContent = formatPrice(avg);
  document.getElementById("kpiProfRatio").textContent = `${profRatio.toFixed(0)}%`;
}

// Helper para precios
function formatPrice(val) {
  return `$${Math.round(val).toLocaleString('es-AR')}`;
}

// Helper robusto para parsear montos formateados desde la planilla
function parseTotal(val) {
  if (val === undefined || val === null) return 0;
  const clean = String(val).replace(/[^0-9.-]/g, '');
  return parseFloat(clean) || 0;
}

// ─── PINTAR GRÁFICOS (CHART.JS) ─────────────────────────────────────
function renderCharts() {
  // 1. Procesar Ventas Diarias
  const salesByDate = {};
  filteredOrders.forEach(o => {
    const dateStr = o.fecha || "Sin fecha";
    const val = parseTotal(o.total_estimado);
    salesByDate[dateStr] = (salesByDate[dateStr] || 0) + val;
  });
  
  const dates = Object.keys(salesByDate).reverse().slice(-7); // Últimos 7 días activos
  const salesValues = dates.map(d => salesByDate[d]);
  
  // Destruir gráfico de ventas previo para evitar errores de render
  if (salesChartInstance) salesChartInstance.destroy();
  
  const ctxSales = document.getElementById("salesChart").getContext("2d");
  salesChartInstance = new Chart(ctxSales, {
    type: "line",
    data: {
      labels: dates,
      datasets: [{
        label: "Ingresos ($)",
        data: salesValues,
        borderColor: "#1b3b2b",
        backgroundColor: "rgba(27, 59, 43, 0.04)",
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "#c5a059",
        pointBorderColor: "#fff",
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: "rgba(0,0,0,0.02)" },
          ticks: { font: { family: "Outfit" } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "Outfit" } }
        }
      }
    }
  });
  
  // 2. Procesar Distribución de Categorías
  const categoryCounts = {};
  filteredOrders.forEach(o => {
    if (o.categorias_productos) {
      const cats = o.categorias_productos.split(",");
      cats.forEach(c => {
        const cleanCat = c.trim().toLowerCase();
        if (cleanCat) {
          categoryCounts[cleanCat] = (categoryCounts[cleanCat] || 0) + 1;
        }
      });
    }
  });
  
  const catNames = Object.keys(categoryCounts);
  const catValues = catNames.map(c => categoryCounts[c]);
  
  // Destruir gráfico de categorías previo
  if (categoriesChartInstance) categoriesChartInstance.destroy();
  
  const ctxCats = document.getElementById("categoriesChart").getContext("2d");
  categoriesChartInstance = new Chart(ctxCats, {
    type: "doughnut",
    data: {
      labels: catNames.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
      datasets: [{
        data: catValues,
        backgroundColor: ["#1b3b2b", "#c5a059", "#4f7c63", "#dfc28d", "#2d5a43", "#a47f3b"],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { family: "Outfit" } }
        }
      }
    }
  });
}

// ─── FILTRAR Y BUSCAR DATOS EN LA TABLA ──────────────────────────────
function filterData() {
  const query = document.getElementById("crmSearch").value.trim().toLowerCase();
  const stateFilter = document.getElementById("filterState").value;
  const tierFilter = document.getElementById("filterTier").value;
  const deliveryFilter = document.getElementById("filterDelivery").value;
  
  filteredOrders = allOrders.filter(o => {
    // 1. Búsqueda libre
    const nameMatch = (o.nombre_del_cliente || '').toLowerCase().includes(query);
    const idMatch = (o.numero_de_solicitud || '').toLowerCase().includes(query);
    const phoneMatch = (o.telefono || '').toLowerCase().includes(query);
    const searchMatch = !query || nameMatch || idMatch || phoneMatch;
    
    // 2. Filtro de Estado
    const stateMatch = stateFilter === 'todos' || o.estado === stateFilter;
    
    // 3. Filtro de Categoría Cliente
    let tierMatch = true;
    if (tierFilter !== 'todos') {
      const isProf = o.categoria_cliente && o.categoria_cliente.includes("Profesional");
      tierMatch = tierFilter === 'Profesional' ? isProf : !isProf;
    }
    
    // 4. Filtro de Entrega
    let deliveryMatch = true;
    if (deliveryFilter !== 'todos') {
      const isRetiro = o.metodo_de_entrega && o.metodo_de_entrega.includes("Retiro");
      deliveryMatch = deliveryFilter === 'Retiro' ? isRetiro : !isRetiro;
    }
    
    return searchMatch && stateMatch && tierMatch && deliveryMatch;
  });
  
  currentPage = 1;
  calculateKPIs();
  renderCharts();
  renderTable();
}

// ─── RENDERIZAR TABLA CON PAGINACIÓN ─────────────────────────────────
function renderTable() {
  const body = document.getElementById("crmTableBody");
  if (!body) return;
  
  body.innerHTML = "";
  const count = filteredOrders.length;
  
  if (count === 0) {
    body.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px 0;">No se encontraron solicitudes con los filtros aplicados.</td></tr>`;
    document.getElementById("crmPaginationText").textContent = "Mostrando 0 solicitudes";
    document.getElementById("btnPrevPage").disabled = true;
    document.getElementById("btnNextPage").disabled = true;
    return;
  }
  
  // Calcular límites de página
  const startIdx = (currentPage - 1) * recordsPerPage;
  const endIdx = Math.min(startIdx + recordsPerPage, count);
  const pageItems = filteredOrders.slice(startIdx, endIdx);
  
  pageItems.forEach(o => {
    const formattedDate = o.fecha && o.hora ? `${o.fecha} · ${o.hora}` : (o.fecha || 'Sin fecha');
    const stateClass = (o.estado || 'pendiente').toLowerCase().replace(/ /g, '-').replace(/í/g, 'i').replace(/ó/g, 'o');
    const displayTotal = formatPrice(parseTotal(o.total_estimado));
    const isProf = o.categoria_cliente && o.categoria_cliente.includes("Profesional");
    
    const tr = document.createElement("tr");
    tr.onclick = () => openModal(o);
    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td style="font-weight: 700; color: var(--primary);">${o.numero_de_solicitud || '-'}</td>
      <td style="font-weight: 500;">${o.nombre_del_cliente || '-'}</td>
      <td><span class="client-badge">${isProf ? 'Prof' : 'Público'}</span></td>
      <td>${o.metodo_de_entrega || '-'}</td>
      <td style="font-weight: 700; color: var(--primary);">${displayTotal}</td>
      <td><span class="state-badge ${stateClass}">${o.estado || 'Pendiente'}</span></td>
    `;
    body.appendChild(tr);
  });
  
  // Paginación visual
  document.getElementById("crmPaginationText").textContent = `Mostrando ${startIdx + 1}-${endIdx} de ${count} solicitudes`;
  document.getElementById("btnPrevPage").disabled = currentPage === 1;
  document.getElementById("btnNextPage").disabled = endIdx >= count;
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
}

function nextPage() {
  const count = filteredOrders.length;
  if (currentPage * recordsPerPage < count) {
    currentPage++;
    renderTable();
  }
}

// ─── MODAL DE DETALLE DEL CRM (DRAWER) ──────────────────────────────
function openModal(order) {
  selectedOrder = order;
  
  document.getElementById("modalOrderId").textContent = `Solicitud: #${order.numero_de_solicitud || '-'}`;
  document.getElementById("detName").textContent = order.nombre_del_cliente || '-';
  document.getElementById("detPhone").textContent = order.telefono || '-';
  document.getElementById("detEmail").textContent = order.email || '-';
  document.getElementById("detTier").textContent = order.categoria_cliente || 'Público General';
  document.getElementById("detDelivery").textContent = order.metodo_de_entrega || '-';
  document.getElementById("detAddress").textContent = order.sucursal___direccion || '-';
  document.getElementById("detPayment").textContent = order.medio_de_pago || '-';
  document.getElementById("detTotal").textContent = formatPrice(parseTotal(order.total_estimado));
  document.getElementById("detIP").textContent = order.ip_cliente || 'Desconocida';
  document.getElementById("detSession").textContent = order.session_id || 'N/A';
  document.getElementById("detNotes").textContent = order.observaciones || 'Sin observaciones adicionales.';
  document.getElementById("detWAPreview").textContent = order.mensaje_whatsapp || 'Sin mensaje de WhatsApp.';
  
  // Estado actual en select
  document.getElementById("modalStateSelect").value = order.estado || 'Pendiente de envío';
  
  document.getElementById("detailModalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("detailModalOverlay").classList.remove("open");
  document.body.style.overflow = "";
  selectedOrder = null;
}

// ─── ACTUALIZAR ESTADO EN TIEMPO REAL HACIA GOOGLE SHEETS ───────────
async function updateState() {
  if (!selectedOrder) return;
  
  const newState = document.getElementById("modalStateSelect").value;
  const btn = document.querySelector(".crm-state-btn");
  if (btn) btn.classList.add("loading");
  
  try {
    const result = await GoogleSheetsService.updateOrderStatus(selectedOrder.numero_de_solicitud, newState);
    
    if (result && result.status === 'success') {
      showToast(`💾 Estado actualizado a "${newState}" con éxito.`);
      
      // Actualizar el estado en el arreglo en memoria
      const idx = allOrders.findIndex(o => o.numero_de_solicitud === selectedOrder.numero_de_solicitud);
      if (idx !== -1) {
        allOrders[idx].estado = newState;
      }
      
      // Refrescar vistas
      filterData();
      closeModal();
    } else {
      showToast("⚠️ La planilla respondió con un error. Inténtelo de nuevo.");
    }
  } catch (error) {
    console.error("Error al actualizar estado del pedido en sheets:", error);
    showToast("⚠️ No se pudo conectar con Google Sheets. ¿Estás en entorno local de pruebas (CORS)?");
    
    // Si estamos en entorno de prueba sin CORS directo de Sheets, actualizar localmente para visualización
    const idx = allOrders.findIndex(o => o.numero_de_solicitud === selectedOrder.numero_de_solicitud);
    if (idx !== -1) {
      allOrders[idx].estado = newState;
      filterData();
      closeModal();
      showToast("💾 (Simulación) Estado cambiado localmente.");
    }
  } finally {
    if (btn) btn.classList.remove("loading");
  }
}

// ─── TOAST NOTIFICATION PREMIUM ────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}
