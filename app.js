// ─── ESTADO GLOBAL DE LA APLICACIÓN ─────────────────────────────────
let cart = {};                  // Estructura: { id_producto: cantidad }
let currentCat = 'todos';       // Categoría activa
let currentSubCat = 'todos';    // Subcategoría activa
let currentBrandCode = 'all';   // Código de marca filtrado
let searchQuery = '';           // Búsqueda por texto
let isProfessional = false;     // Si ve precios profesionales
let deliveryMethod = 'retiro';  // Método de entrega: 'retiro' o 'envio'
let paymentMethod = 'efectivo'; // Método de pago: 'efectivo' o 'transferencia'
let activeTag = '';             // Etiqueta rápida activa
let lastOrderCartCopy = {};     // Copia de seguridad del último pedido
let wishlist = new Set();       // IDs de productos marcados como favoritos

// Reglas de Sub-Categorías dinámicas en tiempo real (evita alterar data.js)
const SUBCATEGORIES_RULES = {
  capilar: [
    { key: 'shampoo', name: 'Shampoo y Enjuague', words: ['shampoo', 'acondicionador', 'enjuague', 'crema de enjuague', 'sh.'] },
    { key: 'tintura', name: 'Tinturas y Oxidantes', words: ['tintura', 'coloracion', 'kit', 'oxidante', 'activador', 'cielo color', 'tono', 'c.color', 'cartoon'] },
    { key: 'tratamiento', name: 'Tratamientos y Máscaras', words: ['tratamiento', 'mascara', 'ampolla', 'crema de peinar', 'oleo', 'aceite', 'nutricion', 'alisado', 'kleral', 'keratina', 'reconstructor'] },
    { key: 'otros', name: 'Otros Capilares', words: [] }
  ],
  unas: [
    { key: 'esmalte', name: 'Esmaltes y Geles', words: ['esmalte', 'gel', 'semipermanente', 'base coat', 'top coat', 'meline', 'zita', 'nails', 'uv gel', 'via lactea'] },
    { key: 'herramientas', name: 'Limas y Tornos', words: ['lima', 'torno', 'fresa', 'cortaunas', 'alicates', 'repujador', 'corta cuticula', 'bloque pulidor'] },
    { key: 'cabinas', name: 'Cabinas y Lámparas', words: ['cabina', 'lampara', 'uv', 'led', 'esterilizador'] },
    { key: 'otros', name: 'Otros Manicuría', words: [] }
  ],
  skincare: [
    { key: 'limpieza', name: 'Limpieza y Exfoliación', words: ['limpieza', 'exfoliante', 'gel de limpieza', 'agua micelar', 'leche de limpieza', 'tonico', 'bruma'] },
    { key: 'serum', name: 'Serums y Ampollas', words: ['serum', 'ampolla', 'concentrado', 'acido', 'hialuronico', 'vitamina c'] },
    { key: 'cremas', name: 'Cremas Hidratantes', words: ['crema', 'hidratante', 'gel', 'emulsion', 'mascara facial'] },
    { key: 'otros', name: 'Otros Skincare', words: [] }
  ],
  herramientas: [
    { key: 'secadores', name: 'Secadores y Planchas', words: ['secador', 'plancha', 'planchita', 'buclera', 'difusor'] },
    { key: 'tijeras', name: 'Tijeras y Navajas', words: ['tijera', 'navaja', 'hoja de afeitar', 'filo', 'navajin'] },
    { key: 'maquinas', name: 'Máquinas Cortadoras', words: ['maquina', 'patillera', 'clipper', 'trimmer', 'afeitadora'] },
    { key: 'otros', name: 'Otros Equipos', words: [] }
  ],
  maquillaje: [
    { key: 'rostro', name: 'Rostro y Bases', words: ['base', 'corrector', 'polvo', 'rubor', 'iluminador', 'primer', 'makeup'] },
    { key: 'ojos', name: 'Ojos y Cejas', words: ['sombra', 'delineador', 'rimel', 'mascara de pestanas', 'cejas', 'pestanas'] },
    { key: 'labios', name: 'Labios', words: ['labial', 'brillo', 'delineador de labios', 'gloss', 'lipstick'] },
    { key: 'otros', name: 'Otros Maquillaje', words: [] }
  ],
  accesorios: [
    { key: 'pinceles', name: 'Pinceles y Brochas', words: ['pincel', 'brocha', 'esponja', 'aplicador', 'brush'] },
    { key: 'descartables', name: 'Descartables e Higiene', words: ['algodon', 'descartable', 'toallitas', 'capa', 'guantes', 'banda', 'cuello'] },
    { key: 'otros', name: 'Otros Accesorios', words: [] }
  ]
};

// Clasificador dinámico de subcategorías
function getItemSubCat(item) {
  const rules = SUBCATEGORIES_RULES[item.cat];
  if (!rules) return 'otros';
  const nameLower = item.name.toLowerCase();
  const brandLower = item.brand.toLowerCase();
  for (let rule of rules) {
    if (rule.words.length === 0) continue;
    if (rule.words.some(word => nameLower.includes(word) || brandLower.includes(word))) {
      return rule.key;
    }
  }
  return 'otros';
}

// Renderizar pastillas de subcategorías
function renderSubCategories() {
  const wrap = document.getElementById('fsSubCats');
  const scroll = document.getElementById('subcatScroll');
  if (!wrap || !scroll) return;
  if (currentCat === 'todos') {
    wrap.style.display = 'none';
    scroll.innerHTML = '';
    currentSubCat = 'todos';
    return;
  }
  const rules = SUBCATEGORIES_RULES[currentCat];
  if (!rules) {
    wrap.style.display = 'none';
    return;
  }
  let html = `<button class="subcat-pill ${currentSubCat === 'todos' ? 'active' : ''}" onclick="filterSubCat('todos')">🌐 Todos</button>`;
  rules.forEach(rule => {
    const count = MENU.filter(p => p.cat === currentCat && (rule.key === 'otros' ? getItemSubCat(p) === 'otros' : getItemSubCat(p) === rule.key)).length;
    if (count > 0) {
      html += `<button class="subcat-pill ${currentSubCat === rule.key ? 'active' : ''}" onclick="filterSubCat('${rule.key}')">${rule.name} (${count})</button>`;
    }
  });
  scroll.innerHTML = html;
  wrap.style.display = 'block';
}

