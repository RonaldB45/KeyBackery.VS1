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

// --- 2. CATÁLOGO OFICIAL: MENÚ DE POSTRES ARTESANALES KEYBAKERY ---
// Precios oficiales del menú físico: Brownies, Pastisetas, Alfajores, Tres Leches, Flanes y Bizcochos
const defaultProducts = [
    // 1. Brownies
    {
        id: "prod-brownies",
        nombre: "Brownies Artesanales Melcochosos",
        precio: 100,
        categoria: "galletas-dulces",
        tipo: "menu",
        badge: "⭐ Favorito de la Casa",
        descripcion: "Deliciosos brownies artesanales melcochosos, elaborados con puro chocolate, textura fudge densa y costra brillante craquelada.",
        imagen: "/assets/images/menu/brownies.jpg",
        stock: 50,
        activo: true
    },
    // 2. Pastisetas
    {
        id: "prod-pastisetas",
        nombre: "Pastisetas",
        precio: 160,
        categoria: "galletas-dulces",
        tipo: "menu",
        badge: "🌸 Flor Tradicional",
        descripcion: "Galletas de mantequilla finas en forma de flor con centro de jalea dulce artesanal, tan suaves que se deshacen en el paladar.",
        imagen: "/assets/images/menu/pastisetas.jpg",
        stock: 40,
        activo: true
    },
    // 3. Alfajores de dulce de leche
    {
        id: "prod-alfajores",
        nombre: "Alfajores de Dulce de Leche",
        precio: 130,
        categoria: "galletas-dulces",
        tipo: "menu",
        badge: "✨ Clásico Criollo",
        descripcion: "Suaves tapas de maicena rellenas con abundante dulce de leche criollo artesanal y espolvoreadas con azúcar glas fina.",
        imagen: "/assets/images/menu/alfajores.jpg",
        stock: 40,
        activo: true
    },
    // 4. Tres leches tradicional
    {
        id: "prod-tres-leches-tradicional",
        nombre: "Tres Leches Tradicional",
        precio: 130,
        categoria: "tres-leches-flanes",
        tipo: "menu",
        badge: "🥛 Receta Tradicional",
        descripcion: "Bizcocho esponjoso bañado en nuestra clásica mezcla de tres leches y coronado con suspiro ligero y un toque de canela molida.",
        imagen: "/assets/images/menu/tres_leches_tradicional.jpg",
        stock: 35,
        activo: true
    },
    // 5. Tres leches de coco
    {
        id: "prod-tres-leches-coco",
        nombre: "Tres Leches de Coco",
        precio: 150,
        categoria: "tres-leches-flanes",
        tipo: "menu",
        badge: "🥥 Sabor Tropical",
        descripcion: "Masa embebida en infusión de tres leches y leche de coco fresca, cubierta de crema sedosa y lluvia de coco rallado natural.",
        imagen: "/assets/images/menu/tres_leches_coco.jpg",
        stock: 30,
        activo: true
    },
    // 6. Tres leches de chocolate
    {
        id: "prod-tres-leches-chocolate",
        nombre: "Tres Leches de Chocolate",
        precio: 190,
        categoria: "tres-leches-flanes",
        tipo: "menu",
        badge: "🍫 Cacao Dominicano",
        descripcion: "Bizcocho de chocolate bañado en tres leches achocolatada, decorado con virutas de puro cacao artesanal.",
        imagen: "/assets/images/menu/tres_leches_chocolate.jpg",
        stock: 30,
        activo: true
    },
    // 7. Flan (porción)
    {
        id: "prod-flan",
        nombre: "Flan (Porción)",
        precio: 200,
        categoria: "tres-leches-flanes",
        tipo: "menu",
        badge: "🍮 Sedoso & Cremoso",
        descripcion: "Porción de flan tradicional dominicano súper sedoso y suave, cocinado lentamente con abundante caramelo dorado líquido.",
        imagen: "/assets/images/menu/flan.jpg",
        stock: 30,
        activo: true
    },
    // 8. Carrot cake
    {
        id: "prod-carrot-cake",
        nombre: "Carrot Cake",
        precio: 220,
        categoria: "bizcochos-pasteles",
        tipo: "menu",
        badge: "🥕 Especial de Zanahoria",
        descripcion: "Pastel húmedo de zanahoria fresca especiada con nueces y canela, relleno y cubierto con frosting suave de queso crema.",
        imagen: "/assets/images/menu/carrot_cake.jpg",
        stock: 25,
        activo: true
    },
    // 9. Bizcocho de vainilla
    {
        id: "prod-bizcocho-vainilla",
        nombre: "Bizcocho de Vainilla",
        precio: 250,
        categoria: "bizcochos-pasteles",
        tipo: "menu",
        badge: "🎂 Clásico Casero",
        descripcion: "Clásico bizcocho esponjoso de vainilla natural, relleno artesanal y cobertura sedosa al auténtico estilo casero dominicano.",
        imagen: "/assets/images/menu/bizcocho_vainilla.jpg",
        stock: 25,
        activo: true
    },
    // 10. Bizcocho de chocolate estilo Milky Way
    {
        id: "prod-bizcocho-milky-way",
        nombre: "Bizcocho de Chocolate estilo Milky Way",
        precio: 280,
        categoria: "bizcochos-pasteles",
        tipo: "menu",
        badge: "🍫 Caramelo & Nougat",
        descripcion: "Tarta húmeda de chocolate con generoso relleno de caramelo artesanal y nougat suave, cubierta de ganache y crocante.",
        imagen: "/assets/images/menu/bizcocho_milky_way.jpg",
        stock: 20,
        activo: true
    },
    // 11. Bizcocho de chocolate (Chocomatilda)
    {
        id: "prod-bizcocho-chocomatilda",
        nombre: "Bizcocho de Chocolate (Chocomatilda)",
        precio: 225,
        categoria: "bizcochos-pasteles",
        tipo: "menu",
        badge: "🍰 Tarta Matilda Legendaria",
        descripcion: "Inspirado en la famosa tarta de chocolate: bizcocho súper húmedo con fudge cremoso y lluvia intensa de chocolate.",
        imagen: "/assets/images/menu/bizcocho_chocomatilda.jpg",
        stock: 25,
        activo: true
    },
    // 12. Volteado de piña (porción)
    {
        id: "prod-volteado-pina",
        nombre: "Volteado de Piña (Porción)",
        precio: 140,
        categoria: "bizcochos-pasteles",
        tipo: "menu",
        badge: "🍍 Tradición Caribeña",
        descripcion: "Tradicional volteado con rodajas de piña caramelizadas en azúcar morena y cerezas, sobre una masa dorada impregnada de almíbar.",
        imagen: "/assets/images/menu/volteado_pina.jpg",
        stock: 25,
        activo: true
    }
];

let listaProductos = [...defaultProducts];
let hasDynamicFirestoreData = false;
let carrito = JSON.parse(localStorage.getItem('keybakery_cart')) || [];
let activeCategory = 'todos';
let isFullMenuExpanded = false;
const FEATURED_PRODUCT_IDS = new Set([
    'prod-brownies',
    'prod-tres-leches-tradicional',
    'prod-bizcocho-milky-way'
]);
const WEEKLY_SPECIAL_IDS = new Set([
    'prod-brownies',
    'prod-brownie-clasico',
    'prod-caja-brownies'
]);

function resolveProductForMinRule(prodOrId) {
    if (!prodOrId) return null;
    if (typeof prodOrId === 'string') {
        const lookupId = prodOrId === 'prod-brownie-clasico' ? 'prod-brownies' : prodOrId;
        return (
            listaProductos.find(p => p.id === lookupId || p.id === prodOrId) ||
            defaultProducts.find(p => p.id === lookupId || p.id === prodOrId) ||
            { id: prodOrId }
        );
    }
    return prodOrId;
}

function isWeeklySpecialProduct(prodOrId) {
    const prod = resolveProductForMinRule(prodOrId);
    if (!prod) return false;
    return (
        WEEKLY_SPECIAL_IDS.has(prod.id) ||
        prod.esSemana === true ||
        prod.tipo === 'semana' ||
        prod.categoria === 'semana'
    );
}

function isWholeOrCustomProduct(prodOrId) {
    const prod = resolveProductForMinRule(prodOrId);
    if (!prod) return false;
    const nombre = (prod.nombre || '').toLowerCase();
    return (
        prod.esCompleto === true ||
        prod.esPersonalizado === true ||
        prod.tipo === 'completo' ||
        prod.tipo === 'personalizado' ||
        prod.categoria === 'pasteles-completos' ||
        prod.categoria === 'personalizados' ||
        prod.categoria === 'bocadillos-eventos' ||
        /(completo|entero|personalizado|mini cake|caja|pack)/i.test(nombre)
    );
}

