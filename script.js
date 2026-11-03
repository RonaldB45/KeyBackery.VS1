// ===============================================================
// KEYBAKERY - Lógica de Tienda, Carrito, Pedidos & Firebase
// Repostería Artesanal Dominicana • Los Alcarrizos, Santo Domingo
// ===============================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// --- 1. CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  "projectId": "gen-lang-client-0108986058",
  "appId": "1:349673049471:web:488735f9f380a3768e5e4a",
  "apiKey": "AIzaSyBxOdpx2O-Ah5q0K2a0A6tCL9ti7QEvvcY",
  "authDomain": "gen-lang-client-0108986058.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-08320a8b-9e19-41a8-acc8-b7167db834af",
  "storageBucket": "gen-lang-client-0108986058.firebasestorage.app",
  "messagingSenderId": "349673049471",
  "measurementId": ""
};

let app = null;
let db = null;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (err) {
    console.warn("Aviso de inicialización Firebase:", err);
}

const WHATSAPP_NUMBER = "18094428442"; 
const TELEFERICO_FEE = 50;

// Calcular fecha amigable del próximo domingo de entrega
function getProximoDomingoTexto() {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0 es Domingo
    const diff = dia === 0 ? 0 : 7 - dia;
    const proximo = new Date(hoy);
    proximo.setDate(hoy.getDate() + diff);
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    const texto = proximo.toLocaleDateString('es-DO', opciones);
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// --- 2. CATÁLOGO ADAPTADO AL MODELO: PRODUCTO DE LA SEMANA + PASTELES COMPLETOS ---
const defaultProducts = [
    // --- CATEGORÍA 1: PRODUCTO DE LA SEMANA (BROWNIES - ENTREGA DOMINGO) ---
    {
        id: "prod-brownie-clasico",
        nombre: "Brownie Artesanal Melcochoso (Porción)",
        precio: 180,
        categoria: "semana",
        tipo: "semana",
        badge: "🔥 Producto de la Semana",
        descripcion: "Hecho con cacao puro dominicano, centro húmedo súper fudge, corteza brillante y chispas de chocolate. Entrega exclusiva este Domingo en Los Alcarrizos.",
        imagen: "/assets/images/brownie_clasico.jpg",
        stock: 40,
        activo: true
    },
    {
        id: "prod-caja-brownies",
        nombre: "Caja Degustación de 4 Brownies Gourmet",
        precio: 650,
        categoria: "semana",
        tipo: "semana",
        badge: "⭐ Caja Favorita de la Semana",
        descripcion: "Incluye 4 porciones surtidas: 1 clásico de chocolate puro, 1 con dulce de leche artesanal, 1 con Nutella y 1 con nueces tostadas. Entrega este Domingo.",
        imagen: "/assets/images/caja_brownies.jpg",
        stock: 25,
        activo: true
    },
    {
        id: "prod-brownie-jar",
        nombre: "Brownie Jar con Suspiro & Dulce de Leche",
        precio: 250,
        categoria: "semana",
        tipo: "semana",
        badge: "Edición Limitada Semanal",
        descripcion: "Vaso individual con capas de brownie melcochoso, manjar de dulce de leche criollo y suspiro dominicano flameado. Entrega este Domingo.",
        imagen: "/assets/images/brownie_jar.jpg",
        stock: 20,
        activo: true
    },

    // --- CATEGORÍA 2: PASTELES COMPLETOS (BAJO ENCARGO - DÍA A COORDINAR) ---
    {
        id: "prod-bizcocho-suspiro",
        nombre: "Bizcocho Dominicano de Suspiro (1 Libra Entera)",
        precio: 950,
        categoria: "pasteles-completos",
        tipo: "encargo",
        badge: "🎂 Pastel Entero (Bajo Encargo)",
        descripcion: "Pastel completo tradicional de masa esponjosa con relleno artesanal de piña o dulce de leche y suspiro alisado. Rinde 15-20 porciones. Coordinamos entrega cualquier día de la semana con 48h.",
        imagen: "/assets/images/bizcocho_suspiro.jpg",
        stock: 10,
        activo: true
    },
    {
        id: "prod-pastel-chocolate",
        nombre: "Pastel de Chocolate Intenso (Pastel Entero 1.5 Lb)",
        precio: 1800,
        categoria: "pasteles-completos",
        tipo: "encargo",
        badge: "🎂 Pastel Entero (Bajo Encargo)",
        descripcion: "Tres capas de bizcocho húmedo de cacao dominicano, ganache brillante y trufas artesanales. Rinde 20 porciones. Se elabora bajo encargo con 48h de anticipación.",
        imagen: "/assets/images/pastel_chocolate.jpg",
        stock: 10,
        activo: true
    },
    {
        id: "prod-cheesecake-guayaba",
        nombre: "Cheesecake de Guayaba Real (Molde Entero)",
        precio: 1100,
        categoria: "pasteles-completos",
        tipo: "encargo",
        badge: "🎂 Pastel Entero (Bajo Encargo)",
        descripcion: "Tarta horneada entera sobre base crujiente con abundante mermelada espesa de guayaba dulce del país. Rinde 12-14 porciones. Entrega programada con 48h.",
        imagen: "/assets/images/cheesecake_guayaba.jpg",
        stock: 10,
        activo: true
    },
    {
        id: "prod-pastel-bodas",
        nombre: "Pastel de Bodas & Cumpleaños (2-3 Pisos)",
        precio: 2500,
        categoria: "pasteles-completos",
        tipo: "encargo",
        badge: "Celebraciones Especiales",
        descripcion: "Diseño elegante con suspiro tradicional alisado a mano y flores comestibles. Rinde de 25 a 35 porciones. Se agenda con un mínimo de 72h para coordinar día y detalles.",
        imagen: "/assets/images/pastel_bodas.jpg",
        stock: 5,
        activo: true
    },

    // --- CATEGORÍA 3: BOCADILLOS & EVENTOS AL MAYOR (MÍNIMO 12-25 UDS) ---
    {
        id: "prod-bocadillos-queso",
        nombre: "Bandeja de Bocadillos de Queso Criollo (24 uds)",
        precio: 360,
        categoria: "bocadillos-eventos",
        tipo: "encargo",
        badge: "Bandeja para Eventos",
        descripcion: "Tequeños rellenos de queso criollo fundente horneados frescos para tus reuniones o fiestas familiares. Mínimo 24 uds. Se coordina el día que necesites con 48h.",
        imagen: "/assets/images/bocadillos_queso.jpg",
        stock: 50,
        activo: true
    },
    {
        id: "prod-catibias-gourmet",
        nombre: "Bandeja de Catibías de Yuca Gourmet (25 uds)",
        precio: 950,
        categoria: "bocadillos-eventos",
        tipo: "encargo",
        badge: "Bandeja para Eventos",
        descripcion: "Mini empanadas crocantes de harina de yuca rellenas de res sazonada al estilo criollo. Perfectas para compartir en eventos. Entrega coordinada con 48h.",
        imagen: "/assets/images/catibias_gourmet.jpg",
        stock: 30,
        activo: true
    },
    {
        id: "prod-croissants-mantequilla",
        nombre: "Bandeja de Croissants de Mantequilla (12 uds)",
        precio: 700,
        categoria: "bocadillos-eventos",
        tipo: "encargo",
        badge: "Bandeja para Eventos",
        descripcion: "Hojaldre crujiente laminado con mantequilla pura en tamaño fiesta. Ideales para mesas de bocadillos y desayunos. Entrega programada con 48h.",
        imagen: "/assets/images/bocadillos_queso.jpg",
        stock: 20,
        activo: true
    },
    {
        id: "prod-mini-quiches",
        nombre: "Bandeja de Mini Quiches Variados (16 uds)",
        precio: 640,
        categoria: "bocadillos-eventos",
        tipo: "encargo",
        badge: "Bandeja para Eventos",
        descripcion: "Tartaletas saladas rellenas de queso gouda, jamón y espinacas con toque de nuez moscada. Mínimo 16 unidades. Entrega programada con 48h.",
        imagen: "/assets/images/bocadillos_queso.jpg",
        stock: 20,
        activo: true
    },

    // --- CATEGORÍA 4: PRÓXIMAS SEMANAS (INFORMATIVO) ---
    {
        id: "prod-preview-chinola",
        nombre: "Mousse de Chinola Silvestre en Vasitos",
        precio: 350,
        categoria: "proximas-semanas",
        tipo: "proxima",
        badge: "🗓️ Próxima Semana 2",
        descripcion: "Postre cremoso de maracuyá criolla. Porciones individuales solo disponibles durante su semana temática. ¡Si deseas el pastel completo puedes pedirlo bajo encargo!",
        imagen: "/assets/images/preview_chinola.jpg",
        stock: 0,
        activo: true
    },
    {
        id: "prod-preview-cupcakes",
        nombre: "Cupcakes Red Velvet & Zanahoria (Caja 6)",
        precio: 450,
        categoria: "proximas-semanas",
        tipo: "proxima",
        badge: "🗓️ Próxima Semana 3",
        descripcion: "Masa terciopelo rojo aterciopelada con frosting de cream cheese. Porciones disponibles en su semana temática. Para eventos puedes pedir la bandeja al mayor.",
        imagen: "/assets/images/preview_cupcakes.jpg",
        stock: 0,
        activo: true
    },
    {
        id: "prod-preview-pudin",
        nombre: "Pudin de Pan Tradicional Dominicano",
        precio: 500,
        categoria: "proximas-semanas",
        tipo: "proxima",
        badge: "🗓️ Próxima Semana 4",
        descripcion: "Clásico pudin dominicano aromatizado con canela, pasas y caramelo rubio. Espéralo en su semana temática de entrega dominical.",
        imagen: "/assets/images/preview_pudin.jpg",
        stock: 0,
        activo: true
    }
];

let listaProductos = [...defaultProducts];
let hasDynamicFirestoreData = false;
let carrito = JSON.parse(localStorage.getItem('keybakery_cart')) || [];
let activeCategory = 'todos';
let productQuantities = {};
let ultimoPedido = null;
let lastFocusedElement = null;

// --- 3. REFERENCIAS AL DOM ---
let DOM = window.DOM || {};
window.DOM = DOM;

function inicializarDOM() {
    DOM = {
        productsContainer: document.getElementById('products-container'),
        categoryTabs: document.querySelectorAll('.category-tab'),
        cartSidebar: document.getElementById('cart-sidebar'),
        openCartBtn: document.getElementById('open-cart'),
        mobileOpenCartBtn: document.getElementById('mobile-open-cart'),
        closeCartBtn: document.getElementById('close-cart'),
        cartItemsContainer: document.getElementById('cart-items'),
        cartTotalSpan: document.getElementById('cart-total'),
        cartCountSpan: document.getElementById('cart-count'),
        mobileCartCount: document.querySelector('.mobile-cart-count'),
        checkoutBtn: document.getElementById('checkout-btn'),
        paymentModal: document.getElementById('payment-modal'),
        closePaymentBtn: document.getElementById('close-payment'),
        stepUpsell: document.getElementById('step-upsell'),
        stepPayment: document.getElementById('step-payment'),
        successMessage: document.getElementById('success-message'),
        upsellContainer: document.getElementById('upsell-products'),
        goToPaymentBtn: document.getElementById('go-to-payment'),
        paymentForm: document.getElementById('payment-form'),
        modalTotal: document.getElementById('modal-total'),
        deliveryMethods: document.getElementsByName('delivery-method'),
        telefericoSelectorBox: document.getElementById('teleferico-station-box'),
        telefericoStationSelect: document.getElementById('teleferico-station'),
        customerAddress: document.getElementById('customer-address'),
        customerAddressLabel: document.getElementById('label-customer-address'),
        deliveryWarning: document.getElementById('delivery-warning'),
        encargoDateBox: document.getElementById('encargo-date-box'),
        encargoDateInput: document.getElementById('encargo-date'),
        downloadInvoiceBtn: document.getElementById('download-invoice'),
        closeSuccessBtn: document.getElementById('close-success'),
        contactForm: document.getElementById('contact-form'),
        contactPhone: document.getElementById('contact-phone'),
        customerPhone: document.getElementById('customer-phone'),
        toastNotification: document.getElementById('toast-notification'),
        toastMessage: document.getElementById('toast-message'),
        scrollTopBtn: document.getElementById('scroll-top'),
        mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
        mobileDrawer: document.getElementById('mobile-drawer'),
        mobileDrawerOverlay: document.getElementById('mobile-drawer-overlay'),
        closeDrawerBtn: document.getElementById('close-drawer'),
        drawerLinks: document.querySelectorAll('.drawer-link'),
        faqItems: document.querySelectorAll('.faq-item'),
        proximoDomingoSpans: document.querySelectorAll('.proximo-domingo-fecha'),
        // Referencias del Chatbot de la Repostera Animada
        reposteraChatContainer: document.getElementById('repostera-chat-container'),
        reposteraSpeechBubble: document.getElementById('repostera-speech-bubble'),
        reposteraSpeechClose: document.getElementById('repostera-speech-close'),
        reposteraSpeechTrigger: document.getElementById('repostera-speech-trigger'),
        reposteraFloatBtn: document.getElementById('repostera-float-btn'),
        reposteraChatWindow: document.getElementById('repostera-chat-window'),
        reposteraCloseBtn: document.getElementById('repostera-close-btn'),
        reposteraResetBtn: document.getElementById('repostera-reset-btn'),
        reposteraChatMessages: document.getElementById('repostera-chat-messages'),
        reposteraQuickChips: document.getElementById('repostera-quick-chips'),
        reposteraChatForm: document.getElementById('repostera-chat-form'),
        reposteraChatInput: document.getElementById('repostera-chat-input'),
        reposteraUnreadPill: document.getElementById('repostera-unread-pill')
    };
    window.DOM = DOM;
}

window.openCart = function() {
    if (DOM.cartSidebar) {
        DOM.cartSidebar.classList.add('open');
        DOM.cartSidebar.setAttribute('aria-hidden', 'false');
        if (DOM.closeCartBtn) DOM.closeCartBtn.focus();
    }
};

window.closeCart = function() {
    if (DOM.cartSidebar) {
        DOM.cartSidebar.classList.remove('open');
        DOM.cartSidebar.setAttribute('aria-hidden', 'true');
        if (DOM.openCartBtn) DOM.openCartBtn.focus();
    }
};

window.toggleCart = function() {
    if (!DOM.cartSidebar) return;
    if (DOM.cartSidebar.classList.contains('open')) {
        window.closeCart();
    } else {
        window.openCart();
    }
};

// --- 4. TOAST NOTIFICATION ---
let toastTimer = null;
function showToast(message) {
    if (!DOM.toastNotification || !DOM.toastMessage) return;
    DOM.toastMessage.textContent = message;
    DOM.toastNotification.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        DOM.toastNotification.classList.remove('show');
    }, 3200);
}