function filterSubCat(subcat) {
  currentSubCat = subcat;
  applyFilters();
  renderSubCategories();
}

// Algoritmo Levenshtein para Fuzzy Search Offline
function levenshteinDistance(s1, s2) {
  if (s1.length < s2.length) return levenshteinDistance(s2, s1);
  if (s2.length === 0) return s1.length;
  let prev = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 0; i < s1.length; i++) {
    let curr = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      let insert = prev[j + 1] + 1;
      let del = curr[j] + 1;
      let sub = prev[j] + (s1[i] === s2[j] ? 0 : 1);
      curr.push(Math.min(insert, del, sub));
    }
    prev = curr;
  }
  return prev[s2.length];
}

function isFuzzyMatch(productWord, queryWord) {
  if (queryWord.length < 3) return productWord.includes(queryWord);
  const maxDist = queryWord.length > 5 ? 2 : 1;
  if (productWord.includes(queryWord)) return true;
  if (productWord.length >= queryWord.length) {
    for (let i = 0; i <= productWord.length - queryWord.length; i++) {
      const subWord = productWord.substring(i, i + queryWord.length);
      if (levenshteinDistance(subWord, queryWord) <= maxDist) return true;
    }
  }
  return levenshteinDistance(productWord, queryWord) <= maxDist;
}

// Resaltador de coincidencia en texto UI
function highlightText(text, query) {
  if (!query) return text;
  const words = query.toLowerCase().split(/\s+/).filter(w => w.trim().length > 1);
  if (words.length === 0) return text;
  let highlighted = text;
  words.sort((a, b) => b.length - a.length);
  words.forEach(word => {
    const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedWord})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark class="highlight-text">$1</mark>');
  });
  return highlighted;
}

// Helper seguro para LocalStorage (Previene caídas en Modo Incógnito estricto o protocolo file://)
const safeStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage.getItem bloqueado o no disponible:", e);
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage.setItem bloqueado o no disponible:", e);
    }
  }
};

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
  
  safeStorage.setItem('capelli_nombre', nombre);
  safeStorage.setItem('capelli_apellido', apellido);
  safeStorage.setItem('capelli_email', email);
  safeStorage.setItem('capelli_tel', tel);
  safeStorage.setItem('capelli_sucursal', sucursal);
  safeStorage.setItem('capelli_direccion', direccion);
  safeStorage.setItem('capelli_localidad', localidad);
  safeStorage.setItem('capelli_profesion', profesion);
  safeStorage.setItem('capelli_is_prof', isProfessional ? 'true' : 'false');
}