function getMinOrderQty(prodOrId) {
    if (isWeeklySpecialProduct(prodOrId) || isWholeOrCustomProduct(prodOrId)) {
        return 1;
    }
    return 3;
}

function sanitizeCartQuantities() {
    let changed = false;
    carrito.forEach(item => {
        const minQty = getMinOrderQty(item);
        if (!item.cantidad || item.cantidad < minQty) {
            item.cantidad = minQty;
            changed = true;
        }
    });
    if (changed) {
        localStorage.setItem('keybakery_cart', JSON.stringify(carrito));
    }
    return changed;
}

sanitizeCartQuantities();

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
        menuExpandBar: document.getElementById('menu-expand-bar'),
        toggleFullMenuBtn: document.getElementById('toggle-full-menu-btn'),
        toggleFullMenuLabel: document.getElementById('toggle-full-menu-label'),
        toggleFullMenuBadge: document.getElementById('toggle-full-menu-badge'),
        toggleModelBtn: document.getElementById('toggle-model-btn'),
        modelStepsCollapsible: document.getElementById('model-steps-collapsible'),
        toggleOtrosBtn: document.getElementById('toggle-otros-btn'),
        otrosDetailsCollapsible: document.getElementById('otros-details-collapsible'),
        toggleMapBtn: document.getElementById('toggle-map-btn'),
        deliveryMapCollapsible: document.getElementById('delivery-map-collapsible'),
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
        telefericoStationsGrid: document.getElementById('teleferico-stations-grid'),
        customerAddress: document.getElementById('customer-address'),
        customerAddressLabel: document.getElementById('label-customer-address'),
        deliveryWarning: document.getElementById('delivery-warning'),
        encargoDateBox: document.getElementById('encargo-date-box'),
        encargoDateInput: document.getElementById('encargo-date'),
        downloadInvoiceBtn: document.getElementById('download-invoice'),
        whatsappOrderLink: document.getElementById('whatsapp-order-link'),
        closeSuccessBtn: document.getElementById('close-success'),
        // Referencias del Modal de Factura Oficial
        invoiceModal: document.getElementById('invoice-modal'),
        invoiceSheet: document.getElementById('invoice-sheet'),
        invoicePrintBtn: document.getElementById('invoice-print-btn'),
        invoiceDownloadPngBtn: document.getElementById('invoice-download-png-btn'),
        invoiceCloseBtn: document.getElementById('invoice-close-btn'),
        btnFormatA4: document.getElementById('btn-format-a4'),
        btnFormatTicket: document.getElementById('btn-format-ticket'),
        invoiceCanvas: document.getElementById('invoice-canvas'),
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
    const minQty = getMinOrderQty(id);
    return Math.max(minQty, productQuantities[id] || minQty);
}