// --- 5. RENDERIZADO DEL MENÚ Y FILTROS ACCESIBLES ---
function getProductQuantity(id) {
    return productQuantities[id] || 1;
}

window.cardQtyChange = function(id, delta) {
    const current = getProductQuantity(id);
    const newQty = Math.max(1, Math.min(99, current + delta));
    productQuantities[id] = newQty;
    const numEl = document.getElementById(`qty-num-${id}`);
    if (numEl) numEl.textContent = newQty;
};
window.__realCardQtyChange = window.cardQtyChange;

// Guard anti-rebote para evitar duplicación de productos al agregar al carrito
let _lastAddToCartTime = 0;
let _lastAddToCartId = '';

window.cardAddToCart = function(id, btnElement) {
    const now = Date.now();
    if (_lastAddToCartId === id && (now - _lastAddToCartTime) < 400) {
        return; // Prevenir doble disparo si se clickea rápidamente o por eventos concurrentes
    }
    _lastAddToCartTime = now;
    _lastAddToCartId = id;

    // 1. Buscar en listaProductos, luego en defaultProducts, luego fallback específico
    let prod = listaProductos.find(p => p.id === id) || defaultProducts.find(p => p.id === id);
    if (!prod) {
        if (id === 'prod-brownie-clasico') {
            prod = {
                id: "prod-brownie-clasico",
                nombre: "Brownie Artesanal Melcochoso (Porción)",
                precio: 180,
                categoria: "semana",
                tipo: "semana",
                badge: "🔥 Producto de la Semana",
                descripcion: "Hecho con cacao puro dominicano, centro húmedo súper fudge, corteza brillante y chispas de chocolate. Entrega exclusiva este Domingo en Los Alcarrizos.",
                imagen: "/assets/images/brownie_clasico.jpg",
                stock: 40,
                activo: true
            };
        } else if (id === 'prod-caja-brownies') {
            prod = {
                id: "prod-caja-brownies",
                nombre: "Caja Degustación de 4 Brownies Gourmet",
                precio: 650,
                categoria: "semana",
                tipo: "semana",
                badge: "⭐ Caja Favorita de la Semana",
                descripcion: "Incluye 4 porciones surtidas: 1 clásico de chocolate puro, 1 con dulce de leche artesanal, 1 con Nutella y 1 con nueces tostadas. Entrega este Domingo.",
                imagen: "/assets/images/caja_brownies.jpg",
                stock: 25,
                activo: true
            };
        }
    }

    if (!prod) {
        console.warn("Producto no encontrado:", id);
        return;
    }

    if (prod.tipo === 'proxima') {
        showToast("Este postre estará disponible en su semana temática o puedes encargar el pastel completo.");
        return;
    }

    const qty = getProductQuantity(id);
    const existe = carrito.find(i => i.id === id);
    if (existe) {
        existe.cantidad += qty;
    } else {
        carrito.push({ ...prod, cantidad: qty });
    }

    // Reset cantidad temporal del stepper
    productQuantities[id] = 1;
    const numEl = document.getElementById(`qty-num-${id}`);
    if (numEl) numEl.textContent = '1';

    actualizarCarrito();

    // Feedback visual en el botón
    if (btnElement) {
        const originalContent = btnElement.innerHTML;
        btnElement.classList.add('added');
        btnElement.innerHTML = `<i data-lucide="check" aria-hidden="true"></i> <span>¡Agregado!</span>`;
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
            btnElement.classList.remove('added');
            btnElement.innerHTML = originalContent;
            if (window.lucide) lucide.createIcons();
        }, 1500);
    }

    showToast(`¡Agregado ${qty}x ${prod.nombre} al carrito!`);

    // ABRIR EL CARRITO AUTOMÁTICAMENTE para confirmar la acción inmediatamente
    if (DOM.cartSidebar) {
        DOM.cartSidebar.classList.add('open');
        DOM.cartSidebar.setAttribute('aria-hidden', 'false');
    }
};