function loadClientData() {
  const nombre = safeStorage.getItem('capelli_nombre') || '';
  const apellido = safeStorage.getItem('capelli_apellido') || '';
  const email = safeStorage.getItem('capelli_email') || '';
  const tel = safeStorage.getItem('capelli_tel') || '';
  const sucursal = safeStorage.getItem('capelli_sucursal') || '';
  const direccion = safeStorage.getItem('capelli_direccion') || '';
  const localidad = safeStorage.getItem('capelli_localidad') || '';
  const profesion = safeStorage.getItem('capelli_profesion') || '';
  const isProfStr = safeStorage.getItem('capelli_is_prof') || 'false';
  
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
    
    const displayName = searchQuery ? highlightText(item.name, searchQuery) : item.name;
    const displayBrand = searchQuery ? highlightText(item.brand, searchQuery) : item.brand;
    
    const isInWishlist = wishlist.has(item.id);
    
    html += `
      <div class="menu-item ${inCart ? 'in-cart' : ''}" id="mi-${item.id}" onclick="openProductModal(${item.id})">
        <div class="item-photo">
          ${photoHTML(getProductImage(item), item.emoji, item.name)}
        </div>
        <button class="wishlist-toggle-btn ${isInWishlist ? 'active' : ''}" id="wb-${item.id}" onclick="toggleWishlist(${item.id}, event)" title="${isInWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}">${isInWishlist ? '❤️' : '🤍'}</button>
        <div class="item-info">
          <div>
            <div class="item-brand-label" style="font-size:0.75rem; font-weight:700; color:var(--primary); text-transform:uppercase; margin-bottom:4px;">${displayBrand}</div>
            <div class="item-name">${displayName}</div>
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
  
  if (activeTag) {
    // 1. Filtrar por pastilla de tag rápido activa
    if (activeTag === 'popular') {
      items = items.filter(p => p.id % 7 === 0 || p.name.toLowerCase().includes('crema') || p.name.toLowerCase().includes('shampoo') || p.name.toLowerCase().includes('ampolla'));
    } else if (activeTag === 'oferta') {
      items = items.filter(p => p.price_prof < p.price || p.id % 9 === 0);
    } else if (activeTag === 'premium') {
      items = items.filter(p => p.brandCode === 'WE' || p.brandCode === 'LR' || p.brandCode === 'LP');
    } else if (activeTag === 'vegano') {
      items = items.filter(p => p.name.toLowerCase().includes('organic') || p.name.toLowerCase().includes('natural') || p.name.toLowerCase().includes('vegano') || p.brandCode === 'EU');
    }
  } else {
    // 1. Filtrar por Categoría
    if (currentCat !== 'todos') {
      items = items.filter(p => p.cat === currentCat);
      
      // Filtrar por Sub-categoría si está seleccionada
      if (currentSubCat !== 'todos') {
        items = items.filter(p => getItemSubCat(p) === currentSubCat);
      }
    }
    
    // 2. Filtrar por Marca
    if (currentBrandCode && currentBrandCode !== 'all') {
      items = items.filter(p => p.brandCode === currentBrandCode);
    }
  }
  
  // 3. Filtrar por Texto (Búsqueda combinada de palabras sueltas con Fuzzy Search)
  if (searchQuery) {
    const words = searchQuery.toLowerCase().split(/\s+/).filter(w => w.trim() !== '');
    if (words.length > 0) {
      items = items.filter(p => {
        const productName = p.name.toLowerCase();
        const productCode = p.code.toLowerCase();
        const productBrand = p.brand.toLowerCase();
        
        return words.every(word => {
          // Coincidencia exacta rápida
          if (productName.includes(word) || productCode.includes(word) || productBrand.includes(word)) {
            return true;
          }
          // Coincidencia difusa por distancia de Levenshtein en palabras individuales
          const nameWords = productName.split(/[\s,.\-\/]+/);
          const brandWords = productBrand.split(/[\s,.\-\/]+/);
          return nameWords.some(nw => isFuzzyMatch(nw, word)) || brandWords.some(bw => isFuzzyMatch(bw, word));
        });
      });
    }
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
    
    titleEl.innerHTML = `
      <span class="menu-title-main">${catPrefix} ${catName}${brandSuffix}${searchSuffix}</span>
      <span class="menu-title-count-badge">${filteredItems.length} productos encontrados</span>
    `;
  }
}

// ─── EVENTOS SELECTORES ──────────────────────────────────────────────
function filterCat(cat) {
  currentCat = cat;
  currentSubCat = 'todos'; // Resetear subcategoría activa
  
  // Limpiar filtro por etiquetas (Tags) al cambiar de categoría
  activeTag = '';
  document.querySelectorAll('.tag-pill').forEach(pill => pill.classList.remove('active'));
  
  // Limpiar búsqueda por texto al cambiar de categoría para evitar conflictos
  searchQuery = '';
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  
  // Actualizar clases activas en categorías
  document.querySelectorAll('.cat-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.cat === cat);
  });
  
  applyFilters();
  renderSubCategories(); // Renderizar deslizador de subcategorías anidadas
}

function filterBrand(brandCode, event) {
  if (event) event.stopPropagation();
  currentBrandCode = brandCode;
  
  // Limpiar filtro por etiquetas (Tags) al cambiar de marca
  activeTag = '';
  document.querySelectorAll('.tag-pill').forEach(pill => pill.classList.remove('active'));
  
  // Limpiar búsqueda por texto al cambiar de marca para evitar conflictos
  searchQuery = '';
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  
  // Actualizar clases activas en marcas
  document.querySelectorAll('.brand-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.code === brandCode);
  });
  
  applyFilters();
}

let searchDebounceTimer;
function handleSearch() {
  const input = document.getElementById('searchInput');
  if (input) {
    searchQuery = input.value.trim();
    
    // Aplicar debouncing de 200ms para evitar múltiples barridos pesados de CPU al escribir rápido
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      applyFilters();
      showSuggestions(searchQuery); // Desplegar autocompletado Spotlight
    }, 200);
  }
}

// ─── RENDERIZAR PILAS DE MARCAS DINÁMICAS ────────────────────────────
function renderBrandPills() {
  const container = document.getElementById('brandScroll');
  if (!container) return;
  
  const popularBrands = [
    { code: 'all', name: 'Todas', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&q=80' },
    { code: 'ID', name: 'Idraet', img: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=150&q=80' },
    { code: 'WE', name: 'Wella', img: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=150&q=80' },
    { code: 'LR', name: "L'Oréal", img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=150&q=80' },
    { code: 'SK', name: 'Silkey', img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&q=80' },
    { code: 'OW', name: 'Opción', img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=150&q=80' },
    { code: 'TO', name: 'Duga/Xúlu', img: 'https://images.unsplash.com/photo-1522337654788-7b8299836e1a?w=150&q=80' },
    { code: 'LP', name: 'La Puissance', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=150&q=80' },
    { code: 'UM', name: 'Real Tech', img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=150&q=80' },
    { code: 'EU', name: 'Exel', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&q=80' },
    { code: 'AR', name: 'Zita', img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=150&q=80' }
  ];
  
  container.innerHTML = popularBrands.map(b => {
    const isActive = b.code === currentBrandCode;
    return `
      <div class="brand-card brand-pill ${isActive ? 'active' : ''}" onclick="filterBrand('${b.code}', event)" data-code="${b.code}">
        <div class="brand-card-img-wrap">
          <img src="${b.img}" alt="${b.name}" class="brand-card-img">
        </div>
        <div class="brand-card-title">${b.name}</div>
      </div>`;
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
  const aliasText = document.getElementById('transferAliasText')?.textContent || "clubcapelli.mp";
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
  playSound('add');
  showToast(`🛒 ${item.name} agregado al pedido`);
}

function changeQty(id, delta, event) {
  if (event) event.stopPropagation();
  
  const prevQty = cart[id] || 0;
  cart[id] = Math.max(0, prevQty + delta);
  if (cart[id] === 0) delete cart[id];
  
  if (delta < 0 && prevQty > 0) playSound('remove');
  
  updateAll(id);
}

function changeQtyByKey(id, delta) {
  const prevQty = cart[id] || 0;
  cart[id] = Math.max(0, prevQty + delta);
  if (cart[id] === 0) delete cart[id];
  
  if (delta < 0 && prevQty > 0) playSound('remove');
  
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
  
  // ── CROSS-SELLING: Sugerencias Inteligentes ──
  const crossItems = getCrossSellItems();
  if (crossItems.length > 0) {
    rows += `
      <div class="cross-sell-section">
        <div class="cross-sell-title">✨ También te puede interesar</div>
        <div class="cross-sell-list">
          ${crossItems.map(p => {
            const p2 = isProfessional ? p.price_prof : p.price;
            return `<div class="cross-sell-card" onclick="addCrossSell(${p.id})">
              <div class="cs-emoji">${p.emoji}</div>
              <div class="cs-info">
                <div class="cs-name">${p.name.substring(0, 28)}${p.name.length > 28 ? '...' : ''}</div>
                <div class="cs-price">${formatPrice(p2)}</div>
              </div>
              <button class="cs-add-btn" title="Agregar">+</button>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }
  
  if (content) content.innerHTML = rows;
  if (form) form.style.display = 'block';
}

// ─── ENVÍO DE PEDIDO A WHATSAPP (+5493814647103) ───────────────────
async function sendWhatsApp() {
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
    paymentDetails = `🏦 *Medio de Pago:* Transferencia Bancaria (Alias brindado: clubcapelli.mp)\n`;
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

  // Activar spinner premium de carga en el botón
  const waBtn = document.querySelector('.wa-btn');
  if (waBtn) waBtn.classList.add('loading');

  // Preparar payload de datos para el repositorio central en Google Sheets
  const itemsList = Object.entries(cart).map(([idStr, qty]) => {
    const item = MENU.find(i => i.id === parseInt(idStr));
    if (!item) return null;
    const activePrice = isProfessional ? item.price_prof : item.price;
    return {
      qty,
      code: item.code,
      name: item.name,
      cat: item.cat || 'General',
      totalPrice: activePrice * qty
    };
  }).filter(Boolean);

  const productosResumen = itemsList.map(i => `${i.qty}x ${i.name} (${i.code})`).join(', ');
  const cantidadTotal = itemsList.reduce((sum, i) => sum + i.qty, 0);
  const categoriasResumen = [...new Set(itemsList.map(i => i.cat))].join(', ');

  const orderData = {
    timestamp: new Date().toISOString(),
    fecha: new Date().toLocaleDateString('es-AR'),
    hora: new Date().toLocaleTimeString('es-AR'),
    orderId: orderId,
    nombre: `${nombre} ${apellido}`,
    telefono: tel,
    email: email,
    deliveryMethod: deliveryMethod === 'retiro' ? 'Retiro en Sucursal' : 'Envío a Domicilio',
    sucursal: deliveryMethod === 'retiro' ? (document.getElementById('fSucursal')?.value || 'Sucursal Principal') : '',
    direccion: deliveryMethod === 'envio' ? (document.getElementById('fDireccion')?.value.trim() || '') : '',
    localidad: deliveryMethod === 'envio' ? (document.getElementById('fLocalidad')?.value.trim() || '') : '',
    categoriaCliente: isProfessional ? 'Profesional (Salón)' : 'Público General',
    productosResumen: productosResumen,
    cantidadTotal: cantidadTotal,
    categoriasResumen: categoriasResumen,
    total: total,
    observaciones: nota,
    medioPago: paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia Bancaria',
    mensajeWhatsapp: msg,
    estado: 'Pendiente de envío',
    canal: 'Web',
    sessionId: GoogleSheetsService.getSessionId(),
    ip: 'Obteniendo...',
    usuarioResponsable: 'Cliente Autónomo'
  };

  try {
    // Obtener IP pública en segundo plano
    orderData.ip = await GoogleSheetsService.getIPAddress();
    
    // Guardar registro comercial en Google Sheets a través de Apps Script
    const result = await GoogleSheetsService.registerOrder(orderData);
    
    if (result && result.status === 'success') {
      console.info("GoogleSheetsService: Solicitud registrada exitosamente en Google Sheets. ID:", orderId);
      showToast('✅ ¡Solicitud registrada con éxito!');
    } else if (result && result.status === 'duplicate') {
      console.warn("GoogleSheetsService: Se detectó una solicitud duplicada. Ignorando escritura.");
    } else if (result && result.status === 'unconfigured') {
      console.info("GoogleSheetsService: La URL de Apps Script no está configurada aún. Saltando guardado.");
    } else {
      console.warn("GoogleSheetsService: Respuesta inesperada al registrar orden:", result);
    }
  } catch (error) {
    console.error("GoogleSheetsService: Error crítico al escribir en Google Sheets. Continuando flujo para no perder venta:", error);
    showToast('⚠️ No se pudo guardar en planilla, enviando por WhatsApp...');
  } finally {
    // Apagar spinner de carga en el botón
    if (waBtn) waBtn.classList.remove('loading');
  }
  
  saveClientData();
  
  // Respaldar copia del pedido para poder descargar el recibo físico después de limpiar el carro
  lastOrderCartCopy = { ...cart };
  
  // Guardar en Historial de Pedidos
  saveOrderToHistory(orderId, `${nombre} ${apellido}`, total, deliveryMethod);
  
  // Vaciar carrito y cerrar panel ANTES de mostrar celebración
  const cartSnapshot = { ...cart };
  cart = {};
  closeCart();
  updateCartBadge();
  applyFilters();
  
  // URL de WhatsApp lista para disparar después del countdown
  const WA_TARGET = '5493814647103';
  const waUrl = `https://wa.me/${WA_TARGET}?text=${encodeURIComponent(msg)}`;
  
  // 🎉 Abrir modal de celebración → luego WhatsApp → luego recibo
  openCelebrationModal({
    orderId,
    clientName: `${nombre} ${apellido}`,
    tel,
    deliveryMethod,
    total,
    waUrl
  });
}

// ─── MODAL DE CELEBRACIÓN + AUTO REDIRECT A WHATSAPP ─────────────────
let _celebrationCountdownTimer = null;
let _celebWaUrl   = '';

function openCelebrationModal({ waUrl }) {
  playSound('order');

  _celebWaUrl = waUrl;

  const overlay = document.getElementById('celebrationOverlay');
  const modal   = document.getElementById('celebrationModal');
  if (!overlay || !modal) return;

  // Mostrar modal
  overlay.classList.add('open');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Confetti
  spawnCelebrationEmojis();

  // Countdown VISUAL y AUTO REDIRECT a los 3 segundos
  let seconds = 3;
  updateCelebCountdown(seconds);
  clearTimeout(_celebrationCountdownTimer);

  function tick() {
    seconds--;
    updateCelebCountdown(seconds);
    if (seconds <= 0) {
      // Countdown terminó → Abrir WhatsApp automáticamente
      if (_celebWaUrl) {
        // Intentar abrir en pestaña nueva. Si el bloqueador de popups del navegador la detiene debido a la llamada asíncrona,
        // redirigimos en la pestaña actual. Esto nunca se bloquea y abre WhatsApp Web/App sin fallos.
        const newWin = window.open(_celebWaUrl, '_blank');
        if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
          window.location.href = _celebWaUrl;
        }
        showToast('📲 ¡Conectándote con un asesor por WhatsApp!');
      }
      closeCelebrationModal();
    } else {
      _celebrationCountdownTimer = setTimeout(tick, 1000);
    }
  }

  _celebrationCountdownTimer = setTimeout(tick, 1000);
}

function updateCelebCountdown(n) {
  const numEl  = document.getElementById('celebCountdownNum');
  const ringEl = document.getElementById('celebCountdownRing');
  if (numEl)  numEl.textContent  = n;
  if (ringEl) {
    const circumference = 283;
    const pct = n / 3; // 3→1  2→0.67  1→0.33  0→0
    ringEl.style.strokeDashoffset = String(circumference * (1 - pct));
  }
}

function closeCelebrationModal() {
  clearTimeout(_celebrationCountdownTimer);
  const overlay = document.getElementById('celebrationOverlay');
  const modal   = document.getElementById('celebrationModal');
  if (overlay) overlay.classList.remove('open');
  if (modal)   modal.classList.remove('open');
  document.body.style.overflow = '';
}

function spawnCelebrationEmojis() {
  const emojis = ['🎉','✨','💫','🌟','💎','🛍️','💅','💇','🌸','🎊'];
  for (let i = 0; i < 18; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'celeb-emoji-particle';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = (10 + Math.random() * 80) + 'vw';
      el.style.animationDelay = (Math.random() * 0.5) + 's';
      el.style.fontSize = (1.2 + Math.random() * 1.2) + 'rem';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2200);
    }, i * 60);
  }
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

