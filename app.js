// ─── ESTADO GLOBAL DE LA APLICACIÓN ─────────────────────────────────
let cart = {};                  // Estructura: { id_producto: cantidad }
let currentCat = 'todos';       // Categoría activa
let currentBrandCode = 'all';   // Código de marca filtrado
let searchQuery = '';           // Búsqueda por texto
let isProfessional = false;     // Si ve precios profesionales
let deliveryMethod = 'retiro';  // Método de entrega: 'retiro' o 'envio'

let toastTimer;
let renderedCount = 40;         // Cantidad renderizada (para Lazy Loading)
const PAGE_SIZE = 40;           // Tamaño de lote de renderizado
let filteredItems = [];         // Caché de elementos filtrados

// ─── FORMATEO DE PRECIO (MONEDA ARGENTINA) ──────────────────────────
function formatPrice(n) {
  return '$' + n.toLocaleString('es-AR');
}

// Banco de imágenes premium de Unsplash para Club Capelli
const CATEGORY_IMAGES = {
  capilar: [
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=450&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=450&q=80",
    "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=450&q=80",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=450&q=80",
    "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=450&q=80"
  ],
  unas: [
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=450&q=80",
    "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=450&q=80",
    "https://images.unsplash.com/photo-1632345031435-8797b2d58045?w=450&q=80",
    "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=450&q=80",
    "https://images.unsplash.com/photo-1522337060767-141755225c52?w=450&q=80"
  ],
  skincare: [
    "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=450&q=80",
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=450&q=80",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=450&q=80",
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=450&q=80",
    "https://images.unsplash.com/photo-1498843053639-130f585f51f9?w=450&q=80"
  ],
  herramientas: [
    "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=450&q=80",
    "https://images.unsplash.com/photo-1593121925328-369ec94e581b?w=450&q=80",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=450&q=80",
    "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=450&q=80",
    "https://images.unsplash.com/photo-1621607512214-68297480165e?w=450&q=80"
  ],
  maquillaje: [
    "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=450&q=80",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=450&q=80",
    "https://images.unsplash.com/photo-1522337654788-7b8299836e1a?w=450&q=80",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=450&q=80",
    "https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=450&q=80"
  ],
  accesorios: [
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=450&q=80",
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=450&q=80",
    "https://images.unsplash.com/photo-1617897903246-719242758050?w=450&q=80",
    "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=450&q=80"
  ]
};

function getProductImage(item) {
  // Imagen corporativa oficial de "Foto en Preparación" para todos los productos
  return "img/productos/en_preparacion.png";
}

// ─── CONTROL DE IMÁGENES CON ICONO FALLBACK ────────────────────────
function photoHTML(src, emoji, alt = '') {
  const hasImage = src && src.trim() !== '';
  if (!hasImage) {
    return `<div class="item-photo-fallback show">${emoji}</div>`;
  }
  return `
    <div class="img-skeleton"></div>
    <img
      src="${src}"
      alt="${alt}"
      loading="lazy"
      onload="if(this.previousElementSibling) this.previousElementSibling.remove()"
      onerror="if(this.previousElementSibling) this.previousElementSibling.remove(); this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.opacity='1';"
    >
    <div class="item-photo-fallback" style="opacity:0">${emoji}</div>
  `;
}

// ─── GENERADOR DE CÓDIGO DE ORDEN CLUB CAPELLI ─────────────────────
function generateOrderId() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000); // Número de 4 dígitos aleatorio
  return `CC-${day}${month}-${random}`;
}