window.__realCardAddToCart = window.cardAddToCart;

// Procesar clics que hayan ocurrido antes de que el script terminara de cargar
if (window._pendingCartAdds && window._pendingCartAdds.length > 0) {
    const pendings = [...window._pendingCartAdds];
    window._pendingCartAdds = [];
    pendings.forEach(p => window.cardAddToCart(p.id, p.btn));
}

function renderizarMenu() {
    if (!DOM.productsContainer) return;

    // Si ya existen tarjetas pre-renderizadas en HTML y no hay datos remotos alterados:
    const existingCards = DOM.productsContainer.querySelectorAll('.product-card');
    if (existingCards.length > 0 && !hasDynamicFirestoreData) {
        let visibleCount = 0;
        existingCards.forEach(card => {
            const cardCat = card.dataset.category;
            const matches = (activeCategory === 'todos' || cardCat === activeCategory);
            card.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });

        let emptyMsg = document.getElementById('menu-empty-message');
        if (visibleCount === 0) {
            if (!emptyMsg) {
                emptyMsg = document.createElement('div');
                emptyMsg.id = 'menu-empty-message';
                emptyMsg.style.gridColumn = '1 / -1';
                emptyMsg.style.textAlign = 'center';
                emptyMsg.style.padding = '4rem 1rem';
                emptyMsg.innerHTML = `<p class="text-muted" style="font-size: 1.1rem;">No se encontraron productos en esta categoría.</p>`;
                DOM.productsContainer.appendChild(emptyMsg);
            } else {
                emptyMsg.style.display = 'block';
            }
        } else if (emptyMsg) {
            emptyMsg.style.display = 'none';
        }
        return;
    }

    // Si viene de Firestore con datos actualizados:
    let filtrados = listaProductos.filter(p => p.activo !== false);
    if (activeCategory !== 'todos') {
        filtrados = filtrados.filter(p => p.categoria === activeCategory);
    }

    if (filtrados.length === 0) {
        DOM.productsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
                <p class="text-muted" style="font-size: 1.1rem;">No se encontraron productos en esta categoría.</p>
            </div>`;
        return;
    }

    DOM.productsContainer.innerHTML = filtrados.map(p => {
        const qty = getProductQuantity(p.id);
        const badgeHtml = p.badge ? `<span class="product-badge">${p.badge}</span>` : '';
        const descHtml = p.descripcion || 'Elaborado artesanalmente en Los Alcarrizos.';
        const isUpcoming = p.tipo === 'proxima';

        return `
            <article class="product-card" id="card-${p.id}" data-category="${p.categoria}">
                <div class="product-image-wrapper">
                    ${badgeHtml}
                    <img 
                        src="${p.imagen}" 
                        alt="${p.nombre}" 
                        width="400" 
                        height="260" 
                        loading="lazy" 
                        decoding="async"
                        onerror="this.onerror=null; this.src='/assets/images/brownie_clasico.jpg';"
                    >
                </div>
                <div class="product-info">
                    <div>
                        <h3>${p.nombre}</h3>
                        <p class="product-desc">${descHtml}</p>
                    </div>

                    <div class="product-meta">
                        <div class="product-price-row">
                            <span class="price-tag">${isUpcoming ? 'Próximamente' : `DOP$ ${p.precio.toLocaleString()}`}</span>
                            ${!isUpcoming ? `
                            <div class="card-qty-stepper" aria-label="Selector de cantidad para ${p.nombre}">
                                <button class="card-qty-btn" onclick="cardQtyChange('${p.id}', -1)" aria-label="Disminuir cantidad de ${p.nombre}">-</button>
                                <span class="card-qty-num" id="qty-num-${p.id}" aria-live="polite">${qty}</span>
                                <button class="card-qty-btn" onclick="cardQtyChange('${p.id}', 1)" aria-label="Aumentar cantidad de ${p.nombre}">+</button>
                            </div>
                            ` : `
                            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">Semana Temática</span>
                            `}
                        </div>
                        ${!isUpcoming ? `
                        <button class="btn-card-add" onclick="cardAddToCart('${p.id}', this)" aria-label="Agregar ${p.nombre} al Carrito">
                            <i data-lucide="shopping-basket" style="width: 18px; height: 18px;" aria-hidden="true"></i> Agregar al Carrito
                        </button>
                        ` : `
                        <a href="https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20KeyBakery,%20quisiera%20saber%20cuándo%20toca%20la%20semana%20de%20${encodeURIComponent(p.nombre)}%20o%20encargarlo%20completo" target="_blank" rel="noopener noreferrer" class="btn-secondary w-full text-center" style="padding: 0.65rem;" aria-label="Consultar fecha o encargar pastel completo de ${p.nombre}">
                            <i data-lucide="calendar" style="width: 16px; height: 16px;" aria-hidden="true"></i> Consultar Fecha
                        </a>
                        `}
                    </div>
                </div>
            </article>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// --- 6. LÓGICA DEL CARRITO ACCESIBLE & PERSISTENCIA ---
window.cambiarCant = function(id, delta) {
    const item = carrito.find(i => i.id === id);
    if (item) {
        item.cantidad += delta;
        if (item.cantidad <= 0) {
            carrito = carrito.filter(i => i.id !== id);
        }
    }
    actualizarCarrito();
};

function actualizarCarrito() {
    if (!DOM.cartItemsContainer) return;
    DOM.cartItemsContainer.innerHTML = '';
    let total = 0;
    let itemsContador = 0;

    let hasWeeklyItem = false;
    let hasCustomCake = false;

    if (carrito.length === 0) {
        DOM.cartItemsContainer.innerHTML = `
            <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                <i data-lucide="shopping-basket" style="width: 56px; height: 56px; opacity: 0.3; margin: 0 auto 1rem;" aria-hidden="true"></i>
                <h4 style="margin-bottom: 0.5rem; color: var(--text-dark);">Tu carrito está vacío</h4>
                <p class="text-sm mb-4">Elige tu porción del Producto de la Semana (Brownies) o tu pastel completo.</p>
                <a href="#menu" class="btn-secondary" onclick="window.closeCart();">Ver Menú</a>
            </div>`;
    } else {
        carrito.forEach(item => {
            total += item.precio * item.cantidad;
            itemsContador += item.cantidad;
            if (item.categoria === 'semana') hasWeeklyItem = true;
            if (item.categoria === 'pasteles-completos' || item.categoria === 'bocadillos-eventos') hasCustomCake = true;

            const badgeNota = item.categoria === 'semana' ? '📦 Entrega este Domingo' : '🎂 Coordinar Día (48h mín)';

            DOM.cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <img src="${item.imagen}" class="cart-item-img" alt="${item.nombre}" width="70" height="70" loading="lazy" referrerpolicy="no-referrer">
                    <div class="cart-item-info">
                        <p class="cart-item-title">${item.nombre}</p>
                        <p class="text-xs color-gold font-bold">${badgeNota}</p>
                        <p class="cart-item-price">DOP$ ${item.precio.toLocaleString()}</p>
                        <div class="cart-item-controls" aria-label="Controles de cantidad para ${item.nombre}">
                            <button class="btn-qty" onclick="cambiarCant('${item.id}', -1)" aria-label="Restar una unidad de ${item.nombre}">-</button>
                            <span class="cart-item-qty" aria-live="polite">${item.cantidad}</span>
                            <button class="btn-qty" onclick="cambiarCant('${item.id}', 1)" aria-label="Sumar una unidad de ${item.nombre}">+</button>
                        </div>
                    </div>
                </div>`;
        });

        // Banner informativo dentro del carrito sobre días de entrega
        let avisoEntrega = '';
        if (hasWeeklyItem && !hasCustomCake) {
            avisoEntrega = `<div style="background: var(--pink-subtle); padding: 0.7rem; border-radius: 8px; font-size: 0.8rem; color: var(--pink-hover); margin-bottom: 1rem; border: 1px solid rgba(216,27,96,0.2);">
                📅 <strong>Producto de la Semana:</strong> Tu orden se horneará y entregará este <strong>${getProximoDomingoTexto()}</strong> en Los Alcarrizos.
            </div>`;
        } else if (hasCustomCake && !hasWeeklyItem) {
            avisoEntrega = `<div style="background: var(--gold-subtle); padding: 0.7rem; border-radius: 8px; font-size: 0.8rem; color: var(--gold); margin-bottom: 1rem; border: 1px solid rgba(125,85,21,0.2);">
                🎂 <strong>Pastel Completo / Evento:</strong> Coordinaremos el día que lo necesites con mínimo 48h de anticipación.
            </div>`;
        } else if (hasWeeklyItem && hasCustomCake) {
            avisoEntrega = `<div style="background: var(--cream-dark); padding: 0.7rem; border-radius: 8px; font-size: 0.8rem; color: var(--text-dark); margin-bottom: 1rem; border: 1px solid var(--border-color);">
                📦 Tu carrito combina porciones de la semana (entrega domingo) y pastel completo bajo encargo.
            </div>`;
        }
        DOM.cartItemsContainer.insertAdjacentHTML('afterbegin', avisoEntrega);
    }

    if (DOM.cartTotalSpan) DOM.cartTotalSpan.innerText = `DOP$ ${total.toLocaleString()}`;
    if (DOM.cartCountSpan) {
        DOM.cartCountSpan.innerText = itemsContador;
        DOM.cartCountSpan.classList.remove('bounce');
        void DOM.cartCountSpan.offsetWidth;
        DOM.cartCountSpan.classList.add('bounce');
    }
    if (DOM.mobileCartCount) DOM.mobileCartCount.innerText = itemsContador;

    localStorage.setItem('keybakery_cart', JSON.stringify(carrito));
    if (window.lucide) lucide.createIcons();
}
window.actualizarCarrito = actualizarCarrito;

// --- 7. UPSELLING & PROCESO DE PAGO ACCESIBLE ---
window.agregarSugerencia = function(prodId) {
    const p = listaProductos.find(item => item.id === prodId) || defaultProducts.find(item => item.id === prodId);
    if (!p) return;
    const itemEnCarrito = carrito.find(item => item.id === prodId);
    if (itemEnCarrito) {
        itemEnCarrito.cantidad += 1;
    } else {
        carrito.push({ ...p, cantidad: 1 });
    }
    actualizarCarrito();
    window.cargarSugerencias();
    showToast(`¡${p.nombre} agregado al pedido!`);
};

window.cargarSugerencias = function() {
    if (!DOM.upsellContainer) return;
    DOM.upsellContainer.innerHTML = '';
    
    // Sugerir brownies adicionales u opción de pastel
    const sugeridos = listaProductos
        .filter(p => p.activo !== false && p.tipo !== 'proxima' && !carrito.find(item => item.id === p.id))
        .slice(0, 2);

    sugeridos.forEach(p => {
        DOM.upsellContainer.innerHTML += `
            <div class="cart-item" style="border: 1.5px dashed var(--gold-light);">
                <img src="${p.imagen}" class="cart-item-img" alt="${p.nombre}" width="70" height="70" loading="lazy" referrerpolicy="no-referrer">
                <div style="flex-grow: 1;">
                    <p class="font-bold" style="font-size: 0.95rem; margin-bottom: 0.2rem;">${p.nombre}</p>
                    <p class="text-sm color-gold font-bold mb-2">DOP$ ${p.precio.toLocaleString()}</p>
                    <button type="button" class="btn-secondary" style="padding: 0.4rem 1rem; font-size: 0.8rem;" aria-label="Añadir ${p.nombre} al pedido" onclick="window.agregarSugerencia('${p.id}')">
                        + Añadir al Pedido
                    </button>
                </div>
            </div>`;
    });
};

function abrirModalPago() {
    if (carrito.length === 0) {
        showToast("Tu carrito está vacío. Elige tus postres primero.");
        return;
    }

    lastFocusedElement = document.activeElement;

    const total = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    if (DOM.modalTotal) DOM.modalTotal.textContent = `DOP$ ${total.toLocaleString()}`;

    DOM.stepUpsell.classList.remove('hidden');
    DOM.stepPayment.classList.add('hidden');
    DOM.successMessage.classList.add('hidden');
    cargarSugerencias();

    DOM.paymentModal.style.display = 'flex';
    DOM.paymentModal.setAttribute('aria-hidden', 'false');
    if (DOM.cartSidebar) {
        DOM.cartSidebar.classList.remove('open');
        DOM.cartSidebar.setAttribute('aria-hidden', 'true');
    }

    setTimeout(() => {
        if (DOM.closePaymentBtn) DOM.closePaymentBtn.focus();
    }, 50);
}

function cerrarModalPago() {
    if (!DOM.paymentModal) return;
    DOM.paymentModal.style.display = 'none';
    DOM.paymentModal.setAttribute('aria-hidden', 'true');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
}
window.abrirModalPago = abrirModalPago;
window.cerrarModalPago = cerrarModalPago;

// --- 8. ENVÍO DEL PEDIDO A WHATSAPP Y FIRESTORE ---
async function procesarPedido(e) {
    e.preventDefault();

    const nombreCliente = document.getElementById('card-name').value.trim();
    const telefonoCliente = document.getElementById('customer-phone').value.trim();
    const metodoEntregaInput = document.querySelector('input[name="delivery-method"]:checked');
    const metodo = metodoEntregaInput ? metodoEntregaInput.value : 'pickup';
    const estacionTeleferico = DOM.telefericoStationSelect ? DOM.telefericoStationSelect.value : '';
    const direccion = document.getElementById('customer-address').value.trim();
    const fechaEncargo = DOM.encargoDateInput ? DOM.encargoDateInput.value.trim() : '';

    if (!nombreCliente) {
        showToast("Por favor ingresa tu nombre completo.");
        document.getElementById('card-name')?.focus();
        return;
    }

    if (!telefonoCliente) {
        showToast("Por favor ingresa tu teléfono WhatsApp de Los Alcarrizos / RD.");
        document.getElementById('customer-phone')?.focus();
        return;
    }

    const subtotal = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    let costoEnvio = 0;
    let metodoTexto = "Recoger en Taller (Los Alcarrizos) - Domingo";
    let detalleUbicacion = "";

    if (metodo === 'teleferico') {
        costoEnvio = TELEFERICO_FEE;
        metodoTexto = `Parada Teleférico Los Alcarrizos: ${estacionTeleferico} (DOP$ ${TELEFERICO_FEE})`;
        detalleUbicacion = `Estación: ${estacionTeleferico}`;
    } else if (metodo === 'delivery') {
        metodoTexto = "Envío a Domicilio en Los Alcarrizos (Domingo)";
        detalleUbicacion = direccion || "Sector a coordinar en Los Alcarrizos";
    } else if (metodo === 'encargo') {
        metodoTexto = "Encargo Especial: Pastel Completo / Evento (Día flexible)";
        detalleUbicacion = fechaEncargo ? `Fecha solicitada: ${fechaEncargo}` : "Día a coordinar con 48h";
    }

    const totalFinal = subtotal + costoEnvio;
    const proximoDomingoStr = getProximoDomingoTexto();

    ultimoPedido = {
        cliente: nombreCliente,
        telefono: telefonoCliente,
        items: carrito.map(i => ({ id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, categoria: i.categoria })),
        subtotal,
        costoEnvio,
        total: totalFinal,
        metodoTexto,
        detalleUbicacion,
        proximoDomingo: proximoDomingoStr,
        fechaOrden: new Date().toLocaleString('es-DO')
    };

    // 1. Guardar en Firestore
    if (db) {
        try {
            await addDoc(collection(db, "orders"), {
                cliente: nombreCliente,
                telefono: telefonoCliente,
                items: ultimoPedido.items,
                total: totalFinal,
                metodoEntrega: metodoTexto,
                ubicacionDetalle: detalleUbicacion,
                proximoDomingo: proximoDomingoStr,
                fecha: serverTimestamp(),
                status: "pending",
                ciudad: "Los Alcarrizos"
            });
        } catch (err) {
            console.warn("Firestore notice (continuando hacia WhatsApp):", err);
        }
    }

    // 2. Construir Mensaje de WhatsApp
    let mensaje = `🎂 *NUEVO PEDIDO - KEYBAKERY (LOS ALCARRIZOS)* 🎂\n\n`;
    mensaje += `👤 *Cliente:* ${nombreCliente}\n`;
    mensaje += `📱 *Teléfono:* ${telefonoCliente}\n`;
    mensaje += `📍 *Método de Entrega:* ${metodoTexto}\n`;
    if (detalleUbicacion) mensaje += `📌 *Detalle / Ubicación:* ${detalleUbicacion}\n`;
    mensaje += `🗓️ *Fecha Estimada:* ${metodo === 'encargo' ? (fechaEncargo || 'A coordinar') : proximoDomingoStr}\n`;
    mensaje += `\n🛒 *DETALLE DEL PEDIDO:*\n`;

    ultimoPedido.items.forEach(i => {
        mensaje += `• ${i.cantidad}x ${i.nombre} - DOP$ ${(i.precio * i.cantidad).toLocaleString()}\n`;
    });

    mensaje += `\n💵 *Subtotal:* DOP$ ${subtotal.toLocaleString()}`;
    if (costoEnvio > 0) mensaje += `\n📦 *Punto de Encuentro:* DOP$ ${costoEnvio.toLocaleString()}`;
    mensaje += `\n💰 *TOTAL FINAL:* DOP$ ${totalFinal.toLocaleString()}\n\n`;
    mensaje += `🍰 _KeyBakery Los Alcarrizos • Pedidos semanales horneados por lotes._`;

    const encoded = encodeURIComponent(mensaje);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');

    // Limpiar carrito y mostrar confirmación
    carrito = [];
    actualizarCarrito();

    DOM.stepPayment.classList.add('hidden');
    DOM.successMessage.classList.remove('hidden');

    setTimeout(() => {
        if (DOM.closeSuccessBtn) DOM.closeSuccessBtn.focus();
    }, 50);
}

// --- 9. FACTURA DESCARGABLE ---
function descargarFactura() {
    if (!ultimoPedido) return;

    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return;

    const itemsHtml = ultimoPedido.items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.nombre}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">DOP$ ${item.precio.toLocaleString()}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">DOP$ ${(item.precio * item.cantidad).toLocaleString()}</td>
        </tr>
    `).join('');

    invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es-DO">
        <head>
            <meta charset="UTF-8">
            <title>Resumen de Orden - KeyBakery Los Alcarrizos</title>
            <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1F1916; padding: 40px; margin: 0; }
                .invoice-box { max-width: 650px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 12px; }
                .header { text-align: center; border-bottom: 2px solid #D81B60; padding-bottom: 20px; margin-bottom: 25px; }
                .header h1 { margin: 0; color: #D81B60; font-size: 28px; letter-spacing: 1px; }
                .meta { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; }
                th { background: #FFF9F5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
                .totals { text-align: right; font-size: 15px; }
                .grand-total { font-size: 20px; font-weight: bold; color: #7D5515; margin-top: 8px; }
                .footer { text-align: center; margin-top: 35px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="invoice-box">
                <div class="header">
                    <h1>KEYBAKERY</h1>
                    <p style="margin: 4px 0 0; color: #666; font-size: 13px;">Repostería Artesanal Dominicana • Los Alcarrizos, Santo Domingo Oeste</p>
                </div>
                <div class="meta">
                    <div>
                        <strong>Cliente:</strong> ${ultimoPedido.cliente}<br>
                        <strong>Teléfono:</strong> ${ultimoPedido.telefono}<br>
                        <strong>Fecha de Orden:</strong> ${ultimoPedido.fechaOrden}
                    </div>
                    <div style="text-align: right;">
                        <strong>Entrega:</strong> ${ultimoPedido.metodoTexto}<br>
                        ${ultimoPedido.detalleUbicacion ? `<strong>Punto:</strong> ${ultimoPedido.detalleUbicacion}<br>` : ''}
                        <strong>Fecha Programada:</strong> ${ultimoPedido.proximoDomingo}
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th style="text-align: center;">Cant.</th>
                            <th style="text-align: right;">Precio</th>
                            <th style="text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <div class="totals">
                    <p>Subtotal: <strong>DOP$ ${ultimoPedido.subtotal.toLocaleString()}</strong></p>
                    ${ultimoPedido.costoEnvio > 0 ? `<p>Tarifa de Entrega: <strong>DOP$ ${ultimoPedido.costoEnvio.toLocaleString()}</strong></p>` : ''}
                    <p class="grand-total">Total: DOP$ ${ultimoPedido.total.toLocaleString()}</p>
                </div>
                <div class="footer">
                    <p>¡Gracias por endulzar tus momentos con KeyBakery en Los Alcarrizos!</p>
                    <button class="no-print" onclick="window.print()" style="margin-top: 15px; padding: 8px 18px; background: #D81B60; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        Imprimir / Guardar como PDF
                    </button>
                </div>
            </div>
        </body>
        </html>
    `);
    invoiceWindow.document.close();
}

// --- 10. SCROLL REVEAL OPTIMIZADO ---
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px"
    });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// --- 11. INICIALIZACIÓN DE LA APLICACIÓN ---
function init() {
    inicializarDOM();

    // Actualizar fecha del próximo domingo en todos los indicadores
    const proximoDomingoTexto = getProximoDomingoTexto();
    if (DOM.proximoDomingoSpans) {
        DOM.proximoDomingoSpans.forEach(span => {
            span.textContent = proximoDomingoTexto;
        });
    }

    // 1. Cargar productos desde Firestore con fallback resiliente
    if (db) {
        try {
            const qProds = query(collection(db, "products"), orderBy("nombre"));
            onSnapshot(qProds, (snapshot) => {
                if (snapshot.empty) {
                    listaProductos = [...defaultProducts];
                } else {
                    const prods = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                    // Sincronizar catálogo para asegurar que los productos de la semana nunca desaparezcan
                    const map = new Map();
                    defaultProducts.forEach(p => map.set(p.id, p));
                    prods.forEach(p => {
                        if (p.id) map.set(p.id, { ...(map.get(p.id) || {}), ...p });
                    });
                    listaProductos = Array.from(map.values());
                    hasDynamicFirestoreData = true;
                }
                renderizarMenu();
            }, (err) => {
                console.warn("Firestore notice, usando catálogo local de repostería:", err);
                listaProductos = [...defaultProducts];
                renderizarMenu();
            });
        } catch (e) {
            console.warn("Firestore catch:", e);
            listaProductos = [...defaultProducts];
            renderizarMenu();
        }
    } else {
        listaProductos = [...defaultProducts];
    }

    renderizarMenu();
    actualizarCarrito();
    initScrollReveal();

    // Conectar botones destacados del Producto de la Semana
    const btnHeroPorcion = document.getElementById('btn-pedir-porcion-semana');
    if (btnHeroPorcion) {
        btnHeroPorcion.addEventListener('click', (e) => {
            e.preventDefault();
            window.cardAddToCart('prod-brownie-clasico', btnHeroPorcion);
        });
    }

    const btnHeroCaja = document.getElementById('btn-pedir-caja-semana');
    if (btnHeroCaja) {
        btnHeroCaja.addEventListener('click', (e) => {
            e.preventDefault();
            window.cardAddToCart('prod-caja-brownies', btnHeroCaja);
        });
    }

    // 2. Filtros de Categorías Accesibles
    if (DOM.categoryTabs) {
        DOM.categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                DOM.categoryTabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                activeCategory = tab.dataset.category || 'todos';
                renderizarMenu();
            });
        });
    }

    // 3. Menú Móvil Drawer con Accesibilidad
    if (DOM.mobileMenuToggle && DOM.mobileDrawer && DOM.mobileDrawerOverlay) {
        const openDrawer = () => {
            lastFocusedElement = document.activeElement;
            DOM.mobileDrawer.classList.add('active');
            DOM.mobileDrawerOverlay.classList.add('active');
            DOM.mobileDrawer.setAttribute('aria-hidden', 'false');
            if (DOM.closeDrawerBtn) DOM.closeDrawerBtn.focus();
        };
        const closeDrawer = () => {
            DOM.mobileDrawer.classList.remove('active');
            DOM.mobileDrawerOverlay.classList.remove('active');
            DOM.mobileDrawer.setAttribute('aria-hidden', 'true');
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        };

        DOM.mobileMenuToggle.addEventListener('click', openDrawer);
        if (DOM.closeDrawerBtn) DOM.closeDrawerBtn.addEventListener('click', closeDrawer);
        DOM.mobileDrawerOverlay.addEventListener('click', closeDrawer);

        if (DOM.drawerLinks) {
            DOM.drawerLinks.forEach(link => link.addEventListener('click', closeDrawer));
        }
    }

    // 4. Preguntas Frecuentes (FAQ Accordion)
    if (DOM.faqItems) {
        DOM.faqItems.forEach(item => {
            const btn = item.querySelector('.faq-question');
            if (btn) {
                btn.addEventListener('click', () => {
                    const isActive = item.classList.contains('active');
                    DOM.faqItems.forEach(i => {
                        i.classList.remove('active');
                        const b = i.querySelector('.faq-question');
                        if (b) b.setAttribute('aria-expanded', 'false');
                    });
                    if (!isActive) {
                        item.classList.add('active');
                        btn.setAttribute('aria-expanded', 'true');
                    }
                });
            }
        });
    }

    // 5. Apertura y Cierre de Carrito
    if (DOM.openCartBtn) {
        DOM.openCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            DOM.cartSidebar.classList.add('open');
            DOM.cartSidebar.setAttribute('aria-hidden', 'false');
            if (DOM.closeCartBtn) DOM.closeCartBtn.focus();
        });
    }

    if (DOM.mobileOpenCartBtn) {
        DOM.mobileOpenCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            DOM.cartSidebar.classList.add('open');
            DOM.cartSidebar.setAttribute('aria-hidden', 'false');
            if (DOM.closeCartBtn) DOM.closeCartBtn.focus();
        });
    }

    if (DOM.closeCartBtn) {
        DOM.closeCartBtn.addEventListener('click', () => {
            DOM.cartSidebar.classList.remove('open');
            DOM.cartSidebar.setAttribute('aria-hidden', 'true');
            if (DOM.openCartBtn) DOM.openCartBtn.focus();
        });
    }

    // 6. Pasos del Modal de Compra & Atrapado de Foco
    if (DOM.checkoutBtn) {
        DOM.checkoutBtn.addEventListener('click', abrirModalPago);
    }

    if (DOM.closePaymentBtn) {
        DOM.closePaymentBtn.addEventListener('click', cerrarModalPago);
    }

    if (DOM.goToPaymentBtn) {
        DOM.goToPaymentBtn.addEventListener('click', () => {
            DOM.stepUpsell.classList.add('hidden');
            DOM.stepPayment.classList.remove('hidden');
            const firstInput = document.getElementById('card-name');
            if (firstInput) firstInput.focus();
        });
    }

    if (DOM.paymentForm) {
        DOM.paymentForm.addEventListener('submit', procesarPedido);
    }

    if (DOM.downloadInvoiceBtn) {
        DOM.downloadInvoiceBtn.addEventListener('click', descargarFactura);
    }

    if (DOM.closeSuccessBtn) {
        DOM.closeSuccessBtn.addEventListener('click', cerrarModalPago);
    }

    // Focus Trap
    if (DOM.paymentModal) {
        DOM.paymentModal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const focusableSelectors = 'button:not([disabled]):not([aria-hidden="true"]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
                const focusables = Array.from(DOM.paymentModal.querySelectorAll(focusableSelectors))
                    .filter(el => el.offsetParent !== null && !el.closest('.hidden'));

                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        });
    }

    // Cierre global con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (DOM.paymentModal && DOM.paymentModal.style.display !== 'none' && DOM.paymentModal.style.display !== '') {
                cerrarModalPago();
                return;
            }
            if (DOM.cartSidebar && DOM.cartSidebar.classList.contains('open')) {
                DOM.cartSidebar.classList.remove('open');
                DOM.cartSidebar.setAttribute('aria-hidden', 'true');
                if (DOM.openCartBtn) DOM.openCartBtn.focus();
                return;
            }
            if (DOM.mobileDrawer && DOM.mobileDrawer.classList.contains('active')) {
                DOM.mobileDrawer.classList.remove('active');
                DOM.mobileDrawerOverlay.classList.remove('active');
                DOM.mobileDrawer.setAttribute('aria-hidden', 'true');
                if (DOM.mobileMenuToggle) DOM.mobileMenuToggle.focus();
                return;
            }
        }
    });

    // 7. Opciones de Entrega (Taller, Teleférico, Domicilio, Pastel Completo)
    if (DOM.deliveryMethods) {
        DOM.deliveryMethods.forEach(radio => {
            radio.addEventListener('change', () => {
                const val = radio.value;
                if (DOM.telefericoSelectorBox) {
                    DOM.telefericoSelectorBox.classList.toggle('hidden', val !== 'teleferico');
                }
                if (DOM.customerAddress) {
                    DOM.customerAddress.classList.toggle('hidden', val !== 'delivery');
                }
                if (DOM.customerAddressLabel) {
                    DOM.customerAddressLabel.classList.toggle('hidden', val !== 'delivery');
                }
                if (DOM.deliveryWarning) {
                    DOM.deliveryWarning.classList.toggle('hidden', val !== 'delivery');
                }
                if (DOM.encargoDateBox) {
                    DOM.encargoDateBox.classList.toggle('hidden', val !== 'encargo');
                }
            });
        });
    }

    // 8. Formulario de Contacto
    if (DOM.contactForm) {
        DOM.contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre = document.getElementById('contact-name').value.trim();
            const tel = document.getElementById('contact-phone').value.trim();
            const msg = document.getElementById('contact-message').value.trim();

            if (!nombre || !tel || !msg) {
                showToast("Por favor completa todos los campos del formulario.");
                return;
            }

            let txt = `🎂 *CONSULTA - KEYBAKERY (LOS ALCARRIZOS)*\n\n*Nombre:* ${nombre}\n*Teléfono:* ${tel}\n*Mensaje:*\n${msg}`;
            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(txt)}`;
            window.open(url, '_blank');
            DOM.contactForm.reset();
            showToast("¡Mensaje preparado para enviar por WhatsApp!");
        });
    }

    // 9. Formato Telefónico Dominicano (809-000-0000)
    [DOM.contactPhone, DOM.customerPhone].forEach(input => {
        if (input) {
            input.addEventListener('input', (e) => {
                const numbers = e.target.value.replace(/\D/g, '');
                let formatted = '';
                if (numbers.length > 0) formatted = numbers.substring(0, 3);
                if (numbers.length > 3) formatted += '-' + numbers.substring(3, 6);
                if (numbers.length > 6) formatted += '-' + numbers.substring(6, 10);
                e.target.value = formatted;
            });
        }
    });

    // 10. Navbar Scroll Effect & Scroll-To-Top
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (nav) {
            if (window.scrollY > 40) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        }

        if (DOM.scrollTopBtn) {
            if (window.scrollY > 450) DOM.scrollTopBtn.classList.add('visible');
            else DOM.scrollTopBtn.classList.remove('visible');
        }
    });

    if (DOM.scrollTopBtn) {
        DOM.scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 11. Año en Footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // 12. Cierre modal al hacer click fuera del contenedor
    window.addEventListener('click', (e) => {
        if (DOM.paymentModal && e.target === DOM.paymentModal) {
            cerrarModalPago();
        }
    });

    // 13. Inicializar Chatbot de la Repostera Animada (Chef Keyla)
    initReposteraChatbot();
}

// ==========================================================================
// --- 8. CHATBOT ASISTENTE: REPOSTERA ANIMADA (CHEF KEYLA) ---
// ==========================================================================

const CHAT_QUICK_OPTIONS = [
    { key: "semana", label: "✨ Postre de la Semana" },
    { key: "teleferico", label: "🚡 Entregas Teleférico" },
    { key: "pastel", label: "🎂 Pasteles (48h)" },
    { key: "carrito", label: "🛍️ Ver mi Carrito" },
    { key: "whatsapp", label: "💬 Hablar por WhatsApp" }
];

function initReposteraChatbot() {
    if (!DOM.reposteraChatContainer) return;

    // Toggle botón flotante
    if (DOM.reposteraFloatBtn) {
        DOM.reposteraFloatBtn.addEventListener('click', () => {
            window.toggleReposteraChat();
        });
    }

    // Clic en globo de saludo
    if (DOM.reposteraSpeechTrigger) {
        DOM.reposteraSpeechTrigger.addEventListener('click', () => {
            window.toggleReposteraChat(true);
        });
    }

    // Cerrar globo de saludo
    if (DOM.reposteraSpeechClose) {
        DOM.reposteraSpeechClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (DOM.reposteraSpeechBubble) DOM.reposteraSpeechBubble.classList.add('hidden');
        });
    }

    // Cerrar ventana del chat
    if (DOM.reposteraCloseBtn) {
        DOM.reposteraCloseBtn.addEventListener('click', () => {
            window.toggleReposteraChat(false);
        });
    }

    // Reiniciar conversación
    if (DOM.reposteraResetBtn) {
        DOM.reposteraResetBtn.addEventListener('click', () => {
            window.resetReposteraChat();
        });
    }

    // Envío del formulario de texto
    if (DOM.reposteraChatForm) {
        DOM.reposteraChatForm.addEventListener('submit', window.handleReposteraSubmit);
    }

    // Cerrar con Escape si está abierto
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.reposteraChatWindow && !DOM.reposteraChatWindow.hidden) {
            window.toggleReposteraChat(false);
        }
    });

    // Auto-ocultar globo teaser tras 18 segundos si no se interactuó
    setTimeout(() => {
        if (DOM.reposteraSpeechBubble && DOM.reposteraChatWindow && DOM.reposteraChatWindow.hidden) {
            DOM.reposteraSpeechBubble.style.opacity = '0';
            DOM.reposteraSpeechBubble.style.transition = 'opacity 0.8s ease';
            setTimeout(() => {
                if (DOM.reposteraSpeechBubble) DOM.reposteraSpeechBubble.classList.add('hidden');
            }, 800);
        }
    }, 18000);
}