// ─── CAROUSEL AUTO-ROTATIVO DEL HERO BANNER (SLIDER COMPACTO) ───────
function startHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length <= 1) return;
  
  let currentIndex = 0;
  setInterval(() => {
    slides[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + 1) % slides.length;
    slides[currentIndex].classList.add('active');
  }, 4000); // Rotar cada 4 segundos
}

// ════════════════════════════════════════════════════════════════════
// ─── MÓDULO ÉLITE 1: MICRO-SONIDOS HÁPTICOS (Web Audio API) ─────────
// ════════════════════════════════════════════════════════════════════
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playSound(type) {
  try {
    // Verificar si el usuario desactivó sonidos
    if (safeStorage.getItem('capelli_sounds') === 'off') return;
    const ctx = getAudioCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'add') {
      // Sonido suave de "pop" al agregar al carrito
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(520, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.08);
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.18);
    } else if (type === 'remove') {
      // Sonido descendente suave al quitar un producto
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(480, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } else if (type === 'order') {
      // Fanfare corta de celebración al enviar pedido
      const notes = [523, 659, 784];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        g.gain.setValueAtTime(0.0, ctx.currentTime + i * 0.12);
        g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.18);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.18);
      });
      return;
    } else if (type === 'wishlist') {
      // Tono suave de corazón
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1047, ctx.currentTime + 0.07);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    }
  } catch (e) { /* Silenciar en contextos sin audio */ }
}