// ─── PERSISTENCIA DE DATOS EN LOCAL STORAGE ────────────────────────
function saveClientData() {
  const nombre = document.getElementById('fNombre') ? document.getElementById('fNombre').value.trim() : '';
  const apellido = document.getElementById('fApellido') ? document.getElementById('fApellido').value.trim() : '';
  const email = document.getElementById('fEmail') ? document.getElementById('fEmail').value.trim() : '';
  const tel = document.getElementById('fTel') ? document.getElementById('fTel').value.trim() : '';
  const sucursal = document.getElementById('fSucursal') ? document.getElementById('fSucursal').value : '';
  const direccion = document.getElementById('fDireccion') ? document.getElementById('fDireccion').value.trim() : '';
  const localidad = document.getElementById('fLocalidad') ? document.getElementById('fLocalidad').value.trim() : '';
  const profesion = document.getElementById('fProfesion') ? document.getElementById('fProfesion').value.trim() : '';
  
  localStorage.setItem('capelli_nombre', nombre);
  localStorage.setItem('capelli_apellido', apellido);
  localStorage.setItem('capelli_email', email);
  localStorage.setItem('capelli_tel', tel);
  localStorage.setItem('capelli_sucursal', sucursal);
  localStorage.setItem('capelli_direccion', direccion);
  localStorage.setItem('capelli_localidad', localidad);
  localStorage.setItem('capelli_profesion', profesion);
  localStorage.setItem('capelli_is_prof', isProfessional ? 'true' : 'false');
}

function loadClientData() {
  const nombre = localStorage.getItem('capelli_nombre') || '';
  const apellido = localStorage.getItem('capelli_apellido') || '';
  const email = localStorage.getItem('capelli_email') || '';
  const tel = localStorage.getItem('capelli_tel') || '';
  const sucursal = localStorage.getItem('capelli_sucursal') || '';
  const direccion = localStorage.getItem('capelli_direccion') || '';
  const localidad = localStorage.getItem('capelli_localidad') || '';
  const profesion = localStorage.getItem('capelli_profesion') || '';
  const isProfStr = localStorage.getItem('capelli_is_prof') || 'false';
  
  if (document.getElementById('fNombre')) document.getElementById('fNombre').value = nombre;
  if (document.getElementById('fApellido')) document.getElementById('fApellido').value = apellido;
  if (document.getElementById('fEmail')) document.getElementById('fEmail').value = email;
  if (document.getElementById('fTel')) document.getElementById('fTel').value = tel;
  if (document.getElementById('fDireccion')) document.getElementById('fDireccion').value = direccion;
  if (document.getElementById('fLocalidad')) document.getElementById('fLocalidad').value = localidad;
  if (document.getElementById('fProfesion')) document.getElementById('fProfesion').value = profesion;
  
  if (document.getElementById('fSucursal') && sucursal) {
    document.getElementById('fSucursal').value = sucursal;
  }
  
  if (isProfStr === 'true') {
    const toggle = document.getElementById('profToggle');
    if (toggle) {
      toggle.checked = true;
      isProfessional = true;
      toggleProfessionalMode(true);
    }
  }
}

// ─── RENDERIZADO DEL MENÚ Y PRODUCTOS (CON LAZY RENDERING) ───────────
function renderFilteredMenu() {
  const list = document.getElementById('menuList');
  if (!list) return;
  
  // Si estamos en la página inicial, limpiamos todo el listado
  list.innerHTML = '';
  
  const batch = filteredItems.slice(0, renderedCount);
  if (batch.length === 0) {
    list.innerHTML = `
      <div class="cart-empty" style="grid-column: 1/-1; padding: 60px 20px;">
        <div class="cart-empty-emoji">🔍</div>
        <div class="cart-empty-text">No se encontraron productos que coincidan.<br>Intentá con otra búsqueda o filtro.</div>
      </div>`;
    return;
  }
  
  let html = '';
  batch.forEach(item => {
    const qty = cart[item.id] || 0;
    const inCart = qty > 0;
    
    // Seleccionar precio según modo
    const activePrice = isProfessional ? item.price_prof : item.price;
    
    // Controles de cantidad
    const controls = inCart
      ? `<div class="item-controls-pill">
           <button class="qty-btn" onclick="changeQty(${item.id},-1,event)">−</button>
           <div class="qty-num" id="qn-${item.id}">${qty}</div>
           <button class="qty-btn" onclick="changeQty(${item.id},1,event)">+</button>
         </div>`
      : `<button class="qty-add-btn" onclick="addItem(${item.id},event)">+</button>`;
      
    const profBadge = isProfessional ? `<span class="price-badge-prof">Prof</span>` : '';
    
    html += `
      <div class="menu-item ${inCart ? 'in-cart' : ''}" id="mi-${item.id}" onclick="openProductModal(${item.id})">
        <div class="item-photo">
          ${photoHTML(getProductImage(item), item.emoji, item.name)}
        </div>
        <div class="item-info">
          <div>
            <div class="item-brand-label" style="font-size:0.75rem; font-weight:700; color:var(--primary); text-transform:uppercase; margin-bottom:4px;">${item.brand}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-desc" style="font-size:0.78rem; color:var(--text-muted);">Contenido: ${item.content} · Cód: ${item.code}</div>
          </div>
          <div class="item-footer">
            <div class="item-price">${formatPrice(activePrice)} ${profBadge}</div>
            <div class="item-controls" id="ctrl-${item.id}">${controls}</div>
          </div>
        </div>
      </div>`;
  });
  
  list.innerHTML = html;
}