window.cardQtyChange = function(id, delta) {
    const minQty = getMinOrderQty(id);
    const current = getProductQuantity(id);
    const attempted = current + delta;

    if (delta < 0 && attempted < minQty) {
        productQuantities[id] = minQty;
        const numEl = document.getElementById(`qty-num-${id}`);
        if (numEl) numEl.textContent = minQty;
        showToast(`Pedido mínimo de ${minQty} unidades para este postre del menú (solo el Especial de la Semana o completos se piden desde 1).`);
        return;
    }

    const newQty = Math.max(minQty, Math.min(99, attempted));
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

    // Resolver alias de producto si aplica
    let lookupId = id;
    if (id === 'prod-brownie-clasico') lookupId = 'prod-brownies';

    // 1. Buscar en listaProductos, luego en defaultProducts, luego fallback específico
    let prod = listaProductos.find(p => p.id === lookupId || p.id === id) || defaultProducts.find(p => p.id === lookupId || p.id === id);
    if (!prod) {
        if (id === 'prod-brownie-clasico' || id === 'prod-brownies' || id === 'prod-caja-brownies') {
            prod = defaultProducts.find(p => p.id === 'prod-brownies');
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

    const minQty = getMinOrderQty(prod);
    const qty = Math.max(minQty, getProductQuantity(id));
    const existe = carrito.find(i => i.id === prod.id || i.id === id);
    if (existe) {
        existe.cantidad = Math.max(minQty, existe.cantidad + qty);
    } else {
        carrito.push({ ...prod, cantidad: qty });
    }

    // Reset cantidad temporal del stepper al mínimo permitido del producto
    productQuantities[id] = minQty;
    const numEl = document.getElementById(`qty-num-${id}`);
    if (numEl) numEl.textContent = String(minQty);

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

    // Animación y efecto visual en el botón del carrito SIN abrirlo automáticamente
    [DOM.openCartBtn, DOM.mobileOpenCartBtn].forEach(btn => {
        if (btn) {
            btn.classList.remove('cart-bump');
            void btn.offsetWidth; // Forzar reflow para reiniciar la animación
            btn.classList.add('cart-bump');
            setTimeout(() => {
                btn.classList.remove('cart-bump');
            }, 700);
        }
    });
};

window.__realCardAddToCart = window.cardAddToCart;

// Procesar clics que hayan ocurrido antes de que el script terminara de cargar
if (window._pendingCartAdds && window._pendingCartAdds.length > 0) {
    const pendings = [...window._pendingCartAdds];
    window._pendingCartAdds = [];
    pendings.forEach(p => window.cardAddToCart(p.id, p.btn));
}

function updateMenuExpandButton(totalAllCount, visibleCount) {
    if (!DOM.menuExpandBar || !DOM.toggleFullMenuBtn) return;

    if (activeCategory !== 'todos' || totalAllCount <= 3) {
        DOM.menuExpandBar.classList.add('hidden');
        return;
    }

    DOM.menuExpandBar.classList.remove('hidden');
    DOM.toggleFullMenuBtn.setAttribute('aria-expanded', String(isFullMenuExpanded));

    if (isFullMenuExpanded) {
        if (DOM.toggleFullMenuLabel) {
            DOM.toggleFullMenuLabel.textContent = 'Mostrar menos postres (Ver 3 destacados)';
        }
        if (DOM.toggleFullMenuBadge) {
            DOM.toggleFullMenuBadge.style.display = 'none';
        }
    } else {
        const remaining = Math.max(0, totalAllCount - visibleCount);
        if (DOM.toggleFullMenuLabel) {
            DOM.toggleFullMenuLabel.textContent = `Ver el Menú Completo (${totalAllCount} Postres)`;
        }
        if (DOM.toggleFullMenuBadge) {
            DOM.toggleFullMenuBadge.textContent = `+${remaining} más`;
            DOM.toggleFullMenuBadge.style.display = remaining > 0 ? 'inline-block' : 'none';
        }
    }
}

window.expandFullMenu = function() {
    isFullMenuExpanded = true;
    activeCategory = 'todos';
    if (DOM.categoryTabs) {
        DOM.categoryTabs.forEach(t => {
            const isTodos = t.dataset.category === 'todos';
            t.classList.toggle('active', isTodos);
            t.setAttribute('aria-selected', String(isTodos));
        });
    }
    renderizarMenu();
};

function renderizarMenu() {
    if (!DOM.productsContainer) return;

    // Si ya existen tarjetas pre-renderizadas en HTML y no hay datos remotos alterados:
    const existingCards = DOM.productsContainer.querySelectorAll('.product-card');
    if (existingCards.length > 0 && !hasDynamicFirestoreData) {
        let visibleCount = 0;
        existingCards.forEach(card => {
            const cardCat = card.dataset.category;
            const prodId = (card.id || '').replace(/^card-/, '');
            const matches = activeCategory === 'todos'
                ? (isFullMenuExpanded || FEATURED_PRODUCT_IDS.has(prodId))
                : (cardCat === activeCategory);
            card.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });

        updateMenuExpandButton(existingCards.length, visibleCount);

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
    const activeProducts = listaProductos.filter(p => p.activo !== false);
    let filtrados = activeCategory === 'todos'
        ? activeProducts
        : activeProducts.filter(p => p.categoria === activeCategory);

    if (activeCategory === 'todos' && !isFullMenuExpanded) {
        const featured = filtrados.filter(p => FEATURED_PRODUCT_IDS.has(p.id));
        filtrados = featured.length > 0 ? featured : filtrados.slice(0, 3);
    }

    updateMenuExpandButton(activeProducts.length, filtrados.length);

    if (filtrados.length === 0) {
        DOM.productsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
                <p class="text-muted" style="font-size: 1.1rem;">No se encontraron productos en esta categoría.</p>
            </div>`;
        return;
    }

    DOM.productsContainer.innerHTML = filtrados.map(p => {
        const minQty = getMinOrderQty(p);
        const qty = Math.max(minQty, getProductQuantity(p.id));
        const badgeHtml = p.badge ? `<span class="product-badge">${p.badge}</span>` : '';
        const descHtml = p.descripcion || 'Elaborado artesanalmente en Los Alcarrizos.';
        const isUpcoming = p.tipo === 'proxima';
        const isWeekly = isWeeklySpecialProduct(p);
        const minPillHtml = isWeekly
            ? `<span class="min-qty-pill weekly">🔥 Especial de la Semana • Desde 1 unidad</span>`
            : (minQty === 1
                ? `<span class="min-qty-pill weekly">🎂 Completo / Personalizado • Desde 1 unidad</span>`
                : `<span class="min-qty-pill">📦 Pedido mínimo: ${minQty} unidades</span>`);

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
                        ${!isUpcoming ? minPillHtml : ''}
                        <div class="product-price-row">
                            <span class="price-tag">${isUpcoming ? 'Próximamente' : `RD$ ${p.precio.toLocaleString()} <small style="font-size: 0.78rem; font-weight: normal; color: var(--text-muted);">c/u</small>`}</span>
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
window.eliminarDelCarrito = function(id) {
    const item = carrito.find(i => i.id === id);
    carrito = carrito.filter(i => i.id !== id);
    actualizarCarrito();
    if (item) {
        showToast(`"${item.nombre}" eliminado del carrito.`);
    }
};

window.cambiarCant = function(id, delta) {
    const item = carrito.find(i => i.id === id);
    if (!item) return;

    const minQty = getMinOrderQty(item);
    const nextQty = item.cantidad + delta;

    if (delta < 0 && nextQty < minQty) {
        if (minQty <= 1) {
            carrito = carrito.filter(i => i.id !== id);
        } else {
            item.cantidad = minQty;
            showToast(`Pedido mínimo de ${minQty} unidades para "${item.nombre}". Usa el ícono 🗑️ si deseas quitarlo del carrito.`);
        }
    } else {
        item.cantidad = Math.min(99, nextQty);
    }
    actualizarCarrito();
};

function actualizarCarrito() {
    if (!DOM.cartItemsContainer) return;
    sanitizeCartQuantities();
    DOM.cartItemsContainer.innerHTML = '';
    let total = 0;
    let itemsContador = 0;

    let hasWeeklyItem = false;
    let hasCustomCake = false;
    let hasMinThreeItem = false;

    if (carrito.length === 0) {
        DOM.cartItemsContainer.innerHTML = `
            <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                <i data-lucide="shopping-basket" style="width: 56px; height: 56px; opacity: 0.3; margin: 0 auto 1rem;" aria-hidden="true"></i>
                <h4 style="margin-bottom: 0.5rem; color: var(--text-dark);">Tu carrito está vacío</h4>
                <p class="text-sm mb-4">Elige el Especial de la Semana (desde 1 unidad) o tus favoritos del menú (mínimo 3 unidades).</p>
                <a href="#menu" class="btn-secondary" onclick="window.closeCart();">Ver Menú</a>
            </div>`;
    } else {
        carrito.forEach(item => {
            const minQty = getMinOrderQty(item);
            const isWeekly = isWeeklySpecialProduct(item);
            const isWholeOrCustom = isWholeOrCustomProduct(item);

            total += item.precio * item.cantidad;
            itemsContador += item.cantidad;

            if (isWeekly) hasWeeklyItem = true;
            if (isWholeOrCustom) hasCustomCake = true;
            if (minQty >= 3) hasMinThreeItem = true;

            const badgeNota = isWeekly
                ? '🔥 Especial de la Semana • Desde 1 u.'
                : (isWholeOrCustom
                    ? '🎂 Completo / Personalizado • Desde 1 u.'
                    : `📦 Menú Regular • Mínimo ${minQty} unidades`);

            const atMinClass = item.cantidad <= minQty ? 'at-min' : '';

            DOM.cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <img src="${item.imagen}" class="cart-item-img" alt="${item.nombre}" width="70" height="70" loading="lazy" referrerpolicy="no-referrer">
                    <div class="cart-item-info">
                        <div class="cart-item-header-row">
                            <p class="cart-item-title">${item.nombre}</p>
                            <button type="button" class="btn-cart-remove" onclick="eliminarDelCarrito('${item.id}')" aria-label="Eliminar ${item.nombre} del carrito" title="Quitar del carrito">
                                <i data-lucide="trash-2" aria-hidden="true"></i>
                            </button>
                        </div>
                        <p class="text-xs color-gold font-bold">${badgeNota}</p>
                        <p class="cart-item-price">DOP$ ${item.precio.toLocaleString()} <small style="font-weight: 500; color: var(--text-muted);">c/u • Subtotal: DOP$ ${(item.precio * item.cantidad).toLocaleString()}</small></p>
                        <div class="cart-item-actions-row">
                            <div class="cart-item-controls" aria-label="Controles de cantidad para ${item.nombre}">
                                <button class="btn-qty ${atMinClass}" onclick="cambiarCant('${item.id}', -1)" aria-label="Restar una unidad de ${item.nombre}">-</button>
                                <span class="cart-item-qty" aria-live="polite">${item.cantidad}</span>
                                <button class="btn-qty" onclick="cambiarCant('${item.id}', 1)" aria-label="Sumar una unidad de ${item.nombre}">+</button>
                            </div>
                            ${minQty > 1 ? `<span class="cart-min-tag">Mín. ${minQty} u.</span>` : ''}
                        </div>
                    </div>
                </div>`;
        });

        // Banner informativo dentro del carrito sobre entrega y regla de pedido mínimo
        let avisoEntrega = '';
        if (hasWeeklyItem && !hasCustomCake) {
            avisoEntrega = `<div style="background: var(--pink-subtle); padding: 0.7rem; border-radius: 8px; font-size: 0.8rem; color: var(--pink-hover); margin-bottom: 0.75rem; border: 1px solid rgba(216,27,96,0.2);">
                📅 <strong>Entrega Dominical:</strong> Tu orden se horneará y entregará este <strong>${getProximoDomingoTexto()}</strong> en Los Alcarrizos.
            </div>`;
        } else if (hasCustomCake && !hasWeeklyItem) {
            avisoEntrega = `<div style="background: var(--gold-subtle); padding: 0.7rem; border-radius: 8px; font-size: 0.8rem; color: var(--gold); margin-bottom: 0.75rem; border: 1px solid rgba(125,85,21,0.2);">
                🎂 <strong>Pastel Completo / Evento:</strong> Coordinaremos el día que lo necesites con mínimo 48h de anticipación.
            </div>`;
        } else {
            avisoEntrega = `<div style="background: var(--cream-dark); padding: 0.7rem; border-radius: 8px; font-size: 0.8rem; color: var(--text-dark); margin-bottom: 0.75rem; border: 1px solid var(--border-color);">
                📅 <strong>Entregas:</strong> Domingos en nuestro taller o paradas del Teleférico en Los Alcarrizos.
            </div>`;
        }

        if (hasMinThreeItem) {
            avisoEntrega += `<div style="background: #FDF9EE; padding: 0.65rem 0.75rem; border-radius: 8px; font-size: 0.78rem; color: var(--gold-hover); margin-bottom: 1rem; border: 1px solid rgba(168,118,31,0.24);">
                📦 <strong>Regla de Pedido:</strong> Los postres regulares del menú requieren <strong>3 unidades o más</strong> por sabor (el Especial de la Semana y completos se piden desde 1).
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
    const minQty = getMinOrderQty(p);
    const itemEnCarrito = carrito.find(item => item.id === prodId);
    if (itemEnCarrito) {
        itemEnCarrito.cantidad += 1;
    } else {
        carrito.push({ ...p, cantidad: minQty });
    }
    actualizarCarrito();
    window.cargarSugerencias();
    const modalTotal = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    if (DOM.modalTotal) DOM.modalTotal.textContent = `DOP$ ${modalTotal.toLocaleString()}`;
    showToast(`¡Agregado ${minQty}x ${p.nombre} al pedido!`);
};

window.cargarSugerencias = function() {
    if (!DOM.upsellContainer) return;
    DOM.upsellContainer.innerHTML = '';
    
    // Sugerir productos activos respetando la cantidad mínima al añadir
    const sugeridos = listaProductos
        .filter(p => p.activo !== false && p.tipo !== 'proxima' && !carrito.find(item => item.id === p.id))
        .slice(0, 2);

    sugeridos.forEach(p => {
        const minQty = getMinOrderQty(p);
        DOM.upsellContainer.innerHTML += `
            <div class="cart-item" style="border: 1.5px dashed var(--gold-light);">
                <img src="${p.imagen}" class="cart-item-img" alt="${p.nombre}" width="70" height="70" loading="lazy" referrerpolicy="no-referrer">
                <div style="flex-grow: 1;">
                    <p class="font-bold" style="font-size: 0.95rem; margin-bottom: 0.2rem;">${p.nombre}</p>
                    <p class="text-sm color-gold font-bold mb-2">DOP$ ${p.precio.toLocaleString()} c/u ${minQty > 1 ? `<small style="color: var(--text-muted); font-weight: 600;">(Mín. ${minQty} u.)</small>` : ''}</p>
                    <button type="button" class="btn-secondary" style="padding: 0.4rem 1rem; font-size: 0.8rem;" aria-label="Añadir ${p.nombre} al pedido" onclick="window.agregarSugerencia('${p.id}')">
                        ${minQty > 1 ? `+ Añadir ${minQty} u. (Mín.)` : '+ Añadir al Pedido'}
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
    if (sanitizeCartQuantities()) {
        actualizarCarrito();
        showToast("Se ajustaron las cantidades al mínimo permitido (3 u. en menú regular).");
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
let currentInvoiceFormat = 'a4';

async function procesarPedido(e) {
    e.preventDefault();

    const nombreCliente = document.getElementById('card-name').value.trim();
    const telefonoCliente = document.getElementById('customer-phone').value.trim();
    const metodoEntregaInput = document.querySelector('input[name="delivery-method"]:checked');
    const metodo = metodoEntregaInput ? metodoEntregaInput.value : 'pickup';
    
    // Obtener la estación seleccionada del Teleférico (desde el input oculto o el selector activo)
    const estacionTeleferico = (DOM.telefericoStationSelect ? DOM.telefericoStationSelect.value : '') || 'Estación 1: Los Alcarrizos (Entrada / Autopista Duarte)';
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

    const invalidItem = carrito.find(i => i.cantidad < getMinOrderQty(i));
    if (invalidItem) {
        const minQty = getMinOrderQty(invalidItem);
        invalidItem.cantidad = minQty;
        actualizarCarrito();
        showToast(`"${invalidItem.nombre}" requiere mínimo ${minQty} unidades. Actualizamos tu carrito.`);
        return;
    }

    const subtotal = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    let costoEnvio = 0;
    let metodoTexto = "Recoger en Taller (Los Alcarrizos) - Domingo";
    let detalleUbicacion = "Taller Central KeyBakery en Los Alcarrizos";

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
    const numeroOrden = 'KB-' + Math.floor(100000 + Math.random() * 900000);

    ultimoPedido = {
        numeroOrden,
        cliente: nombreCliente,
        telefono: telefonoCliente,
        items: carrito.map(i => ({ id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, categoria: i.categoria })),
        subtotal,
        costoEnvio,
        total: totalFinal,
        metodoTexto,
        detalleUbicacion,
        proximoDomingo: proximoDomingoStr,
        fechaOrden: new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    // 1. Guardar en Firestore en segundo plano (SIN bloquear con await para no perder el gesto del usuario y evitar bloqueo de popups)
    if (db) {
        addDoc(collection(db, "orders"), {
            numeroOrden,
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
        }).catch(err => {
            console.warn("Firestore notice en segundo plano:", err);
        });
    }

    // 2. Construir Mensaje Oficial de WhatsApp
    let mensaje = `🎂 *NUEVO PEDIDO - KEYBAKERY (LOS ALCARRIZOS)* 🎂\n`;
    mensaje += `*Orden N°:* #${numeroOrden}\n\n`;
    mensaje += `👤 *Cliente:* ${nombreCliente}\n`;
    mensaje += `📱 *WhatsApp:* ${telefonoCliente}\n`;
    mensaje += `📍 *Entrega:* ${metodoTexto}\n`;
    if (detalleUbicacion) mensaje += `📌 *Ubicación / Parada:* ${detalleUbicacion}\n`;
    mensaje += `🗓️ *Fecha Estimada:* ${metodo === 'encargo' ? (fechaEncargo || 'A coordinar') : proximoDomingoStr}\n`;
    mensaje += `\n🛒 *DETALLE DEL PEDIDO:*\n`;

    ultimoPedido.items.forEach(i => {
        mensaje += `• ${i.cantidad}x ${i.nombre} — DOP$ ${(i.precio * i.cantidad).toLocaleString()}\n`;
    });

    mensaje += `\n💵 *Subtotal:* DOP$ ${subtotal.toLocaleString()}`;
    if (costoEnvio > 0) mensaje += `\n📦 *Punto de Teleférico:* DOP$ ${costoEnvio.toLocaleString()}`;
    mensaje += `\n💰 *TOTAL FINAL:* DOP$ ${totalFinal.toLocaleString()}\n\n`;
    mensaje += `🍰 _KeyBakery Los Alcarrizos • Hecho con amor y los mejores ingredientes._`;

    const encoded = encodeURIComponent(mensaje);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`;

    // Actualizar el enlace directo en la pantalla de éxito
    if (DOM.whatsappOrderLink) {
        DOM.whatsappOrderLink.href = whatsappUrl;
    }

    // 3. Abrir WhatsApp inmediatamente mediante clic directo
    try {
        const tempLink = document.createElement('a');
        tempLink.href = whatsappUrl;
        tempLink.target = '_blank';
        tempLink.rel = 'noopener noreferrer';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
    } catch (err) {
        console.warn("Aviso abriendo WhatsApp directamente:", err);
    }

    // Limpiar carrito y mostrar confirmación
    carrito = [];
    actualizarCarrito();

    DOM.stepPayment.classList.add('hidden');
    DOM.successMessage.classList.remove('hidden');

    // Pre-cargar la factura oficial en el modal
    renderFacturaSheet(currentInvoiceFormat);

    setTimeout(() => {
        if (DOM.whatsappOrderLink) DOM.whatsappOrderLink.focus();
    }, 60);
}

// --- 9. FACTURA OFICIAL KEYBAKERY CON DISEÑO DE MARCA & MÚLTIPLES FORMATOS ---

function getFacturaFallbackOrder() {
    return {
        numeroOrden: 'KB-' + Math.floor(100000 + Math.random() * 900000),
        cliente: "Cliente KeyBakery",
        telefono: "809-442-8442",
        items: [
            { id: "prod-brownies", nombre: "Brownies Artesanales Melcochosos", precio: 100, cantidad: 2 },
            { id: "prod-tres-leches-tradicional", nombre: "Tres Leches Tradicional", precio: 130, cantidad: 3 }
        ],
        subtotal: 590,
        costoEnvio: 50,
        total: 640,
        metodoTexto: "Parada Teleférico Los Alcarrizos: Estación 1: Los Alcarrizos (Entrada / Duarte)",
        detalleUbicacion: "Estación 1: Los Alcarrizos (Entrada / Duarte)",
        proximoDomingo: getProximoDomingoTexto(),
        fechaOrden: new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
}

function renderFacturaSheet(format = 'a4') {
    if (!DOM.invoiceSheet) return;
    const pedido = ultimoPedido || getFacturaFallbackOrder();

    DOM.invoiceSheet.className = `invoice-sheet format-${format}`;

    const itemsRows = pedido.items.map(item => `
        <tr>
            <td style="font-weight: 600;">${item.nombre}</td>
            <td style="text-align: center; font-weight: 700;">${item.cantidad}</td>
            <td style="text-align: right; color: var(--text-muted);">RD$ ${item.precio.toLocaleString()}</td>
            <td style="text-align: right; font-weight: 800; color: var(--pink-hover);">RD$ ${(item.precio * item.cantidad).toLocaleString()}</td>
        </tr>
    `).join('');

    DOM.invoiceSheet.innerHTML = `
        <header class="invoice-brand-header">
            <div class="invoice-logo-group">
                <img src="/assets/images/keybakery-logo.png" alt="Logo KeyBakery" class="invoice-logo-img" onerror="this.style.display='none'">
                <div>
                    <h2 class="invoice-brand-title">KeyBakery</h2>
                    <span class="invoice-brand-subtitle">Pastelería Artesanal Dominicana</span>
                    <small style="color: var(--text-muted); font-size: 0.78rem;">Los Alcarrizos, Santo Domingo Oeste • Tel. 809-442-8442</small>
                </div>
            </div>
            <div class="invoice-tag-pill">
                <strong style="display: block; font-size: 0.95rem; color: var(--text-dark);">ORDEN #${pedido.numeroOrden}</strong>
                <span>ESTADO: CONFIRMADO</span>
            </div>
        </header>

        <section class="invoice-meta-grid">
            <div class="invoice-meta-box">
                <div style="margin-bottom: 0.35rem;"><strong>Cliente:</strong> <span class="val">${pedido.cliente}</span></div>
                <div style="margin-bottom: 0.35rem;"><strong>Teléfono:</strong> <span class="val">${pedido.telefono}</span></div>
                <div><strong>Fecha de Emisión:</strong> <span class="val">${pedido.fechaOrden}</span></div>
            </div>
            <div class="invoice-meta-box">
                <div style="margin-bottom: 0.35rem;"><strong>Entrega:</strong> <span class="val">${pedido.metodoTexto}</span></div>
                <div style="margin-bottom: 0.35rem;"><strong>Ubicación:</strong> <span class="val">${pedido.detalleUbicacion || 'Los Alcarrizos'}</span></div>
                <div><strong>Programado:</strong> <span class="val" style="color: var(--pink); font-weight: 700;">${pedido.proximoDomingo}</span></div>
            </div>
        </section>

        <table class="invoice-table">
            <thead>
                <tr>
                    <th>Postre Artesanal</th>
                    <th style="text-align: center;">Cant.</th>
                    <th style="text-align: right;">Precio</th>
                    <th style="text-align: right;">Importe</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
        </table>

        <div class="invoice-totals-box">
            <div class="invoice-total-row">
                <span style="color: var(--text-muted);">Subtotal Postres:</span>
                <strong>RD$ ${pedido.subtotal.toLocaleString()}</strong>
            </div>
            <div class="invoice-total-row">
                <span style="color: var(--text-muted);">Entrega / Teleférico:</span>
                <strong>${pedido.costoEnvio > 0 ? `RD$ ${pedido.costoEnvio.toLocaleString()}` : 'Gratis (En Taller)'}</strong>
            </div>
            <div class="invoice-total-row invoice-grand-total">
                <span>TOTAL A PAGAR:</span>
                <span>RD$ ${pedido.total.toLocaleString()}</span>
            </div>
        </div>

        <footer class="invoice-footer-notes">
            <p style="margin: 0 0 0.35rem 0; font-weight: 700; color: var(--pink);">¡Hecho con amor y los mejores ingredientes! ♡</p>
            <p style="margin: 0; color: var(--text-muted);">Gracias por apoyar mi pequeño gran sueño en Los Alcarrizos. Presenta esta factura digital al recibir tu pedido.</p>
        </footer>
    `;

    if (window.lucide) lucide.createIcons();
}

function setInvoiceFormat(format) {
    currentInvoiceFormat = format;
    if (DOM.btnFormatA4 && DOM.btnFormatTicket) {
        DOM.btnFormatA4.classList.toggle('active', format === 'a4');
        DOM.btnFormatA4.setAttribute('aria-pressed', format === 'a4');
        DOM.btnFormatTicket.classList.toggle('active', format === 'ticket');
        DOM.btnFormatTicket.setAttribute('aria-pressed', format === 'ticket');
    }
    renderFacturaSheet(format);
}

function abrirModalFactura() {
    renderFacturaSheet(currentInvoiceFormat);
    if (DOM.invoiceModal) {
        DOM.invoiceModal.style.display = 'flex';
        DOM.invoiceModal.classList.add('open');
        DOM.invoiceModal.setAttribute('aria-hidden', 'false');
    }
}

function cerrarModalFactura() {
    if (DOM.invoiceModal) {
        DOM.invoiceModal.style.display = 'none';
        DOM.invoiceModal.classList.remove('open');
        DOM.invoiceModal.setAttribute('aria-hidden', 'true');
    }
}

function imprimirFactura() {
    window.print();
}

// Descarga en formato imagen (PNG) de alta resolución usando HTML5 Canvas con la paleta de KeyBakery
function descargarFacturaImagen() {
    const pedido = ultimoPedido || getFacturaFallbackOrder();
    const canvas = DOM.invoiceCanvas || document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isTicket = currentInvoiceFormat === 'ticket';
    const width = isTicket ? 640 : 880;
    const padding = isTicket ? 35 : 55;
    
    // Calcular altura dinámica en base a cantidad de productos
    const itemHeight = 36;
    const baseHeight = isTicket ? 680 : 660;
    const height = baseHeight + (pedido.items.length * itemHeight);

    canvas.width = width;
    canvas.height = height;

    // 1. Fondo suave crema de repostería
    ctx.fillStyle = '#FFFDFB';
    ctx.fillRect(0, 0, width, height);

    // 2. Borde exterior decorativo lila orquídea y oro
    ctx.strokeStyle = '#B84EC7';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    ctx.strokeStyle = '#E5BA68';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 18, width - 36, height - 36);

    let currentY = padding + 15;

    // 3. Encabezado de Marca
    ctx.fillStyle = '#B84EC7';
    ctx.font = 'bold 32px serif';
    ctx.textAlign = 'center';
    ctx.fillText('KeyBakery', width / 2, currentY);
    currentY += 24;

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('PASTELERÍA ARTESANAL DOMINICANA', width / 2, currentY);
    currentY += 20;

    ctx.fillStyle = '#6B5867';
    ctx.font = '13px sans-serif';
    ctx.fillText('Los Alcarrizos, Santo Domingo Oeste • Tel. 809-442-8442', width / 2, currentY);
    currentY += 24;

    // Línea divisoria
    ctx.strokeStyle = 'rgba(184, 78, 199, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(width - padding, currentY);
    ctx.stroke();
    currentY += 24;

    // 4. Datos del Pedido
    ctx.textAlign = 'left';
    ctx.fillStyle = '#281424';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`ORDEN: #${pedido.numeroOrden}`, padding, currentY);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = '#B84EC7';
    ctx.fillText(`FECHA: ${pedido.fechaOrden}`, width - padding, currentY);
    currentY += 22;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#281424';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Cliente: ${pedido.cliente}`, padding, currentY);
    
    ctx.textAlign = 'right';
    ctx.fillText(`WhatsApp: ${pedido.telefono}`, width - padding, currentY);
    currentY += 20;

    ctx.textAlign = 'left';
    ctx.fillText(`Entrega: ${pedido.metodoTexto}`, padding, currentY);
    currentY += 20;
    if (pedido.detalleUbicacion) {
        ctx.fillText(`Punto/Sector: ${pedido.detalleUbicacion}`, padding, currentY);
        currentY += 22;
    }

    currentY += 10;

    // 5. Tabla de Productos
    ctx.fillStyle = '#FAF0FD';
    ctx.fillRect(padding, currentY, width - (padding * 2), 30);
    
    ctx.fillStyle = '#281424';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('POSTRE ARTESANAL', padding + 12, currentY + 20);
    ctx.textAlign = 'center';
    ctx.fillText('CANT.', width - padding - 170, currentY + 20);
    ctx.textAlign = 'right';
    ctx.fillText('PRECIO', width - padding - 90, currentY + 20);
    ctx.fillText('TOTAL', width - padding - 12, currentY + 20);
    currentY += 34;

    pedido.items.forEach((item, idx) => {
        if (idx % 2 === 1) {
            ctx.fillStyle = '#FCF8FD';
            ctx.fillRect(padding, currentY - 4, width - (padding * 2), itemHeight);
        }
        ctx.fillStyle = '#281424';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'left';
        
        let itemName = item.nombre;
        if (isTicket && itemName.length > 25) itemName = itemName.substring(0, 23) + '...';
        ctx.fillText(itemName, padding + 12, currentY + 18);
        
        ctx.textAlign = 'center';
        ctx.fillText(item.cantidad.toString(), width - padding - 170, currentY + 18);
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#6B5867';
        ctx.fillText(`RD$ ${item.precio.toLocaleString()}`, width - padding - 90, currentY + 18);
        
        ctx.fillStyle = '#B84EC7';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`RD$ ${(item.precio * item.cantidad).toLocaleString()}`, width - padding - 12, currentY + 18);
        
        currentY += itemHeight;
    });

    currentY += 14;

    // 6. Resumen de Totales
    const totalBoxW = isTicket ? width - (padding * 2) : 340;
    const totalBoxX = width - padding - totalBoxW;
    
    ctx.fillStyle = '#FAF0FD';
    ctx.fillRect(totalBoxX, currentY, totalBoxW, 95);
    ctx.strokeStyle = 'rgba(184, 78, 199, 0.4)';
    ctx.strokeRect(totalBoxX, currentY, totalBoxW, 95);

    ctx.fillStyle = '#281424';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Subtotal:', totalBoxX + 16, currentY + 25);
    ctx.textAlign = 'right';
    ctx.fillText(`RD$ ${pedido.subtotal.toLocaleString()}`, totalBoxX + totalBoxW - 16, currentY + 25);

    ctx.textAlign = 'left';
    ctx.fillText('Entrega / Teleférico:', totalBoxX + 16, currentY + 50);
    ctx.textAlign = 'right';
    ctx.fillText(pedido.costoEnvio > 0 ? `RD$ ${pedido.costoEnvio.toLocaleString()}` : 'Gratis', totalBoxX + totalBoxW - 16, currentY + 50);

    ctx.fillStyle = '#B84EC7';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL A PAGAR:', totalBoxX + 16, currentY + 80);
    ctx.textAlign = 'right';
    ctx.fillText(`RD$ ${pedido.total.toLocaleString()}`, totalBoxX + totalBoxW - 16, currentY + 80);

    currentY += 120;

    // 7. Pie de Factura
    ctx.textAlign = 'center';
    ctx.fillStyle = '#B84EC7';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('¡Hecho con amor y los mejores ingredientes! ♡', width / 2, currentY);
    currentY += 20;

    ctx.fillStyle = '#8C7588';
    ctx.font = '12px sans-serif';
    ctx.fillText('¡Gracias por apoyar mi pequeño gran sueño en Los Alcarrizos!', width / 2, currentY);

    // Disparar descarga directa como archivo en el dispositivo (teléfono móvil o PC)
    const fileName = `Factura_KeyBakery_${pedido.numeroOrden}.png`;

    const triggerDirectDownload = (url, isBlob = false) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.setAttribute('download', fileName);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            if (link.parentNode) link.parentNode.removeChild(link);
            if (isBlob) URL.revokeObjectURL(url);
        }, 3000);
        showToast("¡Factura guardada directamente en tu dispositivo!");
    };

    try {
        if (canvas.toBlob) {
            canvas.toBlob((blob) => {
                if (blob) {
                    const blobUrl = URL.createObjectURL(blob);
                    triggerDirectDownload(blobUrl, true);
                } else {
                    const dataUrl = canvas.toDataURL('image/png');
                    triggerDirectDownload(dataUrl, false);
                }
            }, 'image/png');
        } else {
            const dataUrl = canvas.toDataURL('image/png');
            triggerDirectDownload(dataUrl, false);
        }
    } catch (err) {
        console.warn("Aviso en descarga de factura:", err);
        // Fallback: imprimir o guardar como PDF del navegador
        window.print();
    }
}

window.abrirModalFactura = abrirModalFactura;
window.cerrarModalFactura = cerrarModalFactura;
window.setInvoiceFormat = setInvoiceFormat;
window.imprimirFactura = imprimirFactura;
window.descargarFacturaImagen = descargarFacturaImagen;
window.descargarFactura = abrirModalFactura;

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

// --- 10.1 FONDO DINÁMICO & PASTELES FLOTANTES CON CAMBIO DE COLOR AL DESLIZAR ---
function initAmbientBakeryBackground() {
    const bgContainer = document.getElementById('ambient-bakery-bg');
    if (!bgContainer) return;

    let ticking = false;

    // Paleta cromática de repostería artesanal que transiciona suavemente según la posición del scroll
    const colorStops = [
        {
            pos: 0.0,   // Arriba: Rosa Orquídea Pastel y Merengue (Hero / Semana)
            canvas: '#FCF8FD',
            base: '#F9DDF6',
            frosting: '#FFFFFF',
            accent: '#B84EC7',
            stroke: 'rgba(184, 78, 199, 0.40)',
            glow: 'rgba(184, 78, 199, 0.16)'
        },
        {
            pos: 0.28,  // Menú Completo: Miel de Caramelo & Vainilla Dorada
            canvas: '#FDF9F2',
            base: '#FDECC8',
            frosting: '#FFFFFF',
            accent: '#D4AF37',
            stroke: 'rgba(168, 118, 31, 0.40)',
            glow: 'rgba(212, 175, 55, 0.18)'
        },
        {
            pos: 0.58,  // Teleférico & Zonas: Glaseado de Fresa & Flor Criolla
            canvas: '#FDF5F8',
            base: '#FCD8E4',
            frosting: '#FFFFFF',
            accent: '#E05388',
            stroke: 'rgba(224, 83, 136, 0.40)',
            glow: 'rgba(224, 83, 136, 0.16)'
        },
        {
            pos: 0.84,  // Preguntas & Modelos: Azul Batidor Cyan Pastel
            canvas: '#F4FAFD',
            base: '#CFEFFC',
            frosting: '#FFFFFF',
            accent: '#0096C7',
            stroke: 'rgba(0, 150, 199, 0.40)',
            glow: 'rgba(0, 150, 199, 0.18)'
        },
        {
            pos: 1.0,   // Pie de Página & Contacto: Lila Púrpura Dulce
            canvas: '#FAF5FD',
            base: '#EEDAF7',
            frosting: '#FFFFFF',
            accent: '#9E35AE',
            stroke: 'rgba(158, 53, 174, 0.40)',
            glow: 'rgba(158, 53, 174, 0.16)'
        }
    ];

    function updateBackground() {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, scrollY / maxScroll));

        // Encontrar los stops activos
        let lower = colorStops[0];
        let upper = colorStops[colorStops.length - 1];

        for (let i = 0; i < colorStops.length - 1; i++) {
            if (progress >= colorStops[i].pos && progress <= colorStops[i + 1].pos) {
                lower = colorStops[i];
                upper = colorStops[i + 1];
                break;
            }
        }

        const segmentProgress = (progress - lower.pos) / (upper.pos - lower.pos || 1);
        const chosen = segmentProgress > 0.5 ? upper : lower;

        // Actualizar variables CSS en el fondo
        bgContainer.style.setProperty('--bg-canvas-tone', chosen.canvas);
        bgContainer.style.setProperty('--pastry-color-base', chosen.base);
        bgContainer.style.setProperty('--pastry-color-accent', chosen.accent);
        bgContainer.style.setProperty('--pastry-color-stroke', chosen.stroke);
        bgContainer.style.setProperty('--pastry-glow-color', chosen.glow);

        // Suave desplazamiento de paralaje en los motivos flotantes
        const pastries = bgContainer.querySelectorAll('.floating-pastry');
        pastries.forEach((p, idx) => {
            const speed = ((idx % 4) + 1) * 0.05;
            const yOffset = (scrollY * speed) % 50;
            p.style.setProperty('--scroll-offset', `${-yOffset}px`);
        });

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateBackground);
            ticking = true;
        }
    }, { passive: true });

    // Ejecución inicial
    updateBackground();
}