// ════════════════════════════════════════════════════════════════════
// ─── MÓDULO ÉLITE 2: LISTA DE FAVORITOS (WISHLIST) ──────────────────
// ════════════════════════════════════════════════════════════════════
function loadWishlist() {
  const stored = safeStorage.getItem('capelli_wishlist');
  if (stored) {
    try {
      wishlist = new Set(JSON.parse(stored));
    } catch (e) {
      wishlist = new Set();
    }
  }
}

function saveWishlist() {
  safeStorage.setItem('capelli_wishlist', JSON.stringify([...wishlist]));
}

function toggleWishlist(id, event) {
  if (event) event.stopPropagation();
  const numId = parseInt(id);
  if (wishlist.has(numId)) {
    wishlist.delete(numId);
    showToast('💔 Eliminado de favoritos');
  } else {
    wishlist.add(numId);
    showToast('❤️ ¡Agregado a favoritos!');
    playSound('wishlist');
  }
  saveWishlist();
  // Actualizar ícono en la tarjeta visible
  const btn = document.getElementById(`wb-${numId}`);
  if (btn) {
    btn.classList.toggle('active', wishlist.has(numId));
    btn.textContent = wishlist.has(numId) ? '❤️' : '🤍';
  }
  // Actualizar contador del panel
  updateWishlistBadge();
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlistBadge');
  if (badge) {
    badge.textContent = wishlist.size;
    badge.style.display = wishlist.size > 0 ? 'flex' : 'none';
  }
}

function openWishlistPanel() {
  const panel = document.getElementById('wishlistPanel');
  const overlay = document.getElementById('wishlistOverlay');
  if (panel) panel.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderWishlistPanel();
  playSound('wishlist');
}