// ─── INFINITE SCROLL / CARGA MÁS ELEMENTOS ───────────────────────────
function loadMoreProducts() {
  if (renderedCount >= filteredItems.length) return;
  
  const spinner = document.getElementById('sentinelLoader');
  if (spinner) spinner.style.display = 'flex';
  
  setTimeout(() => {
    renderedCount = Math.min(renderedCount + PAGE_SIZE, filteredItems.length);
    renderFilteredMenu();
    updateSentinelVisibility();
  }, 200); // Pequeño lag realista de carga cinematográfica
}

function updateSentinelVisibility() {
  const spinner = document.getElementById('sentinelLoader');
  if (!spinner) return;
  
  if (renderedCount < filteredItems.length) {
    spinner.style.display = 'flex';
  } else {
    spinner.style.display = 'none';
  }
}

function setupInfiniteScroll() {
  window.addEventListener('scroll', () => {
    if (renderedCount >= filteredItems.length) return;
    
    const threshold = 200; // píxeles antes del final para disparar
    const position = window.innerHeight + window.scrollY;
    const limit = document.documentElement.scrollHeight - threshold;
    
    if (position >= limit) {
      loadMoreProducts();
    }
  });
}

// ─── CONTROL DE FILTROS CRUZADOS (Categorías + Marcas + Búsqueda) ───────
function applyFilters() {
  let items = MENU;
  
  // 1. Filtrar por Categoría
  if (currentCat !== 'todos') {
    items = items.filter(p => p.cat === currentCat);
  }
  
  // 2. Filtrar por Marca
  if (currentBrandCode && currentBrandCode !== 'all') {
    items = items.filter(p => p.brandCode === currentBrandCode);
  }
  
  // 3. Filtrar por Texto
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.code.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q)
    );
  }
  
  filteredItems = items;
  renderedCount = PAGE_SIZE; // Reseteamos la paginación a la primera tanda
  
  renderFilteredMenu();
  updateSentinelVisibility();
  
  // Actualizar Título de Menú
  const titleEl = document.getElementById('menuTitle');
  if (titleEl) {
    let catPrefix = "🌟";
    let catName = "Selección Completa";
    
    if (currentCat !== 'todos' && CATEGORIES[currentCat]) {
      catPrefix = CATEGORIES[currentCat].emoji;
      catName = CATEGORIES[currentCat].name;
    }
    
    let brandSuffix = "";
    if (currentBrandCode && currentBrandCode !== 'all' && BRANDS[currentBrandCode]) {
      brandSuffix = ` · ${BRANDS[currentBrandCode]}`;
    }
    
    let searchSuffix = searchQuery ? ` · Búsqueda: "${searchQuery}"` : "";
    
    titleEl.textContent = `${catPrefix} ${catName}${brandSuffix}${searchSuffix} (${filteredItems.length} productos)`;
  }
}

// ─── EVENTOS SELECTORES ──────────────────────────────────────────────
function filterCat(cat) {
  currentCat = cat;
  
  // Actualizar clases activas en categorías
  document.querySelectorAll('.cat-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.cat === cat);
  });
  
  applyFilters();
}

function filterBrand(brandCode, event) {
  if (event) event.stopPropagation();
  currentBrandCode = brandCode;
  
  // Actualizar clases activas en marcas
  document.querySelectorAll('.brand-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.code === brandCode);
  });
  
  applyFilters();
}