window.toggleReposteraChat = function(forceOpen) {
    if (!DOM.reposteraChatWindow) return;

    const isHidden = DOM.reposteraChatWindow.hidden;
    const shouldOpen = (forceOpen !== undefined) ? forceOpen : isHidden;

    if (shouldOpen) {
        DOM.reposteraChatWindow.hidden = false;
        if (DOM.reposteraFloatBtn) DOM.reposteraFloatBtn.setAttribute('aria-expanded', 'true');
        if (DOM.reposteraSpeechBubble) DOM.reposteraSpeechBubble.classList.add('hidden');
        if (DOM.reposteraUnreadPill) DOM.reposteraUnreadPill.classList.add('hidden');

        // Si es la primera vez que abre y no hay mensajes, iniciar
        if (DOM.reposteraChatMessages && DOM.reposteraChatMessages.children.length === 0) {
            window.resetReposteraChat();
        }

        setTimeout(() => {
            if (DOM.reposteraChatInput) DOM.reposteraChatInput.focus();
            if (DOM.reposteraChatMessages) {
                DOM.reposteraChatMessages.scrollTop = DOM.reposteraChatMessages.scrollHeight;
            }
        }, 150);
    } else {
        DOM.reposteraChatWindow.hidden = true;
        if (DOM.reposteraFloatBtn) DOM.reposteraFloatBtn.setAttribute('aria-expanded', 'false');
    }
};