function closeWishlistPanel() {
  const panel = document.getElementById('wishlistPanel');
  const overlay = document.getElementById('wishlistOverlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function renderWishlistPanel() {
  const container = document.getElementById('wishlistContent');
  if (!container) return;
  
  if (wishlist.size === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-emoji">🤍</div>
        <div class="cart-empty-text">Tu lista de favoritos está vacía.<br>Tocá el corazón 🤍 en cualquier producto para guardarlo aquí.</div>
      </div>`;
    return;
  }
  
  let html = '<div class="wishlist-list">';
  wishlist.forEach(id => {
    const item = MENU.find(i => i.id === id);
    if (!item) return;
    const activePrice = isProfessional ? item.price_prof : item.price;
    html += `
      <div class="wishlist-row">
        <div class="wishlist-row-emoji">${item.emoji}</div>
        <div class="wishlist-row-info">
          <div class="wishlist-row-name">${item.name}</div>
          <div class="wishlist-row-brand">${item.brand} · ${item.content}</div>
          <div class="wishlist-row-price">${formatPrice(activePrice)}</div>
        </div>
        <div class="wishlist-row-actions">
          <button class="wl-add-btn" onclick="addFromWishlist(${item.id})" title="Agregar al pedido">🛒</button>
          <button class="wl-remove-btn" onclick="toggleWishlist(${item.id}, event)" title="Quitar de favoritos">✕</button>
        </div>
      </div>`;
  });
  html += '</div>';
  html += `<div class="wl-footer-actions">`;
  html += `<button class="wl-add-all-btn" onclick="addAllFromWishlist()">🛒 Agregar Todos al Pedido</button>`;
  html += `</div>`;
  container.innerHTML = html;
}

function addFromWishlist(id) {
  cart[id] = (cart[id] || 0) + 1;
  updateAll(id);
  spawnParticle(id);
  playSound('add');
  const item = MENU.find(i => i.id === id);
  showToast(`🛒 ${item?.name} agregado desde Favoritos`);
  renderWishlistPanel();
}

function addAllFromWishlist() {
  if (wishlist.size === 0) return;
  wishlist.forEach(id => {
    cart[id] = (cart[id] || 0) + 1;
  });
  updateCartBadge();
  playSound('order');
  showToast(`🛒 ${wishlist.size} favorito(s) agregados al pedido!`);
  closeWishlistPanel();
  applyFilters();
}

// ════════════════════════════════════════════════════════════════════
// ─── MÓDULO ÉLITE 3: MOTOR DE VENTA CRUZADA (CROSS-SELLING) ──────────
// ════════════════════════════════════════════════════════════════════
function getCrossSellItems() {
  const cartIds = Object.keys(cart).map(Number);
  if (cartIds.length === 0) return [];
  
  // Obtener categorías en el carrito
  const cartCats = new Set(cartIds.map(id => MENU.find(i => i.id === id)?.cat).filter(Boolean));
  
  // Buscar productos de misma categoría no incluidos en el carrito
  const candidates = MENU.filter(item => {
    if (cart[item.id]) return false; // Ya en el carrito
    if (!cartCats.has(item.cat)) return false; // Distinta categoría
    return true;
  });
  
  // Priorizar por items más populares (heurística: IDs que terminan en dígito bajo)
  candidates.sort((a, b) => (a.id % 13) - (b.id % 13));
  
  // Devolver máximo 4 sugerencias
  return candidates.slice(0, 4);
}

function addCrossSell(id) {
  cart[id] = (cart[id] || 0) + 1;
  updateAll(id);
  spawnParticle(id);
  playSound('add');
  const item = MENU.find(i => i.id === id);
  showToast(`✨ ${item?.name} agregado desde Sugerencias`);
  renderCartPanel();
}

// ════════════════════════════════════════════════════════════════════
// ─── MÓDULO ÉLITE 4: HISTORIAL DE PEDIDOS ───────────────────────────
// ════════════════════════════════════════════════════════════════════
function saveOrderToHistory(orderId, clientName, total, deliveryMethod) {
  let history = [];
  const stored = safeStorage.getItem('capelli_order_history');
  if (stored) {
    try { history = JSON.parse(stored); } catch (e) { history = []; }
  }
  
  // Guardar snapshot del carrito actual
  const cartSnapshot = Object.entries(cart).map(([idStr, qty]) => {
    const item = MENU.find(i => i.id === parseInt(idStr));
    return item ? { id: item.id, name: item.name, qty, code: item.code } : null;
  }).filter(Boolean);
  
  history.unshift({
    orderId,
    clientName,
    total,
    deliveryMethod,
    date: new Date().toLocaleString('es-AR'),
    items: cartSnapshot
  });
  
  // Mantener solo los últimos 10 pedidos
  if (history.length > 10) history = history.slice(0, 10);
  safeStorage.setItem('capelli_order_history', JSON.stringify(history));
  updateHistoryBadge();
}

function updateHistoryBadge() {
  const stored = safeStorage.getItem('capelli_order_history');
  const history = stored ? JSON.parse(stored) : [];
  const badge = document.getElementById('historyBadge');
  if (badge) {
    badge.textContent = history.length;
    badge.style.display = history.length > 0 ? 'flex' : 'none';
  }
}

function openHistoryPanel() {
  const panel = document.getElementById('historyPanel');
  const overlay = document.getElementById('historyOverlay');
  if (panel) panel.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderHistoryPanel();
}

function closeHistoryPanel() {
  const panel = document.getElementById('historyPanel');
  const overlay = document.getElementById('historyOverlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function renderHistoryPanel() {
  const container = document.getElementById('historyContent');
  if (!container) return;
  
  const stored = safeStorage.getItem('capelli_order_history');
  const history = stored ? JSON.parse(stored) : [];
  
  if (history.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-emoji">📋</div>
        <div class="cart-empty-text">Todavía no tenés pedidos registrados.<br>Tu historial aparecerá aquí luego de tu primer compra.</div>
      </div>`;
    return;
  }
  
  let html = '';
  history.forEach(order => {
    const itemsPreview = order.items.slice(0, 3).map(i => `${i.qty}x ${i.name.substring(0,20)}`).join(', ');
    const moreCount = order.items.length - 3;
    html += `
      <div class="history-order-card">
        <div class="hoc-header">
          <div>
            <div class="hoc-id">${order.orderId}</div>
            <div class="hoc-date">${order.date}</div>
          </div>
          <div class="hoc-total">${formatPrice(order.total)}</div>
        </div>
        <div class="hoc-client">👤 ${order.clientName} · ${order.deliveryMethod === 'retiro' ? '🏢 Retiro' : '🚚 Envío'}</div>
        <div class="hoc-items">${itemsPreview}${moreCount > 0 ? ` y ${moreCount} más...` : ''}</div>
        <button class="hoc-reorder-btn" onclick="reorderFromHistory(${JSON.stringify(order.items).replace(/"/g, '&quot;')})">
          🔄 Repetir este pedido
        </button>
      </div>`;
  });
  
  container.innerHTML = html;
}

function reorderFromHistory(items) {
  if (!items || items.length === 0) return;
  items.forEach(orderItem => {
    cart[orderItem.id] = (cart[orderItem.id] || 0) + orderItem.qty;
  });
  updateCartBadge();
  playSound('order');
  showToast(`🔄 ${items.length} producto(s) cargados al carrito!`);
  closeHistoryPanel();
  applyFilters();
  openCart();
}

// ─── INICIALIZACIÓN ────────────────────────────────────────────────
function init() {
  initTheme(); // Inicializar el modo oscuro inteligente según preferencia u horario
  
  // Registrar Service Worker para soporte PWA y modo Offline completo
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('PWA Service Worker registrado con éxito:', reg.scope))
        .catch(err => console.warn('Fallo al registrar PWA Service Worker:', err));
    });
  }
  
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
  
  // Inicializar filtros en modo "Todos los productos y categorías"
  currentCat = 'todos';
  currentSubCat = 'todos';
  currentBrandCode = 'all';
  searchQuery = '';
  applyFilters();
  renderSubCategories();
  
  // Iniciar carrusel auto-rotativo del Hero Banner
  startHeroSlider();
  
  // Setup Scroll e Intersecciones
  setupInfiniteScroll();
  initScrollObserver();
  
  // Cargar datos guardados del cliente
  loadClientData();
  
  // Inicializar módulos élite
  loadWishlist();
  updateWishlistBadge();
  updateHistoryBadge();
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