function handleSearch() {
  const input = document.getElementById('searchInput');
  if (input) {
    searchQuery = input.value.trim();
    applyFilters();
  }
}

// ─── RENDERIZAR PILAS DE MARCAS DINÁMICAS ────────────────────────────
function renderBrandPills() {
  const container = document.getElementById('brandScroll');
  if (!container) return;
  
  const popularBrands = [
    { code: 'all', name: '✨ Todas' },
    { code: 'ID', name: 'Idraet' },
    { code: 'WE', name: 'Wella' },
    { code: 'LR', name: "L'Oréal" },
    { code: 'SK', name: 'Silkey' },
    { code: 'OW', name: 'Opción' },
    { code: 'TO', name: 'Duga/Xúlu' },
    { code: 'LP', name: 'La Puissance' },
    { code: 'UM', name: 'Real Tech' },
    { code: 'EU', name: 'Exel' },
    { code: 'AR', name: 'Zita' }
  ];
  
  container.innerHTML = popularBrands.map(b => {
    const isActive = b.code === currentBrandCode;
    return `<div class="brand-pill ${isActive ? 'active' : ''}" onclick="filterBrand('${b.code}', event)" data-code="${b.code}">${b.name}</div>`;
  }).join('');
}

// ─── MODO PRECIO PROFESIONAL ──────────────────────────────────────────
function toggleProfessionalMode(checked) {
  isProfessional = checked;
  saveClientData();
  
  // Actualizar alerta de carrito
  const alertBox = document.getElementById('priceTierAlert');
  const alertText = document.getElementById('priceTierAlertText');
  if (alertBox && alertText) {
    if (isProfessional) {
      alertBox.style.background = 'rgba(255, 215, 0, 0.08)';
      alertBox.style.borderColor = 'rgba(255, 215, 0, 0.3)';
      alertBox.style.color = '#b8860b';
      alertText.innerHTML = '<strong>Precios Profesionales de Salón Aplicados</strong>';
    } else {
      alertBox.style.background = 'rgba(230, 95, 0, 0.06)';
      alertBox.style.borderColor = 'var(--border-gold)';
      alertBox.style.color = 'var(--primary)';
      alertText.textContent = 'Precios Públicos Aplicados';
    }
  }
  
  // Mostrar campo profesional en formulario
  const profSec = document.getElementById('secProfesion');
  if (profSec) {
    profSec.style.display = isProfessional ? 'block' : 'none';
    const profInput = document.getElementById('fProfesion');
    if (profInput) profInput.required = isProfessional;
  }
  
  // Re-aplicar filtros para actualizar listado y carrito
  applyFilters();
  updateCartBadge();
  if (document.getElementById('cartPanel').classList.contains('open')) {
    renderCartPanel();
  }
  
  showToast(isProfessional 
    ? '✨ ¡Modo Profesional Activo! Precios de salón aplicados.' 
    : '🛍️ Modo Público Activo. Precios al por menor aplicados.'
  );
}

// ─── MÉTODOS DE ENTREGA EN CHECKOUT ─────────────────────────────────
function setDeliveryMethod(method) {
  deliveryMethod = method;
  document.getElementById('fDeliveryMethod').value = method;
  
  const btnRetiro = document.getElementById('btnRetiro');
  const btnEnvio = document.getElementById('btnEnvio');
  const secRetiro = document.getElementById('secRetiro');
  const secEnvio = document.getElementById('secEnvio');
  
  if (method === 'retiro') {
    btnRetiro.classList.add('active');
    btnEnvio.classList.remove('active');
    secRetiro.style.display = 'block';
    secEnvio.style.display = 'none';
  } else {
    btnRetiro.classList.remove('active');
    btnEnvio.classList.add('active');
    secRetiro.style.display = 'none';
    secEnvio.style.display = 'block';
  }
}

function loadSucursalesDropdown() {
  const select = document.getElementById('fSucursal');
  if (!select) return;
  select.innerHTML = SUCURSALES.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
}