// --- 11. INICIALIZACIÓN DE LA APLICACIÓN ---
function init() {
    inicializarDOM();
    initAmbientBakeryBackground();

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
                const validIdSet = new Set(defaultProducts.map(p => p.id));
                if (snapshot.empty) {
                    listaProductos = [...defaultProducts];
                } else {
                    const prods = snapshot.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .filter(d => validIdSet.has(d.id)); // FILTRADO ESTRICTO: Solo los 12 del menú
                    
                    const map = new Map();
                    defaultProducts.forEach(p => map.set(p.id, p));
                    prods.forEach(p => {
                        if (p.id && map.has(p.id)) {
                            map.set(p.id, { ...(map.get(p.id) || {}), ...p });
                        }
                    });
                    // Mantener orden exacto del volante oficial (1 a 12)
                    listaProductos = defaultProducts.map(p => map.get(p.id) || p);
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
            window.cardAddToCart('prod-brownies', btnHeroPorcion);
        });
    }

    const btnHeroCaja = document.getElementById('btn-pedir-caja-semana');
    if (btnHeroCaja) {
        btnHeroCaja.addEventListener('click', (e) => {
            e.preventDefault();
            window.cardAddToCart('prod-caja-brownies', btnHeroCaja);
        });
    }

    // 2. Filtros de Categorías Accesibles y Botones Expandibles
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

    if (DOM.toggleFullMenuBtn) {
        DOM.toggleFullMenuBtn.addEventListener('click', () => {
            isFullMenuExpanded = !isFullMenuExpanded;
            renderizarMenu();
            if (!isFullMenuExpanded) {
                const menuSection = document.getElementById('menu');
                if (menuSection) {
                    menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    }

    const setupCollapsibleToggle = (btn, panel, labelOpen, labelClosed) => {
        if (!btn || !panel) return;
        btn.addEventListener('click', () => {
            const isOpen = panel.classList.toggle('open');
            btn.setAttribute('aria-expanded', String(isOpen));
            panel.setAttribute('aria-hidden', String(!isOpen));
            const labelSpan = btn.querySelector('span');
            if (labelSpan) {
                labelSpan.textContent = isOpen ? labelOpen : labelClosed;
            }
            if (window.lucide) lucide.createIcons();
        });
    };

    setupCollapsibleToggle(
        DOM.toggleModelBtn,
        DOM.modelStepsCollapsible,
        'Ocultar explicación paso a paso',
        'Ver explicación paso a paso'
    );
    setupCollapsibleToggle(
        DOM.toggleOtrosBtn,
        DOM.otrosDetailsCollapsible,
        'Ocultar opciones de eventos',
        'Ver opciones para eventos y encargos'
    );
    setupCollapsibleToggle(
        DOM.toggleMapBtn,
        DOM.deliveryMapCollapsible,
        'Ocultar Mapa',
        'Ver Mapa'
    );

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
            if (DOM.invoiceModal && DOM.invoiceModal.style.display !== 'none' && DOM.invoiceModal.style.display !== '') {
                cerrarModalFactura();
                return;
            }
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

    // 7.1 Selector interactivo de las 4 estaciones del Teleférico en Los Alcarrizos
    if (DOM.telefericoStationsGrid) {
        const stationCards = DOM.telefericoStationsGrid.querySelectorAll('.teleferico-station-card');
        stationCards.forEach(card => {
            const selectStation = () => {
                stationCards.forEach(c => {
                    c.classList.remove('active');
                    c.setAttribute('aria-checked', 'false');
                });
                card.classList.add('active');
                card.setAttribute('aria-checked', 'true');
                const stationVal = card.dataset.station;
                if (DOM.telefericoStationSelect) {
                    DOM.telefericoStationSelect.value = stationVal;
                }
            };

            card.addEventListener('click', selectStation);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectStation();
                }
            });
        });
    }

    // 7.2 Conexión de Botones del Modal de Factura Oficial
    if (DOM.invoiceCloseBtn) {
        DOM.invoiceCloseBtn.addEventListener('click', cerrarModalFactura);
    }
    if (DOM.invoicePrintBtn) {
        DOM.invoicePrintBtn.addEventListener('click', imprimirFactura);
    }
    if (DOM.invoiceDownloadPngBtn) {
        DOM.invoiceDownloadPngBtn.addEventListener('click', descargarFacturaImagen);
    }
    if (DOM.btnFormatA4) {
        DOM.btnFormatA4.addEventListener('click', () => setInvoiceFormat('a4'));
    }
    if (DOM.btnFormatTicket) {
        DOM.btnFormatTicket.addEventListener('click', () => setInvoiceFormat('ticket'));
    }
    if (DOM.invoiceModal) {
        DOM.invoiceModal.addEventListener('click', (e) => {
            if (e.target === DOM.invoiceModal) {
                cerrarModalFactura();
            }
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
        const weeklyItem = listaProductos.find(p => p.id === 'prod-brownies') || {
            nombre: 'Brownies Artesanales Melcochosos',
            precio: 100,
            id: 'prod-brownies',
            desc: 'Puro chocolate con textura húmeda fudge y costra craquelada brillante.'
        };

        const replyHtml = `
            <p>✨ <strong>Postre Especial de Esta Semana:</strong></p>
            <p>Nuestro horno está dedicado a: <strong>${weeklyItem.nombre}</strong> (RD$ ${weeklyItem.precio} c/u). Horneado fresco por lotes para entregar este <strong>${domingoTexto}</strong> en Los Alcarrizos.</p>
            <p>Agrégalo directamente a tu pedido:</p>
            
            <div class="chat-product-card">
                <div class="chat-product-header">
                    <span class="chat-product-title">${weeklyItem.nombre}</span>
                    <span class="chat-product-price">RD$ ${weeklyItem.precio} c/u</span>
                </div>
                <p class="chat-product-desc">${weeklyItem.desc || 'Porción individual recién horneada para este domingo.'}</p>
                <button type="button" class="chat-btn-add" onclick="window.cardAddToCart('${weeklyItem.id}', this)">
                    <i data-lucide="shopping-basket" style="width: 14px; height: 14px;" aria-hidden="true"></i> Agregar Brownies (RD$ 100)
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
                    <br>• Estación 2: Las Toronjas (Cercana al Parque de las Toronjas)
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
            <p>🎂 <strong>Bizcochos & Pasteles Artesanales:</strong></p>
            <p>En nuestro menú oficial contamos con:</p>
            <ul style="padding-left: 1.2rem; margin: 0.4rem 0; font-size: 0.85rem; line-height: 1.5;">
                <li><strong>Bizcocho de Vainilla:</strong> RD$ 250 c/u</li>
                <li><strong>Bizcocho Milky Way (Caramelo):</strong> RD$ 280 c/u</li>
                <li><strong>Bizcocho Chocomatilda:</strong> RD$ 225 c/u</li>
                <li><strong>Carrot Cake:</strong> RD$ 220 c/u</li>
                <li><strong>Volteado de Piña:</strong> RD$ 140 c/u</li>
                <li><strong>Mini Cakes Personalizados:</strong> Desde RD$ 350</li>
            </ul>
            <div style="display: flex; gap: 0.5rem; flex-direction: column; margin-top: 0.6rem;">
                <a href="#menu" class="btn-secondary" style="padding: 0.55rem; text-align: center; font-size: 0.82rem;" onclick="window.expandFullMenu && window.expandFullMenu(); window.toggleReposteraChat(false)">Ver Todo el Menú</a>
                <a href="https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Chef%20Keyla,%20quisiera%20cotizar%20un%20bizcocho%20completo%20o%20pedido%20especial" target="_blank" rel="noopener noreferrer" class="btn-hero-whatsapp" style="padding: 0.55rem; font-size: 0.82rem; justify-content: center;">Coordinar por WhatsApp (809-442-8442)</a>
            </div>
        `;
        renderReposteraMessage('bot', replyHtml);
    } else if (key === 'carrito') {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        const totalDOP = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

        if (totalItems === 0) {
            const replyHtml = `
                <p>🛒 <strong>Tu carrito actualmente está vacío.</strong></p>
                <p>¿Deseas pedir el postre de la semana o consultar el menú completo de postres artesanales?</p>
                <div style="display: flex; gap: 0.45rem; flex-wrap: wrap; margin-top: 0.5rem;">
                    <button type="button" class="repostera-chip" onclick="window.handleReposteraQuickAction('semana')">✨ Postre de la Semana</button>
                    <a href="#menu" class="repostera-chip" onclick="window.expandFullMenu && window.expandFullMenu(); window.toggleReposteraChat(false)">🍰 Ver Menú Completo</a>
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
            txt += ` Deseo hacer una consulta sobre el menú de postres artesanales.`;
        }
        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(txt)}`;

        const replyHtml = `
            <p>💬 <strong>¡Con mucho gusto te atiendo en WhatsApp!</strong></p>
            <p>Teléfono: <strong>(809) 442-8442</strong></p>
            <p>Haz clic abajo para abrir el chat directo:</p>
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-hero-whatsapp" style="padding: 0.65rem; font-size: 0.84rem; justify-content: center; margin-top: 0.4rem;">
                <i data-lucide="message-circle" style="width: 16px; height: 16px;" aria-hidden="true"></i> Abrir WhatsApp (809-442-8442)
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
            <p>✨ <strong>Brownies Artesanales Melcochosos:</strong></p>
            <p>Horneados con chocolate puro, textura fudge húmeda y corteza brillante.</p>
            <p>• <strong>Porción individual:</strong> RD$ 100 c/u<br>• <strong>Caja degustación 4x:</strong> RD$ 400</p>
            <button type="button" class="chat-btn-add" style="margin-top: 0.3rem;" onclick="window.cardAddToCart('prod-brownies', this)">
                <i data-lucide="shopping-basket" style="width: 14px; height: 14px;" aria-hidden="true"></i> Pedir Brownie (RD$ 100)
            </button>
        `);
    } else if (q.includes('pastiseta') || q.includes('galleta')) {
        renderReposteraMessage('bot', `
            <p>🌸 <strong>Pastisetas Artesanales:</strong></p>
            <p>Finas galletas de mantequilla pura en forma de flor con corazón de jalea dulce. Precio: <strong>RD$ 160 c/u</strong> (pedido mínimo: 3 unidades).</p>
            <button type="button" class="chat-btn-add" style="margin-top: 0.3rem;" onclick="window.cardAddToCart('prod-pastisetas', this)">
                <i data-lucide="shopping-basket" style="width: 14px; height: 14px;" aria-hidden="true"></i> Agregar 3 Pastisetas (Mín. 3 • RD$ 480)
            </button>
        `);
    } else if (q.includes('alfajor')) {
        renderReposteraMessage('bot', `
            <p>✨ <strong>Alfajores de Dulce de Leche:</strong></p>
            <p>Tapas delicadas de maicena rellenas con abundante dulce de leche criollo artesanal y azúcar glas. Precio: <strong>RD$ 130 c/u</strong> (pedido mínimo: 3 unidades).</p>
            <button type="button" class="chat-btn-add" style="margin-top: 0.3rem;" onclick="window.cardAddToCart('prod-alfajores', this)">
                <i data-lucide="shopping-basket" style="width: 14px; height: 14px;" aria-hidden="true"></i> Agregar 3 Alfajores (Mín. 3 • RD$ 390)
            </button>
        `);
    } else if (q.includes('tres leches') || q.includes('leche')) {
        renderReposteraMessage('bot', `
            <p>🥛 <strong>Variedades de Tres Leches (Mín. 3 u.):</strong></p>
            <p>• <strong>Tres Leches Tradicional:</strong> RD$ 130 c/u<br>• <strong>Tres Leches de Coco:</strong> RD$ 150 c/u<br>• <strong>Tres Leches de Chocolate:</strong> RD$ 190 c/u</p>
            <button type="button" class="chat-btn-add" style="margin-top: 0.3rem;" onclick="window.cardAddToCart('prod-tres-leches-tradicional', this)">
                <i data-lucide="shopping-basket" style="width: 14px; height: 14px;" aria-hidden="true"></i> Agregar 3 Tres Leches (Mín. 3 • RD$ 390)
            </button>
        `);
    } else if (q.includes('flan')) {
        renderReposteraMessage('bot', `
            <p>🍮 <strong>Flan Tradicional (Porción):</strong></p>
            <p>Súper cremoso y sedoso, bañado en caramelo líquido rubio. Precio: <strong>RD$ 200 c/u</strong> (pedido mínimo: 3 unidades).</p>
            <button type="button" class="chat-btn-add" style="margin-top: 0.3rem;" onclick="window.cardAddToCart('prod-flan', this)">
                <i data-lucide="shopping-basket" style="width: 14px; height: 14px;" aria-hidden="true"></i> Agregar 3 Flanes (Mín. 3 • RD$ 600)
            </button>
        `);
    } else if (q.includes('carrot') || q.includes('zanahoria')) {
        renderReposteraMessage('bot', `
            <p>🥕 <strong>Carrot Cake Especial:</strong></p>
            <p>Pastel húmedo de zanahoria fresca con nueces, canela y suave frosting de queso crema. Precio: <strong>RD$ 220 c/u</strong> (pedido mínimo: 3 porciones, o 1 si es pastel completo).</p>
            <button type="button" class="chat-btn-add" style="margin-top: 0.3rem;" onclick="window.cardAddToCart('prod-carrot-cake', this)">
                <i data-lucide="shopping-basket" style="width: 14px; height: 14px;" aria-hidden="true"></i> Agregar 3 Carrot Cakes (Mín. 3 • RD$ 660)
            </button>
        `);
    } else if (q.includes('teleferico') || q.includes('donde') || q.includes('ubicacion') || q.includes('direccion') || q.includes('entrega') || q.includes('alcarrizos') || q.includes('parada')) {
        renderReposteraMessage('bot', `
            <p>📍 <strong>Estamos en Los Alcarrizos, Santo Domingo Oeste</strong>.</p>
            <p>Nuestras entregas son los <strong>domingos</strong> en:</p>
            <p>• <strong>Gratis:</strong> En nuestro taller de Los Alcarrizos.<br>• <strong>DOP$ 50:</strong> En las estaciones 1 (Entrada Duarte), 2 (Las Toronjas), 3 (Puente Blanco) y 4 (Los Americanos).<br>• <strong>Delivery a Domicilio:</strong> Directo a tu puerta en tu sector.</p>
        `);
    } else if (q.includes('pastel') || q.includes('bizcocho') || q.includes('torta') || q.includes('milky') || q.includes('matilda') || q.includes('piña') || q.includes('pina')) {
        renderReposteraMessage('bot', `
            <p>🎂 <strong>Bizcochos y Pasteles Artesanales:</strong></p>
            <p>• <strong>Bizcocho de Vainilla:</strong> RD$ 250 c/u<br>• <strong>Bizcocho Milky Way (Caramelo):</strong> RD$ 280 c/u<br>• <strong>Bizcocho Chocomatilda:</strong> RD$ 225 c/u<br>• <strong>Volteado de Piña:</strong> RD$ 140 c/u<br>• <strong>Carrot Cake:</strong> RD$ 220 c/u</p>
            <p style="font-size: 0.8rem; color: var(--text-muted);"><em>Porciones del menú: mínimo 3 u. Pasteles completos o personalizados: desde 1 unidad.</em></p>
            <a href="https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Chef%20Keyla,%20quiero%20cotizar%20un%20bizcocho" target="_blank" rel="noopener noreferrer" class="btn-hero-whatsapp" style="padding: 0.55rem; font-size: 0.82rem; justify-content: center; margin-top: 0.3rem;">
                <i data-lucide="message-circle" style="width: 14px; height: 14px;" aria-hidden="true"></i> Coordinar por WhatsApp (809-442-8442)
            </a>
        `);
    } else if (q.includes('precio') || q.includes('costo') || q.includes('cuanto') || q.includes('vale') || q.includes('menu') || q.includes('menú')) {
        renderReposteraMessage('bot', `
            <p>💵 <strong>Menú Oficial de Postres Artesanales:</strong></p>
            <p>• <strong>Brownies (Semana - desde 1 u.):</strong> RD$ 100 c/u<br>
            • <strong>Pastisetas:</strong> RD$ 160 c/u<br>
            • <strong>Alfajores de dulce de leche:</strong> RD$ 130 c/u<br>
            • <strong>Tres leches tradicional:</strong> RD$ 130 c/u<br>
            • <strong>Tres leches de coco:</strong> RD$ 150 c/u<br>
            • <strong>Tres leches de chocolate:</strong> RD$ 190 c/u<br>
            • <strong>Flan (porción):</strong> RD$ 200 c/u<br>
            • <strong>Carrot cake:</strong> RD$ 220 c/u<br>
            • <strong>Bizcocho de vainilla:</strong> RD$ 250 c/u<br>
            • <strong>Bizcocho Milky Way:</strong> RD$ 280 c/u<br>
            • <strong>Bizcocho Chocomatilda:</strong> RD$ 225 c/u<br>
            • <strong>Volteado de piña (porción):</strong> RD$ 140 c/u</p>
            <p style="font-size: 0.82rem; color: var(--pink);"><em>📌 Otros postres del menú: mínimo 3 u. Pasteles completos/personalizados y Brownies (Semana): desde 1 unidad.</em></p>
        `);
    } else if (q.includes('pago') || q.includes('pagar') || q.includes('transferencia') || q.includes('banco') || q.includes('tarjeta') || q.includes('efectivo')) {
        renderReposteraMessage('bot', `
            <p>💳 <strong>Métodos de Pago Aceptados:</strong></p>
            <p>Aceptamos transferencias por <strong>Banco Popular, BHD y Banreservas</strong>, así como pago en <strong>efectivo</strong> al momento de retirar en el taller o contra entrega en Los Alcarrizos.</p>
        `);
    } else if (q.includes('gracias') || q.includes('ok') || q.includes('bien') || q.includes('excelente') || q.includes('perfecto')) {
        renderReposteraMessage('bot', `
            <p>¡A la orden siempre! 🥰 ¡Gracias por apoyar mi pequeño gran sueño! En KeyBakery horneamos con mucho amor para ti en Los Alcarrizos. Tel. 809-442-8442.</p>
        `);
    } else {
        renderReposteraMessage('bot', `
            <p>¡Hola! Con mucho gusto te asisto. 👩‍🍳 En KeyBakery preparamos deliciosos postres artesanales con amor y los mejores ingredientes.</p>
            <p>¿Qué te gustaría ver hoy? Puedes elegir una de las opciones:</p>
            <div style="display: flex; gap: 0.45rem; flex-wrap: wrap; margin-top: 0.5rem;">
                <button type="button" class="repostera-chip" onclick="window.handleReposteraQuickAction('semana')">✨ Postre de la Semana</button>
                <button type="button" class="repostera-chip" onclick="window.handleReposteraQuickAction('pastel')">🎂 Bizcochos & Pasteles</button>
                <button type="button" class="repostera-chip" onclick="window.handleReposteraQuickAction('teleferico')">🚡 Teleférico & Zonas</button>
                <button type="button" class="repostera-chip" onclick="window.handleReposteraQuickAction('whatsapp')">💬 WhatsApp 809-442-8442</button>
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