// ─── 1. MODO OSCURO INTELIGENTE (MANUAL Y AUTOMÁTICO POR HORARIO) ───
function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.toggle('dark');
  const btn = document.getElementById('themeToggleBtn');
  
  if (btn) {
    btn.textContent = isDark ? '☀️' : '🌙';
  }
  
  safeStorage.setItem('capelli_theme', isDark ? 'dark' : 'light');
  showToast(isDark ? '🌙 Modo Oscuro Activado' : '☀️ Modo Claro Activado');
}

function initTheme() {
  let theme = safeStorage.getItem('capelli_theme');
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeVal = hour + minute / 60;
  
  // Activa automáticamente de 19:30hs a 07:00hs si no hay preferencia manual
  const isNight = timeVal >= 19.5 || timeVal < 7.0;
  const shouldBeDark = theme === 'dark' || (!theme && isNight);
  
  const body = document.body;
  const btn = document.getElementById('themeToggleBtn');
  
  if (shouldBeDark) {
    body.classList.add('dark');
    if (btn) btn.textContent = '☀️';
  } else {
    body.classList.remove('dark');
    if (btn) btn.textContent = '🌙';
  }
}

// ─── 2. BÚSQUEDA INTELIGENTE POR VOZ (SPEECH-TO-TEXT) ───
function startVoiceSearch(event) {
  if (event) event.stopPropagation();
  const voiceBtn = document.getElementById('voiceBtn');
  const searchInput = document.getElementById('searchInput');
  if (!voiceBtn || !searchInput) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('⚠️ Tu navegador no soporta búsqueda por voz. Probá con Chrome o Safari.');
    return;
  }

  if (voiceBtn.classList.contains('active')) return;

  const recognition = new SpeechRecognition();
  recognition.lang = 'es-AR'; // Español - Argentina
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    voiceBtn.classList.add('active');
    showToast('🎙️ Escuchando... Hablá ahora');
    searchInput.placeholder = 'Escuchando...';
  };

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    searchInput.value = transcript;
    searchQuery = transcript;
    applyFilters();
    showSuggestions(transcript);
  };

  recognition.onerror = (e) => {
    console.error('Speech error:', e.error);
    if (e.error === 'not-allowed') {
      showToast('⚠️ Permiso de micrófono denegado.');
    } else if (e.error === 'no-speech') {
      showToast('⚠️ No se detectó audio. Intentá de nuevo.');
    } else {
      showToast('⚠️ Error al escuchar: ' + e.error);
    }
    cleanup();
  };

  recognition.onend = () => {
    cleanup();
  };

  function cleanup() {
    voiceBtn.classList.remove('active');
    searchInput.placeholder = 'Buscá por producto, marca (ej: Wella, Idraet), código...';
  }

  try {
    recognition.start();
  } catch (err) {
    console.error('Error starting recognition:', err);
    cleanup();
  }
}

// ─── 3. SPOTLIGHT SUGGESTIONS (AUTOCOMPLETADO DINÁMICO EN BUSCA) ───
function showSuggestions(q) {
  const suggestionsBox = document.getElementById('searchSuggestions');
  if (!suggestionsBox) return;

  if (!q) {
    suggestionsBox.style.display = 'none';
    suggestionsBox.innerHTML = '';
    return;
  }

  const words = q.toLowerCase().split(/\s+/).filter(w => w.trim() !== '');
  if (words.length === 0) {
    suggestionsBox.style.display = 'none';
    suggestionsBox.innerHTML = '';
    return;
  }

  const matches = MENU.filter(p => {
    const pName = p.name.toLowerCase();
    const pCode = p.code.toLowerCase();
    const pBrand = p.brand.toLowerCase();
    return words.every(word => pName.includes(word) || pCode.includes(word) || pBrand.includes(word));
  }).slice(0, 5); // Mostrar hasta 5 sugerencias rápidas

  if (matches.length === 0) {
    suggestionsBox.style.display = 'none';
    suggestionsBox.innerHTML = '';
    return;
  }

  suggestionsBox.innerHTML = matches.map(item => {
    const activePrice = isProfessional ? item.price_prof : item.price;
    const displayName = highlightText(item.name, q);
    const displayBrand = highlightText(item.brand, q);
    return `
      <div class="suggestion-item" onclick="selectSuggestion(${item.id})">
        <span class="suggestion-emoji">${item.emoji || '🧪'}</span>
        <div class="suggestion-info">
          <span class="suggestion-brand">${displayBrand}</span>
          <span class="suggestion-name">${displayName}</span>
        </div>
        <span class="suggestion-price">${formatPrice(activePrice)}</span>
      </div>
    `;
  }).join('');
  suggestionsBox.style.display = 'block';
}

function selectSuggestion(id) {
  const suggestionsBox = document.getElementById('searchSuggestions');
  if (suggestionsBox) {
    suggestionsBox.style.display = 'none';
  }
  const input = document.getElementById('searchInput');
  if (input) {
    input.value = '';
    searchQuery = '';
  }
  applyFilters(); // Resetear filtros internos
  openProductModal(id); // Abrir directamente modal de detalle de producto
}

// Cerrar sugerencias al cliquear afuera
document.addEventListener('click', (e) => {
  const suggestionsBox = document.getElementById('searchSuggestions');
  const searchInput = document.getElementById('searchInput');
  if (suggestionsBox && searchInput && !suggestionsBox.contains(e.target) && e.target !== searchInput) {
    suggestionsBox.style.display = 'none';
  }
});