window.resetReposteraChat = function() {
    if (!DOM.reposteraChatMessages) return;
    DOM.reposteraChatMessages.innerHTML = '';

    const welcomeHtml = `
        <p>¡Hola! 👩‍🍳 Soy <strong>Keyla</strong>, tu repostera artesanal en <strong>KeyBakery Los Alcarrizos</strong>.</p>
        <p>En nuestra cocina trabajamos bajo un modelo por lotes: de lunes a viernes atendemos labores regulares y horneamos todo 100% fresco para entregas fijas los <strong>domingos</strong> (en taller o estaciones del Teleférico).</p>
        <p>Si deseas <strong>pasteles enteros o eventos</strong>, los preparamos personalizados bajo encargo con 48h de anticipación para cualquier fecha.</p>
        <p>¿En qué puedo colaborarte hoy? Elige una opción abajo o escribe tu consulta:</p>
    `;

    renderReposteraMessage('bot', welcomeHtml);
    renderQuickChips();
};

function renderQuickChips() {
    if (!DOM.reposteraQuickChips) return;
    DOM.reposteraQuickChips.innerHTML = CHAT_QUICK_OPTIONS.map(opt => `
        <button type="button" class="repostera-chip" onclick="window.handleReposteraQuickAction('${opt.key}')">
            ${opt.label}
        </button>
    `).join('');
}