// ─── MÉTODOS DE PAGO EN CHECKOUT ────────────────────────────────────
function setPaymentMethod(method) {
  paymentMethod = method;
  document.getElementById('fPaymentMethod').value = method;
  
  const btnEfectivo = document.getElementById('btnPagoEfectivo');
  const btnTransf = document.getElementById('btnPagoTransferencia');
  const secEfectivo = document.getElementById('secEfectivo');
  const secTransf = document.getElementById('secTransferencia');
  
  if (method === 'efectivo') {
    btnEfectivo.classList.add('active');
    btnTransf.classList.remove('active');
    secEfectivo.style.display = 'block';
    secTransf.style.display = 'none';
  } else {
    btnEfectivo.classList.remove('active');
    btnTransf.classList.add('active');
    secEfectivo.style.display = 'none';
    secTransf.style.display = 'block';
  }
  calculateChange();
}

function calculateChange() {
  const resultDiv = document.getElementById('cashChangeResult');
  if (!resultDiv) return;
  
  if (paymentMethod !== 'efectivo') {
    resultDiv.style.display = 'none';
    return;
  }
  
  const conCuantoVal = document.getElementById('fEfectivoConCuanto').value.trim();
  if (!conCuantoVal) {
    resultDiv.style.display = 'none';
    return;
  }
  
  const conCuanto = parseFloat(conCuantoVal);
  const { total } = getTotals();
  
  if (isNaN(conCuanto)) {
    resultDiv.style.display = 'none';
    return;
  }
  
  if (conCuanto < total) {
    resultDiv.style.display = 'block';
    resultDiv.style.color = '#d90429';
    resultDiv.style.background = 'rgba(217, 4, 41, 0.08)';
    resultDiv.style.borderColor = 'rgba(217, 4, 41, 0.2)';
    resultDiv.textContent = `⚠️ El monto ingresado es menor que el total de la compra (${formatPrice(total)}).`;
  } else {
    const vuelto = conCuanto - total;
    resultDiv.style.display = 'block';
    resultDiv.style.color = '#52b788';
    resultDiv.style.background = 'rgba(82, 183, 136, 0.08)';
    resultDiv.style.borderColor = 'rgba(82, 183, 136, 0.2)';
    resultDiv.textContent = `💵 Vuelto estimado: ${formatPrice(vuelto)}.`;
  }
}

function copyAlias() {
  const aliasText = document.getElementById('transferAliasText')?.textContent || "CAPELLI.TUC.MP";
  navigator.clipboard.writeText(aliasText).then(() => {
    showToast('📋 ¡Alias copiado al portapapeles! Listo para transferir.');
  }).catch(() => {
    showToast('⚠️ No se pudo copiar el alias automáticamente.');
  });
}

// ─── CONTROL DEL CARRITO DE COMPRAS ──────────────────────────────────
function addItem(id, event) {
  if (event) event.stopPropagation();
  
  const item = MENU.find(i => i.id === id);
  if (!item) return;
  
  cart[id] = (cart[id] || 0) + 1;
  
  updateAll(id);
  spawnParticle(id);
  showToast(`🛒 ${item.name} agregado al pedido`);
}

function changeQty(id, delta, event) {
  if (event) event.stopPropagation();
  
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  if (cart[id] === 0) delete cart[id];
  
  updateAll(id);
}

function changeQtyByKey(id, delta) {
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  if (cart[id] === 0) delete cart[id];
  
  updateAll(parseInt(id));
}

function updateAll(changedId) {
  const qty = cart[changedId] || 0;
  const ctrl = document.getElementById('ctrl-' + changedId);
  const mi = document.getElementById('mi-' + changedId);
  
  const activePrice = isProfessional 
    ? MENU.find(i => i.id === changedId)?.price_prof 
    : MENU.find(i => i.id === changedId)?.price;
    
  if (ctrl && mi) {
    if (qty > 0) {
      ctrl.innerHTML = `
        <div class="item-controls-pill">
          <button class="qty-btn" onclick="changeQty(${changedId},-1,event)">−</button>
          <div class="qty-num" id="qn-${changedId}">${qty}</div>
          <button class="qty-btn" onclick="changeQty(${changedId},1,event)">+</button>
        </div>`;
      mi.classList.add('in-cart');
    } else {
      ctrl.innerHTML = `<button class="qty-add-btn" onclick="addItem(${changedId},event)">+</button>`;
      mi.classList.remove('in-cart');
    }
  }
  
  updateCartBadge();
  
  if (document.getElementById('cartPanel').classList.contains('open')) {
    renderCartPanel();
  }
}