// ─── 4. QUICK TAG FILTERS (PASTILLAS DE FILTRADO RÁPIDO) ───
function filterMenuByTag(tag, event) {
  if (event) event.stopPropagation();
  
  const btn = event ? event.currentTarget : null;
  const isPillActive = btn && btn.classList.contains('active');

  // Resetear clases activas de todos los tags
  document.querySelectorAll('.tag-pill').forEach(pill => pill.classList.remove('active'));

  if (isPillActive) {
    // Desactivar tag
    activeTag = '';
    applyFilters();
  } else {
    // Activar tag y suspender temporalmente los filtros generales estándar
    activeTag = tag;
    if (btn) btn.classList.add('active');

    // Deseleccionar clases activas en categorías y marcas UI
    document.querySelectorAll('.cat-pill').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.brand-pill').forEach(b => b.classList.remove('active'));

    // Limpiar variables de filtros generales
    currentCat = 'todos';
    currentBrandCode = 'all';
    searchQuery = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    applyFilters();

    // Desplazar vista de forma fluida hacia el inicio de los productos
    const menuTitleEl = document.getElementById('menuTitle');
    if (menuTitleEl) {
      menuTitleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ─── 5. RECIBO DIGITAL INTERACTIVO (SIMULADOR DE TICKET DE COMPRA) ───
function openReceiptModal(orderId, name, tel, delivery, total) {
  const overlay = document.getElementById('receiptOverlay');
  const modal = document.getElementById('receiptModal');
  
  // Rellenar cabecera del recibo
  const recId = document.getElementById('recId');
  const recDate = document.getElementById('recDate');
  const recName = document.getElementById('recName');
  const recTel = document.getElementById('recTel');
  const recDelivery = document.getElementById('recDelivery');
  const recItems = document.getElementById('recItems');
  const recSubtotal = document.getElementById('recSubtotal');
  const recDiscount = document.getElementById('recDiscount');
  const recTotal = document.getElementById('recTotal');
  
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  if (recId) recId.textContent = orderId;
  if (recDate) recDate.textContent = dateStr;
  if (recName) recName.textContent = name || 'Cliente Invitado';
  if (recTel) recTel.textContent = tel || 'No provisto';
  if (recDelivery) recDelivery.textContent = delivery === 'envio' ? 'Envío a Domicilio' : 'Retiro en Sucursal';
  
  // Calcular descuentos profesionales reales
  let subtotal = 0;
  let itemsHTML = '';
  
  Object.entries(lastOrderCartCopy).forEach(([idStr, qty]) => {
    const item = MENU.find(i => i.id === parseInt(idStr));
    if (item) {
      // Precio público por defecto para subtotal base
      subtotal += item.price * qty;
      const activePrice = isProfessional ? item.price_prof : item.price;
      
      itemsHTML += `
        <div class="receipt-item-row">
          <div class="receipt-item-details">
            <span class="receipt-item-name">${item.name.substring(0, 22)}</span>
            <span class="receipt-item-sub">${qty}x ${formatPrice(activePrice)} (Cód: ${item.code})</span>
          </div>
          <span>${formatPrice(activePrice * qty)}</span>
        </div>
      `;
    }
  });
  
  if (recItems) recItems.innerHTML = itemsHTML;
  if (recSubtotal) recSubtotal.textContent = formatPrice(subtotal);
  
  // Calcular la diferencia si es que compró con descuento profesional
  const discountVal = subtotal - total;
  if (recDiscount) {
    recDiscount.textContent = discountVal > 0 ? `-${formatPrice(discountVal)}` : '$0';
  }
  
  if (recTotal) recTotal.textContent = formatPrice(total);
  
  // Mostrar modal recibo
  if (overlay && modal) {
    overlay.classList.add('open');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeReceiptModal() {
  const overlay = document.getElementById('receiptOverlay');
  const modal = document.getElementById('receiptModal');
  if (overlay && modal) {
    overlay.classList.remove('open');
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
  showToast('🛒 ¡Gracias por elegir Club Capelli!');
}

function downloadReceipt() {
  const id = document.getElementById('recId') ? document.getElementById('recId').textContent : 'CC-XXXX';
  const date = document.getElementById('recDate') ? document.getElementById('recDate').textContent : '';
  const name = document.getElementById('recName') ? document.getElementById('recName').textContent : '';
  const tel = document.getElementById('recTel') ? document.getElementById('recTel').textContent : '';
  const delivery = document.getElementById('recDelivery') ? document.getElementById('recDelivery').textContent : '';
  const subtotal = document.getElementById('recSubtotal') ? document.getElementById('recSubtotal').textContent : '$0';
  const discount = document.getElementById('recDiscount') ? document.getElementById('recDiscount').textContent : '$0';
  const total = document.getElementById('recTotal') ? document.getElementById('recTotal').textContent : '$0';
  
  let text = `========================================\n`;
  text += `            CLUB CAPELLI\n`;
  text += `     Sucursal Yerba Buena Premium\n`;
  text += `    Av. Aconquija y Lobo de la Vega\n`;
  text += `========================================\n\n`;
  text += `COMPROBANTE DE PEDIDO DIGITAL\n`;
  text += `----------------------------------------\n`;
  text += `TICKET NRO: ${id}\n`;
  text += `FECHA:      ${date}\n`;
  text += `CLIENTE:    ${name}\n`;
  text += `TEL:        ${tel}\n`;
  text += `ENTREGA:    ${delivery}\n`;
  text += `----------------------------------------\n`;
  text += `CANT  DETALLE                   SUBTOTAL\n`;
  text += `----------------------------------------\n`;
  
  Object.entries(lastOrderCartCopy).forEach(([idStr, qty]) => {
    const item = MENU.find(i => i.id === parseInt(idStr));
    if (item) {
      const activePrice = isProfessional ? item.price_prof : item.price;
      const sub = activePrice * qty;
      const namePad = item.name.substring(0, 24).padEnd(25, ' ');
      const qtyPad = String(qty).padEnd(5, ' ');
      text += `${qtyPad} ${namePad} $${sub.toLocaleString('es-AR')}\n`;
    }
  });
  
  text += `----------------------------------------\n`;
  text += `SUBTOTAL PRODUCTOS:      ${subtotal}\n`;
  text += `DESCUENTO PROFESIONAL:   ${discount}\n`;
  text += `TOTAL ESTIMADO:          ${total}\n`;
  text += `========================================\n`;
  text += `   * Sujeto a verificación de stock *\n`;
  text += `       *** GRACIAS POR SU COMPRA ***\n`;
  text += `========================================\n`;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `ticket-capelli-${id.replace('#', '')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📥 Descargando ticket.txt...');
}

// Iniciar aplicación al cargar con resguardo para estados ya cargados
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init);
} else {
  init();
}