window.handleReposteraQuickAction = function(key) {
    const option = CHAT_QUICK_OPTIONS.find(o => o.key === key);
    if (option) {
        renderReposteraMessage('user', option.label);
    }

    const domingoTexto = getProximoDomingoTexto();

    if (key === 'semana') {
        const weeklyItem = listaProductos.find(p => p.id === 'prod-brownie-clasico') || {
            nombre: 'Brownie Artesanal Melcochoso',
            precio: 180,
            id: 'prod-brownie-clasico',
            desc: 'Elaborado con cacao criollo dominicano, textura húmeda y costra brillante craquelada.'
        };
        const weeklyBox = listaProductos.find(p => p.id === 'prod-caja-brownies') || {
            nombre: 'Caja Degustación (4 unidades)',
            precio: 650,
            id: 'prod-caja-brownies',
            desc: '4 porciones surtidas: Clásico, Dulce de Leche, Nutella y Nueces.'
        };

        const replyHtml = `
            <p>✨ <strong>Postre Especial de Esta Semana:</strong></p>
            <p>Nuestro horno está dedicado a: <strong>${weeklyItem.nombre}</strong>. Horneado fresco por lotes para entregar este <strong>${domingoTexto}</strong> en Los Alcarrizos.</p>
            <p>Elige tu porción o caja y se agregará directamente a tu pedido:</p>
            
            <div class="chat-product-card">
                <div class="chat-product-header">
                    <span class="chat-product-title">${weeklyItem.nombre} (Porción)</span>
                    <span class="chat-product-price">DOP$ ${weeklyItem.precio.toLocaleString()}</span>
                </div>
                <p class="chat-product-desc">${weeklyItem.desc || 'Porción individual recién horneada para este domingo.'}</p>
                <button type="button" class="chat-btn-add" onclick="window.cardAddToCart('${weeklyItem.id}', this)">
                    <i data-lucide="shopping-basket" style="width: 14px; height: 14px;" aria-hidden="true"></i> Agregar Porción (+1)
                </button>
            </div>

            <div class="chat-product-card">
                <div class="chat-product-header">
                    <span class="chat-product-title">${weeklyBox.nombre}</span>
                    <span class="chat-product-price">DOP$ ${weeklyBox.precio.toLocaleString()}</span>
                </div>
                <p class="chat-product-desc">${weeklyBox.desc || '4 porciones ideales para compartir.'}</p>
                <button type="button" class="chat-btn-add" onclick="window.cardAddToCart('${weeklyBox.id}', this)">
                    <i data-lucide="box" style="width: 14px; height: 14px;" aria-hidden="true"></i> Agregar Caja 4x (+1)
                </button>
            </div>
        `;
        renderReposteraMessage('bot', replyHtml);
    } else if (key === 'teleferico') {
        const replyHtml = `
            <p>🚡 <strong>Entregas en Los Alcarrizos (Domingos):</strong></p>
            <p>Para mayor comodidad de nuestra comunidad:</p>
            <ul style="padding-left: 1.2rem; margin: 0.4rem 0; font-size: 0.85rem; line-height: 1.5;">
                <li><strong>🏪 Taller Los Alcarrizos:</strong> Retiro en persona sin costo adicional (Gratis).</li>
                <li><strong>🚡 Paradas del Teleférico (DOP$ 50):</strong>
                    <br>• Estación 1: Los Alcarrizos (Entrada / Autopista Duarte)
                    <br>• Estación 2: Las Cangrejas
                    <br>• Estación 3: Puente Blanco
                    <br>• Estación 4: Los Americanos
                </li>
                <li><strong>🛵 Envío a Domicilio:</strong> Directo a tu casa en Savica, El Chucho, Los Americanos, etc. (Costo coordinado según sector).</li>
            </ul>
            <p style="font-size: 0.82rem; color: var(--pink-hover);">Al confirmar en el carrito seleccionas tu punto exacto.</p>
        `;
        renderReposteraMessage('bot', replyHtml);
    } else if (key === 'pastel') {
        const replyHtml = `
            <p>🎂 <strong>Pasteles Completos & Eventos bajo Encargo:</strong></p>
            <p>¿Tienes un cumpleaños, bautizo o reunión en la semana? Los pasteles enteros los preparamos personalizados:</p>
            <ul style="padding-left: 1.2rem; margin: 0.4rem 0; font-size: 0.85rem; line-height: 1.5;">
                <li><strong>Anticipación:</strong> Mínimo 48 horas de anticipación.</li>
                <li><strong>Día de entrega:</strong> ¡Cualquier día de la semana coordinado contigo!</li>
                <li><strong>Opciones:</strong> Bizcocho dominicano tradicional con suspiro, pudín de vainilla, red velvet, chocolate húmedo o zanahoria.</li>
            </ul>
            <div style="display: flex; gap: 0.5rem; flex-direction: column; margin-top: 0.6rem;">
                <a href="#menu" class="btn-secondary" style="padding: 0.55rem; text-align: center; font-size: 0.82rem;" onclick="window.toggleReposteraChat(false)">Ver Pasteles en el Menú</a>
                <a href="https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Chef%20Keyla,%20quisiera%20cotizar%20un%20pastel%20completo%20para%20un%20evento" target="_blank" rel="noopener noreferrer" class="btn-hero-whatsapp" style="padding: 0.55rem; font-size: 0.82rem; justify-content: center;">Coordinar Pastel por WhatsApp</a>
            </div>
        `;
        renderReposteraMessage('bot', replyHtml);
    } else if (key === 'carrito') {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        const totalDOP = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

        if (totalItems === 0) {
            const replyHtml = `
                <p>🛒 <strong>Tu carrito actualmente está vacío.</strong></p>
                <p>¿Deseas consultar el postre activo de esta semana o explorar los pasteles completos en el menú?</p>
                <div style="display: flex; gap: 0.45rem; flex-wrap: wrap; margin-top: 0.5rem;">
                    <button type="button" class="repostera-chip" onclick="window.handleReposteraQuickAction('semana')">✨ Ver Postre de la Semana</button>
                    <a href="#menu" class="repostera-chip" onclick="window.toggleReposteraChat(false)">🍰 Ver Menú</a>
                </div>
            `;
            renderReposteraMessage('bot', replyHtml);
        } else {
            const itemsListHtml = carrito.map(item => `
                <li style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span>${item.cantidad}x ${item.nombre}</span>
                    <strong>DOP$ ${(item.precio * item.cantidad).toLocaleString()}</strong>
                </li>
            `).join('');

            const replyHtml = `
                <p>🛍️ <strong>Resumen de tu Carrito (${totalItems} productos):</strong></p>
                <ul style="padding-left: 0; list-style: none; font-size: 0.82rem; background: #fff; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--border-color); margin: 0.5rem 0;">
                    ${itemsListHtml}
                    <li style="border-top: 1px dashed #ddd; margin-top: 6px; padding-top: 6px; display: flex; justify-content: space-between; font-weight: 800; color: var(--pink);">
                        <span>Total:</span>
                        <span>DOP$ ${totalDOP.toLocaleString()}</span>
                    </li>
                </ul>
                <div style="display: flex; gap: 0.5rem; flex-direction: column; margin-top: 0.5rem;">
                    <button type="button" class="btn-primary" style="padding: 0.6rem; font-size: 0.84rem;" onclick="window.openCart(); window.toggleReposteraChat(false);">
                        Abrir Carrito y Completar Pedido
                    </button>
                </div>
            `;
            renderReposteraMessage('bot', replyHtml);
        }
    } else if (key === 'whatsapp') {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        let txt = `Hola Chef Keyla, te escribo desde la página de KeyBakery Los Alcarrizos.`;
        if (totalItems > 0) {
            txt += ` Tengo ${totalItems} productos en mi carrito y deseo coordinar mi pedido.`;
        } else {
            txt += ` Deseo hacer un pedido para este domingo.`;
        }
        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(txt)}`;

        const replyHtml = `
            <p>💬 <strong>¡Con mucho gusto te atiendo en WhatsApp!</strong></p>
            <p>Haz clic en el botón de abajo para abrir la conversación directa con nuestro equipo:</p>
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-hero-whatsapp" style="padding: 0.65rem; font-size: 0.84rem; justify-content: center; margin-top: 0.4rem;">
                <i data-lucide="message-circle" style="width: 16px; height: 16px;" aria-hidden="true"></i> Abrir Chat en WhatsApp
            </a>
        `;
        renderReposteraMessage('bot', replyHtml);
    }
};

window.handleReposteraSubmit = async function(event) {
    if (event) event.preventDefault();
    if (!DOM.reposteraChatInput) return;

    const rawText = DOM.reposteraChatInput.value.trim();
    if (!rawText) return;

    DOM.reposteraChatInput.value = '';
    renderReposteraMessage('user', rawText);

    // Indicador temporal de escribiendo
    const typingId = 'typing-' + Date.now();
    const typingRow = document.createElement('div');
    typingRow.className = 'chat-bubble-row bot';
    typingRow.id = typingId;
    typingRow.innerHTML = `
        <div class="chat-bubble-avatar">👩‍🍳</div>
        <div class="chat-bubble" style="color: var(--text-muted); font-style: italic;">
            Chef Keyla está escribiendo...
        </div>
    `;
    if (DOM.reposteraChatMessages) {
        DOM.reposteraChatMessages.appendChild(typingRow);
        DOM.reposteraChatMessages.scrollTop = DOM.reposteraChatMessages.scrollHeight;
    }

    const removeTyping = () => {
        const el = document.getElementById(typingId);
        if (el) el.remove();
    };

    // 1. Intentar endpoint de Gemini /api/chat en segundo plano con timeout
    let aiReply = null;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: rawText }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            if (data && data.reply) {
                aiReply = data.reply;
            }
        }
    } catch (e) {
        // Fallback natural a motor de respuestas local
    }

    removeTyping();

    if (aiReply) {
        renderReposteraMessage('bot', `<p>${aiReply.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`);
        return;
    }

    // 2. Motor de Respuestas Contextuales Local de Chef Keyla
    const q = rawText.toLowerCase();
    const domingoTexto = getProximoDomingoTexto();

    if (q.includes('brownie') || q.includes('semana') || q.includes('lote') || q.includes('que tienen') || q.includes('que hay') || q.includes('postre de la semana') || q.includes('especial de la semana')) {
        renderReposteraMessage('bot', `
            <p>✨ <strong>Postre Especial de Esta Semana:</strong></p>
            <p>Esta semana tenemos activo nuestro lote de <strong>Brownies Artesanales Melcochosos</strong> 🍫 horneados con cacao criollo dominicano, textura húmeda y costra brillante.</p>
            <p>Puedes pedir la porción individual por <strong>DOP$ 180</strong> o la caja degustación de 4 unidades por <strong>DOP$ 650</strong> con entrega este <strong>${domingoTexto}</strong> en Los Alcarrizos.</p>
            <button type="button" class="chat-btn-add" style="margin-top: 0.3rem;" onclick="window.cardAddToCart('prod-brownie-clasico', this)">
                <i data-lucide="shopping-basket" style="width: 14px; height: 14px;" aria-hidden="true"></i> Pedir Porción de la Semana (+1)
            </button>
        `);
    } else if (q.includes('teleferico') || q.includes('donde') || q.includes('ubicacion') || q.includes('direccion') || q.includes('entrega') || q.includes('alcarrizos') || q.includes('parada')) {
        renderReposteraMessage('bot', `
            <p>📍 <strong>Estamos en Los Alcarrizos, Santo Domingo Oeste</strong>.</p>
            <p>Nuestras entregas son los <strong>domingos</strong> en:</p>
            <p>• <strong>Gratis:</strong> En nuestro taller de Los Alcarrizos.<br>• <strong>DOP$ 50:</strong> En las estaciones 1 (Entrada Duarte), 2 (Las Cangrejas), 3 (Puente Blanco) y 4 (Los Americanos).<br>• <strong>Delivery a Domicilio:</strong> Directo a tu puerta en tu sector.</p>
        `);
    } else if (q.includes('pastel') || q.includes('bizcocho') || q.includes('torta') || q.includes('cumpleaños') || q.includes('boda') || q.includes('completo') || q.includes('libra')) {
        renderReposteraMessage('bot', `
            <p>🎂 ¡Hacemos hermosos y deliciosos pasteles completos para tus celebraciones!</p>
            <p>Los pasteles enteros se elaboran bajo encargo con <strong>mínimo 48h de anticipación</strong> y podemos coordinar la entrega el día de la semana que lo necesites (no solo domingo).</p>
            <p>¿Deseas masa pudín tradicional con dulce de leche, tres leches o red velvet?</p>
            <a href="https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Chef%20Keyla,%20quiero%20cotizar%20un%20pastel%20completo" target="_blank" rel="noopener noreferrer" class="btn-hero-whatsapp" style="padding: 0.55rem; font-size: 0.82rem; justify-content: center; margin-top: 0.3rem;">
                <i data-lucide="message-circle" style="width: 14px; height: 14px;" aria-hidden="true"></i> Cotizar Pastel en WhatsApp
            </a>
        `);
    } else if (q.includes('precio') || q.includes('costo') || q.includes('cuanto') || q.includes('vale')) {
        renderReposteraMessage('bot', `
            <p>💵 <strong>Precios Destacados de KeyBakery:</strong></p>
            <p>• <strong>Postre de la Semana:</strong> DOP$ 180 (Porción) | DOP$ 650 (Caja 4 uds)<br>• <strong>Pastel Dominicano 1/2 lb:</strong> Desde DOP$ 750<br>• <strong>Pastel Dominicano 1 lb:</strong> Desde DOP$ 1,350<br>• <strong>Bandejas de Catibías (25 uds):</strong> DOP$ 950<br>• <strong>Bandeja Croissants (12 uds):</strong> DOP$ 700</p>
        `);
    } else if (q.includes('pago') || q.includes('pagar') || q.includes('transferencia') || q.includes('banco') || q.includes('tarjeta') || q.includes('efectivo')) {
        renderReposteraMessage('bot', `
            <p>💳 <strong>Métodos de Pago Aceptados:</strong></p>
            <p>Aceptamos transferencias por <strong>Banco Popular, BHD y Banreservas</strong>, así como pago en <strong>efectivo</strong> al momento de retirar en el taller o contra entrega en Los Alcarrizos.</p>
        `);
    } else if (q.includes('gracias') || q.includes('ok') || q.includes('bien') || q.includes('excelente') || q.includes('perfecto')) {
        renderReposteraMessage('bot', `
            <p>¡A la orden siempre! 🥰 En KeyBakery horneamos con mucho amor para endulzar tus momentos en Los Alcarrizos. Si necesitas algo más, solo dime.</p>
        `);
    } else {
        renderReposteraMessage('bot', `
            <p>¡Hola! Con mucho gusto te asisto. 👩‍🍳 En KeyBakery horneamos por lotes semanales para los <strong>domingos</strong>, y preparamos pasteles enteros por encargo con 48h de anticipación.</p>
            <p>¿En qué puedo ayudarte? Puedes consultar el postre de esta semana, los puntos del Teleférico o cotizar un pastel para tu evento:</p>
            <div style="display: flex; gap: 0.45rem; flex-wrap: wrap; margin-top: 0.5rem;">
                <button type="button" class="repostera-chip" onclick="window.handleReposteraQuickAction('semana')">✨ Postre de esta semana</button>
                <button type="button" class="repostera-chip" onclick="window.handleReposteraQuickAction('teleferico')">🚡 Puntos Teleférico</button>
                <button type="button" class="repostera-chip" onclick="window.handleReposteraQuickAction('pastel')">🎂 Pastel Entero</button>
                <button type="button" class="repostera-chip" onclick="window.handleReposteraQuickAction('whatsapp')">💬 Abrir WhatsApp</button>
            </div>
        `);
    }
};

function renderReposteraMessage(role, htmlContent) {
    if (!DOM.reposteraChatMessages) return;

    const row = document.createElement('div');
    row.className = `chat-bubble-row ${role}`;

    if (role === 'bot') {
        row.innerHTML = `
            <div class="chat-bubble-avatar">👩‍🍳</div>
            <div class="chat-bubble">
                ${htmlContent}
            </div>
        `;
    } else {
        row.innerHTML = `
            <div class="chat-bubble">
                <p>${escapeHtml(htmlContent)}</p>
            </div>
        `;
    }

    DOM.reposteraChatMessages.appendChild(row);
    DOM.reposteraChatMessages.scrollTop = DOM.reposteraChatMessages.scrollHeight;

    if (window.lucide) {
        lucide.createIcons();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