function getTotals() {
  let count = 0, total = 0;
  Object.entries(cart).forEach(([idStr, qty]) => {
    const item = MENU.find(i => i.id === parseInt(idStr));
    if (item) {
      count += qty;
      const activePrice = isProfessional ? item.price_prof : item.price;
      total += activePrice * qty;
    }
  });
  return { count, total };
}

function updateCartBadge() {
  const { count, total } = getTotals();
  
  const cartCountEl = document.getElementById('cartCount');
  const btnCountEl = document.getElementById('btnCount');
  const btnTotalEl = document.getElementById('btnTotal');
  const orderBtnEl = document.getElementById('orderBtn');
  
  if (cartCountEl) cartCountEl.textContent = count;
  if (btnCountEl) btnCountEl.textContent = count;
  if (btnTotalEl) btnTotalEl.textContent = formatPrice(total);
  if (orderBtnEl) orderBtnEl.classList.toggle('disabled', count === 0);
  
  if (cartCountEl) {
    cartCountEl.classList.remove('bump');
    void cartCountEl.offsetWidth;
    cartCountEl.classList.add('bump');
  }
}

// ─── PANEL CARRITO DE COMPRAS Y CHECKOUT ─────────────────────────────
function openCart() {
  document.getElementById('cartPanel').classList.add('open');
  document.getElementById('panelOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartPanel();
}

function closeCart() {
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('panelOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartPanel() {
  const { count, total } = getTotals();
  const content = document.getElementById('cartContent');
  const form = document.getElementById('cartForm');
  
  if (count === 0) {
    if (content) {
      content.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-emoji">🛒</div>
          <div class="cart-empty-text">No has seleccionado ningún producto aún.<br>Explorá el catálogo de Club Capelli.</div>
        </div>`;
    }
    if (form) form.style.display = 'none';
    return;
  }
  
  let rows = '<div class="cart-list">';
  Object.entries(cart).forEach(([idStr, qty]) => {
    const item = MENU.find(i => i.id === parseInt(idStr));
    if (!item) return;
    
    const activePrice = isProfessional ? item.price_prof : item.price;
    
    rows += `
      <div class="cart-row">
        <div class="cart-row-photo">
          <div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:24px">${item.emoji}</div>
        </div>
        <div class="cart-row-info">
          <div class="cart-row-name">${item.name}</div>
          <div class="cart-row-price" style="font-size:0.8rem; color:var(--text-muted);">Cód: ${item.code} · U: ${formatPrice(activePrice)}</div>
          <div class="cart-row-total-price" style="font-size:0.92rem; font-weight:700; color:var(--primary);">${formatPrice(activePrice * qty)}</div>
        </div>
        <div class="cart-row-controls">
          <button class="qty-btn" onclick="changeQtyByKey('${item.id}',-1)">−</button>
          <div class="qty-num">${qty}</div>
          <button class="qty-btn" onclick="changeQtyByKey('${item.id}',1)">+</button>
        </div>
      </div>`;
  });
  rows += '</div>';
  
  rows += `<div class="cart-subtotal" style="margin-top:20px"><span>Subtotal Productos</span><span>${formatPrice(total)}</span></div>`;
  rows += `<div class="cart-subtotal"><span>Envío o Retiro</span><span>A Coordinar</span></div>`;
  rows += `<div class="cart-total"><span>Total Final Estimado</span><span>${formatPrice(total)}</span></div>`;
  rows += '<div style="height:15px"></div>';
  
  if (content) content.innerHTML = rows;
  if (form) form.style.display = 'block';
}

// ─── ENVÍO DE PEDIDO A WHATSAPP (+5493814484845) ───────────────────
function sendWhatsApp() {
  const nombre = document.getElementById('fNombre').value.trim();
  const apellido = document.getElementById('fApellido').value.trim();
  const email = document.getElementById('fEmail').value.trim();
  const tel = document.getElementById('fTel').value.trim();
  const nota = document.getElementById('fNota').value.trim();
  
  // Validaciones
  if (!nombre || !apellido) { showToast('⚠️ Por favor ingrese su Nombre y Apellido'); return; }
  if (!email) { showToast('⚠️ Por favor ingrese su dirección de correo'); return; }
  if (!tel) { showToast('⚠️ Por favor ingrese su número celular'); return; }
  
  let deliveryDetails = '';
  if (deliveryMethod === 'retiro') {
    const sucursalSel = document.getElementById('fSucursal');
    const sucursalName = sucursalSel ? sucursalSel.value : 'Sucursal Principal';
    deliveryDetails = `🏢 *Retiro en Sucursal:* ${sucursalName}\n`;
  } else {
    const direccion = document.getElementById('fDireccion').value.trim();
    const localidad = document.getElementById('fLocalidad').value.trim();
    if (!direccion || !localidad) {
      showToast('⚠️ Por favor ingrese Dirección y Localidad para el envío');
      return;
    }
    deliveryDetails = `🚚 *Envío a Domicilio:*\n   📍 *Dirección:* ${direccion}\n   🏙️ *Localidad:* ${localidad}\n`;
  }
  
  let profDetails = '';
  if (isProfessional) {
    const profesion = document.getElementById('fProfesion').value.trim();
    if (!profesion) {
      showToast('⚠️ Por favor ingrese el Nombre de su Salón o Profesión');
      return;
    }
    profDetails = `👑 *Salón / Profesión:* ${profesion}\n`;
  }
  
  const { total } = getTotals();
  const orderId = generateOrderId();
  
  // Armado del mensaje de WhatsApp
  let paymentDetails = '';
  if (paymentMethod === 'efectivo') {
    const conCuantoVal = document.getElementById('fEfectivoConCuanto').value.trim();
    if (conCuantoVal) {
      const conCuanto = parseFloat(conCuantoVal);
      if (!isNaN(conCuanto) && conCuanto >= total) {
        const vuelto = conCuanto - total;
        paymentDetails = `💵 *Medio de Pago:* Efectivo (Abona con ${formatPrice(conCuanto)} · Vuelto: ${formatPrice(vuelto)})\n`;
      } else {
        paymentDetails = `💵 *Medio de Pago:* Efectivo (Pago exacto)\n`;
      }
    } else {
      paymentDetails = `💵 *Medio de Pago:* Efectivo (Pago exacto)\n`;
    }
  } else {
    paymentDetails = `🏦 *Medio de Pago:* Transferencia Bancaria (Alias brindado: CAPELLI.TUC.MP)\n`;
  }

  let msg = `🛍️ *PEDIDO CLUB CAPELLI* 🛍️\n`;
  msg += `*Sucursal Virtual Premium*\n`;
  msg += `───────────────────────────\n\n`;
  msg += `👤 *Cliente:* ${nombre} ${apellido}\n`;
  msg += `📞 *Celular:* ${tel}\n`;
  msg += `📧 *Email:* ${email}\n`;
  msg += profDetails;
  msg += deliveryDetails;
  msg += paymentDetails;
  msg += `🏷️ *Categoría de Precios:* ${isProfessional ? 'PROFESIONAL (Salón)' : 'PÚBLICO GENERAL'}\n`;
  msg += `───────────────────────────\n\n`;
  
  msg += `🛒 *Detalle del Pedido (${orderId}):*\n`;
  
  Object.entries(cart).forEach(([idStr, qty]) => {
    const item = MENU.find(i => i.id === parseInt(idStr));
    if (item) {
      const activePrice = isProfessional ? item.price_prof : item.price;
      msg += `  • ${qty}x [Cód: ${item.code}] _${item.name}_\n`;
      msg += `    Content: ${item.content} — ${formatPrice(activePrice * qty)}\n`;
    }
  });
  
  msg += `\n💵 *TOTAL ESTIMADO: ${formatPrice(total)}*\n`;
  msg += `_(Sujeto a verificación de stock y facturación de sucursal)_\n`;
  
  if (nota) {
    msg += `\n📝 *Notas del Pedido:* ${nota}\n`;
  }
  
  msg += `\n📲 _Pedido generado digitalmente desde la Sucursal Virtual Club Capelli_`;
  
  saveClientData();
  
  // Redirección directa al número solicitado: +5493814484845
  const WA_TARGET = '5493814484845';
  window.open(`https://wa.me/${WA_TARGET}?text=${encodeURIComponent(msg)}`, '_blank');
  showToast(`📲 Redirigiendo a Club Capelli Tucumán...`);
}

// ─── TOAST NOTIFICATION PREMIUM ────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ─── ANIMACIÓN DE PARTICULAS (Micro-animations) ─────────────────────
function spawnParticle(id) {
  const ctrl = document.getElementById('ctrl-' + id);
  if (!ctrl) return;
  
  const rect = ctrl.getBoundingClientRect();
  const p = document.createElement('div');
  p.className = 'particle';
  
  const item = MENU.find(i => i.id === id);
  p.textContent = item ? item.emoji : '💇';
  
  p.style.left = (rect.left + rect.width / 2 - 12) + 'px';
  p.style.top = (rect.top + window.scrollY) + 'px';
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 800);
}

// ─── OBSERVERS DE INTERSECCIÓN (FADE-IN AL HACER SCROLL) ───────────
function initScrollObserver() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  
  document.querySelectorAll('.fade-section').forEach(el => observer.observe(el));
}

// ─── INICIALIZACIÓN ────────────────────────────────────────────────
function init() {
  // Splash Screen Fade out
  const splash = document.getElementById('splash');
  if (splash) {
    setTimeout(() => {
      splash.classList.add('fade-out');
    }, 4200); // 4.2 segundos para una entrada y presentación cinematográfica completa
  }
  
  // Cargar dropdown e inicializar listado de productos
  loadSucursalesDropdown();
  renderBrandPills();
  
  // Establecer filteredItems por defecto y renderizar
  filteredItems = MENU;
  renderFilteredMenu();
  updateSentinelVisibility();
  
  // Setup Scroll e Intersecciones
  setupInfiniteScroll();
  initScrollObserver();
  
  // Cargar datos guardados del cliente
  loadClientData();
}

// ─── MODAL INFORMATIVO DE DETALLE DE PRODUCTOS ────────────────────────
function openProductModal(id) {
  const item = MENU.find(i => i.id === id);
  if (!item) return;
  
  const overlay = document.getElementById('productModalOverlay');
  const modal = document.getElementById('productModal');
  
  // Obtener elementos del modal
  const imgWrap = document.getElementById('pmImageWrap');
  const title = document.getElementById('pmTitle');
  const category = document.getElementById('pmCategory');
  const desc = document.getElementById('pmDesc');
  const price = document.getElementById('pmPrice');
  const ingredients = document.getElementById('pmIngredients');
  const ingredientsSec = document.getElementById('pmIngredientsSection');
  const ratingValue = document.querySelector('.pm-rating-value');
  const stars = document.querySelector('.pm-stars');
  
  if (imgWrap) {
    const imgSrc = getProductImage(item);
    imgWrap.innerHTML = `
      <img src="${imgSrc}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover; filter: brightness(0.95);">
    `;
  }
  if (title) title.textContent = item.name;
  
  if (category && CATEGORIES[item.cat]) {
    category.textContent = CATEGORIES[item.cat].name;
  }
  
  if (desc) desc.textContent = `Presentación y Contenido: ${item.content}`;
  
  const activePrice = isProfessional ? item.price_prof : item.price;
  if (price) {
    price.innerHTML = `${formatPrice(activePrice)} ${isProfessional ? '<span class="price-badge-prof">Profesional</span>' : ''}`;
  }
  
  if (ingredients) {
    ingredients.textContent = item.brand;
  }
  
  if (ratingValue) ratingValue.textContent = `Código Original: ${item.code}`;
  if (stars) {
    stars.textContent = '🌟🌟🌟🌟🌟';
  }
  
  if (overlay && modal) {
    overlay.classList.add('open');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeProductModal() {
  const overlay = document.getElementById('productModalOverlay');
  const modal = document.getElementById('productModal');
  
  if (overlay && modal) {
    overlay.classList.remove('open');
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Iniciar aplicación al cargar
window.addEventListener('DOMContentLoaded', init);