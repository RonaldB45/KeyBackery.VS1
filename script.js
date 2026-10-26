// --- 1. CONFIGURACIÓN Y FIREBASE ---
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const provider = new GoogleAuthProvider();

const WHATSAPP_NUMBER = "18090000000"; 
const MIN_PURCHASE_DELIVERY = 600;
const METRO_DELIVERY_FEE = 100;
const ADMIN_EMAIL = "ronalbatista577@gmail.com";

const defaultProducts = [
    {
        nombre: "Pastel de Bodas Clásico",
        precio: 2500,
        imagen: "https://images.unsplash.com/photo-1535254973040-607b474cb8c2?auto=format&fit=crop&w=800&q=80",
        stock: 10,
        activo: true
    },
    {
        nombre: "Cupcakes Red Velvet (6 uds)",
        precio: 450,
        imagen: "https://images.unsplash.com/photo-1614707267537-b85af00c4b81?auto=format&fit=crop&w=800&q=80",
        stock: 50,
        activo: true
    },
    {
        nombre: "Bocadillos de Queso (12 uds)",
        precio: 180,
        imagen: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80",
        stock: 100,
        activo: true
    },
    {
        nombre: "Tarta de Frutas Tropicales",
        precio: 1200,
        imagen: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80",
        stock: 15,
        activo: true
    },
    {
        nombre: "Pastel de Chocolate Intenso",
        precio: 1800,
        imagen: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
        stock: 12,
        activo: true
    },
    {
        nombre: "Mini Quiches Variados (8 uds)",
        precio: 320,
        imagen: "https://images.unsplash.com/photo-1623334834998-a48bf9f04439?auto=format&fit=crop&w=800&q=80",
        stock: 40,
        activo: true
    },
    {
        nombre: "Bizcocho Dominicano de Suspiro",
        precio: 950,
        imagen: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80",
        stock: 20,
        activo: true
    },
    {
        nombre: "Cheesecake de Guayaba Real",
        precio: 1100,
        imagen: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
        stock: 18,
        activo: true
    },
    {
        nombre: "Croissants de Mantequilla (4 uds)",
        precio: 240,
        imagen: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
        stock: 30,
        activo: true
    },
    {
        nombre: "Mousse de Chinola Silvestre",
        precio: 350,
        imagen: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=800&q=80",
        stock: 25,
        activo: true
    },
    {
        nombre: "Pudin de Pan con Pasas",
        precio: 500,
        imagen: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80",
        stock: 15,
        activo: true
    },
    {
        nombre: "Catibías Gourmet (10 uds)",
        precio: 400,
        imagen: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
        stock: 60,
        activo: true
    }
];

let listaProductos = [...defaultProducts];
let pedidos = [];
let user = null;
let isAdmin = true;

let carrito = JSON.parse(localStorage.getItem('keybakery_cart')) || [];

// --- 2. ELEMENTOS DEL DOM (MODULARIZADO) ---
let DOM = {};

function inicializarDOM() {
    DOM = {
        cartSidebar: document.getElementById('cart-sidebar'),
        openCartBtn: document.getElementById('open-cart'),
        closeCartBtn: document.getElementById('close-cart'),
        cartItemsContainer: document.getElementById('cart-items'),
        cartTotalSpan: document.getElementById('cart-total'),
        cartCountSpan: document.getElementById('cart-count'),
        paymentModal: document.getElementById('payment-modal'),
        checkoutBtn: document.getElementById('checkout-btn'),
        productsContainer: document.getElementById('products-container'),
        upsellContainer: document.getElementById('upsell-products'),
        paymentForm: document.getElementById('payment-form'),
        modalTotal: document.getElementById('modal-total'),
        stepUpsell: document.getElementById('step-upsell'),
        stepPayment: document.getElementById('step-payment'),
        successMessage: document.getElementById('success-message'),
        goToPaymentBtn: document.getElementById('go-to-payment'),
        closePaymentBtn: document.getElementById('close-payment'),
        closeSuccessBtn: document.getElementById('close-success'),
        mobileOpenCartBtn: document.getElementById('mobile-open-cart'),
        mobileCartCount: document.querySelector('.mobile-cart-count'),
        contactForm: document.getElementById('contact-form'),
        deliveryMethods: document.getElementsByName('delivery-method'),
        deliveryWarning: document.getElementById('delivery-warning'),
        customerAddress: document.getElementById('customer-address'),
        deliveryNotice: document.getElementById('delivery-notice'),
        downloadInvoiceBtn: document.getElementById('download-invoice'),
        contactPhone: document.getElementById('contact-phone'),
        customerPhone: document.getElementById('customer-phone'),
        adminPanelModal: document.getElementById('admin-panel-modal'),
        adminPanelBtn: document.getElementById('admin-panel-btn'),
        closeAdminBtn: document.getElementById('close-admin'),
        adminInventoryTab: document.getElementById('admin-inventory-tab'),
        adminOrdersTab: document.getElementById('admin-orders-tab'),
        adminProductsList: document.getElementById('admin-products-list'),
        adminOrdersList: document.getElementById('admin-orders-list'),
        adminTabs: document.querySelectorAll('.admin-tab'),
        addProductBtn: document.getElementById('add-product-btn'),
        resetCatalogBtn: document.getElementById('reset-catalog-btn')
    };
}

let ultimoPedido = null;

// --- 3. LÓGICA DEL CARRITO ---
window.cambiarCant = function(id, delta) {
    const item = carrito.find(i => i.id === id);
    if (item) {
        item.cantidad += delta;
        if (item.cantidad <= 0) carrito = carrito.filter(i => i.id !== id);
    }
    actualizarCarrito();
}

window.agregarAlCarrito = function(id, event) {
    const prod = listaProductos.find(p => p.id === id);
    const existe = carrito.find(i => i.id === id);
    if (existe) existe.cantidad++;
    else carrito.push({ ...prod, cantidad: 1 });
    actualizarCarrito();
    
    // Feedback visual en el botón
    const btn = event?.target?.closest('.btn-add') || event?.target?.closest('.btn-add-sm');
    if (btn) {
        const originalText = btn.innerText;
        btn.innerText = "¡Agregado!";
        btn.classList.add('btn-success');
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('btn-success');
        }, 1500);
    }
}

function actualizarCarrito() {
    DOM.cartItemsContainer.innerHTML = '';
    let total = 0;
    let itemsContador = 0;

    if (carrito.length === 0) {
        DOM.cartItemsContainer.innerHTML = `
            <div class="cart-empty-state">
                <i data-lucide="shopping-basket" style="width: 64px; height: 64px; opacity: 0.2;"></i>
                <p>Tu carrito está vacío</p>
                <a href="#menu" class="btn-secondary" style="margin-top: 1rem;">Ver Productos</a>
            </div>`;
        if (window.lucide) lucide.createIcons();
    } else {
        carrito.forEach((item, index) => {
            total += item.precio * item.cantidad;
            itemsContador += item.cantidad;
            DOM.cartItemsContainer.innerHTML += `
                <div class="cart-item" style="animation-delay: ${index * 0.1}s">
                    <img src="${item.imagen}" class="cart-item-img" alt="${item.nombre}" referrerPolicy="no-referrer">
                    <div class="cart-item-info">
                        <p class="cart-item-title">${item.nombre}</p>
                        <p class="cart-item-price">DOP$ ${item.precio.toLocaleString()}</p>
                        <div class="cart-item-controls">
                            <button class="btn-qty" onclick="cambiarCant('${item.id}', -1)">-</button>
                            <span class="cart-item-qty">${item.cantidad}</span>
                            <button class="btn-qty" onclick="cambiarCant('${item.id}', 1)">+</button>
                        </div>
                    </div>
                </div>`;
        });
    }

    DOM.cartTotalSpan.innerText = `DOP$ ${total.toLocaleString()}`;
    DOM.cartCountSpan.innerText = itemsContador;
    
    if (DOM.mobileCartCount) {
        DOM.mobileCartCount.innerText = itemsContador;
    }
    
    // Animación de feedback en el contador
    DOM.cartCountSpan.classList.remove('bounce');
    void DOM.cartCountSpan.offsetWidth; // Trigger reflow
    DOM.cartCountSpan.classList.add('bounce');

    localStorage.setItem('keybakery_cart', JSON.stringify(carrito));
}

// --- 4. RENDERIZAR MENÚ ---
function renderizarMenu() {
    if (!DOM.productsContainer) {
        console.error("No se encontró el contenedor de productos");
        return;
    }
    
    DOM.productsContainer.innerHTML = ''; 
    
    if (listaProductos.length === 0) {
        DOM.productsContainer.innerHTML = '<p class="text-center w-full">No hay productos disponibles en este momento.</p>';
        return;
    }

    listaProductos.filter(p => p.activo !== false).forEach((p, index) => {
        DOM.productsContainer.innerHTML += `
            <div class="product-card" style="animation-delay: ${index * 0.1}s">
                <div class="product-image-wrapper">
                    <img src="${p.imagen}" alt="${p.nombre}" referrerPolicy="no-referrer">
                </div>
                <div class="product-info">
                    <h3>${p.nombre}</h3>
                    <div class="product-meta">
                        <span class="price">DOP$ ${p.precio.toLocaleString()}</span>
                        <button class="btn-add" onclick="agregarAlCarrito('${p.id}', event)">Agregar</button>
                    </div>
                </div>
            </div>`;
    });
}

// --- 5. SCROLL REVEAL LOGIC ---
function initScrollReveal() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// --- 6. MANEJO DE MODAL Y VENTAS (UPSELLING) ---
window.cargarSugerencias = function() {
    if (!DOM.upsellContainer) return;
    DOM.upsellContainer.innerHTML = '';
    
    const sugeridos = listaProductos
        .filter(p => p.activo !== false && !carrito.find(item => item.id === p.id))
        .slice(0, 2);

    sugeridos.forEach(p => {
        DOM.upsellContainer.innerHTML += `
            <div class="upsell-item">
                <img src="${p.imagen}" style="width:60px; height:60px; border-radius:10px; object-fit:cover;" alt="${p.nombre}" referrerPolicy="no-referrer">
                <div>
                    <p class="font-bold" style="font-size:0.9rem; margin:0;">${p.nombre}</p>
                    <button class="btn-add-sm" onclick="agregarAlCarrito('${p.id}', event); cargarSugerencias();">
                        + Añadir (DOP$ ${p.precio})
                    </button>
                </div>
            </div>`;
    });
}

// --- 7. EVENTOS Y PANEL DE ADMINISTRACIÓN ---

function abrirAdminPanel() {
    if (DOM.adminPanelModal) {
        DOM.adminPanelModal.style.display = 'flex';
        renderAdminInventory();
        renderAdminOrders();
    }
}

function renderAdminInventory() {
    if (!DOM.adminProductsList) return;
    DOM.adminProductsList.innerHTML = '';
    
    if (listaProductos.length === 0) {
        DOM.adminProductsList.innerHTML = '<p class="text-center opacity-60 col-span-full py-8">No hay productos en inventario.</p>';
        return;
    }

    listaProductos.forEach(p => {
        const card = document.createElement('div');
        card.className = 'admin-product-card';
        card.innerHTML = `
            <img src="${p.imagen}" alt="${p.nombre}" referrerPolicy="no-referrer" onerror="this.src='https://images.unsplash.com/photo-1535254973040-607b474cb8c2?auto=format&fit=crop&w=800&q=80'">
            <label style="font-size: 0.75rem; font-weight: 700; color: #666; margin-bottom: 2px; display: block;">Nombre:</label>
            <input type="text" value="${p.nombre}" onchange="updateProduct('${p.id}', {nombre: this.value})">
            
            <label style="font-size: 0.75rem; font-weight: 700; color: #666; margin-bottom: 2px; display: block;">Precio (DOP):</label>
            <input type="number" value="${p.precio}" onchange="updateProduct('${p.id}', {precio: Number(this.value)})">
            
            <label style="font-size: 0.75rem; font-weight: 700; color: #666; margin-bottom: 2px; display: block;">URL de Imagen:</label>
            <input type="text" value="${p.imagen}" onchange="updateProduct('${p.id}', {imagen: this.value})">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #eee;">
                <button onclick="deleteProduct('${p.id}')" style="color: #ff4d4d; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; gap: 0.3rem; cursor: pointer;">
                    <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i> Eliminar
                </button>
                <label style="font-size: 0.75rem; font-weight: 700; color: #555; display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                    ACTIVO <input type="checkbox" ${p.activo !== false ? 'checked' : ''} onchange="updateProduct('${p.id}', {activo: this.checked})">
                </label>
            </div>
        `;
        DOM.adminProductsList.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

function renderAdminOrders() {
    if (!DOM.adminOrdersList) return;
    DOM.adminOrdersList.innerHTML = '';
    if (pedidos.length === 0) {
        DOM.adminOrdersList.innerHTML = '<p class="text-center opacity-50 py-10">No hay pedidos registrados aún.</p>';
        return;
    }
    pedidos.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'admin-order-card';
        let fecha = 'Fecha reciente';
        if (pedido.fecha?.toDate) {
            fecha = pedido.fecha.toDate().toLocaleString('es-DO');
        } else if (pedido.fecha) {
            fecha = new Date(pedido.fecha).toLocaleString('es-DO');
        }
        
        const items = Array.isArray(pedido.items) ? pedido.items : [];

        card.innerHTML = `
            <div class="admin-order-header">
                <div>
                    <h4 style="margin:0; font-size: 1.1rem; color: #1a1a1a;">${pedido.cliente || 'Cliente Anónimo'}</h4>
                    <p style="font-size:0.75rem; color:#888; margin:0.2rem 0 0 0;">📅 ${fecha}</p>
                </div>
                <div style="text-align: right;">
                    <span class="status-badge status-${pedido.status || 'pending'}">${pedido.status === 'completed' ? 'Completado' : pedido.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}</span>
                    <p style="font-weight:700; color:var(--gold); margin-top:0.35rem; font-size: 1.1rem;">DOP$ ${(pedido.total || 0).toLocaleString()}</p>
                </div>
            </div>
            <div style="background:#fdfcf9; border: 1px solid #f0ede6; padding:0.85rem; border-radius:12px; font-size:0.85rem; margin-top: 0.75rem;">
                ${items.map(i => `
                    <div style="display:flex; justify-content:space-between; padding: 0.25rem 0; border-bottom: 1px dashed #f0ede6;">
                        <span><strong>${i.nombre}</strong> (x${i.cantidad})</span>
                        <span style="color: #666;">DOP$ ${((i.precio || 0) * (i.cantidad || 1)).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label style="font-size: 0.8rem; font-weight: 700; color: #555;">Estado:</label>
                    <select onchange="updateOrderStatus('${pedido.id}', this.value)" style="font-size:0.8rem; padding:0.35rem 0.6rem; border-radius:8px; border:1px solid #ccc; background: #fff; font-weight: 600;">
                        <option value="pending" ${pedido.status === 'pending' ? 'selected' : ''}>⏳ Pendiente</option>
                        <option value="completed" ${pedido.status === 'completed' ? 'selected' : ''}>✅ Completado</option>
                        <option value="cancelled" ${pedido.status === 'cancelled' ? 'selected' : ''}>❌ Cancelado</option>
                    </select>
                </div>
                <button onclick="deleteOrder('${pedido.id}')" style="color:#ff4d4d; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                    <i data-lucide="trash-2" style="width:16px;"></i> Eliminar Orden
                </button>
            </div>
        `;
        DOM.adminOrdersList.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

window.updateProduct = async (id, data) => {
    try {
        await updateDoc(doc(db, "products", id), data);
    } catch (error) {
        console.error("Error updating product in Firestore:", error);
        // Fallback local update
        listaProductos = listaProductos.map(p => p.id === id ? { ...p, ...data } : p);
        renderizarMenu();
        renderAdminInventory();
    }
};

window.deleteProduct = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
        try {
            await deleteDoc(doc(db, "products", id));
        } catch (error) {
            console.error("Error deleting product:", error);
            listaProductos = listaProductos.filter(p => p.id !== id);
            renderizarMenu();
            renderAdminInventory();
        }
    }
};

window.updateOrderStatus = async (id, status) => {
    try {
        await updateDoc(doc(db, "orders", id), { status });
    } catch (error) {
        console.error("Error updating order status:", error);
        pedidos = pedidos.map(o => o.id === id ? { ...o, status } : o);
        renderAdminOrders();
    }
};

window.deleteOrder = async (id) => {
    if (confirm("¿Eliminar este pedido permanentemente?")) {
        try {
            await deleteDoc(doc(db, "orders", id));
        } catch (error) {
            console.error("Error deleting order:", error);
            pedidos = pedidos.filter(o => o.id !== id);
            renderAdminOrders();
        }
    }
};

window.resetCatalog = async function() {
    try {
        if (DOM.resetCatalogBtn) {
            DOM.resetCatalogBtn.innerHTML = `<span>Restableciendo catálogo...</span>`;
            DOM.resetCatalogBtn.disabled = true;
        }

        // Delete existing products from Firestore
        const existingDocs = await getDocs(collection(db, "products"));
        for (const docSnap of existingDocs.docs) {
            await deleteDoc(doc(db, "products", docSnap.id));
        }

        // Seed with authentic Dominican pastry products
        for (const prod of defaultProducts) {
            await addDoc(collection(db, "products"), prod);
        }

        alert("¡Catálogo e imágenes restablecidos exitosamente con los postres oficiales de KeyBakery!");
    } catch (err) {
        console.error("Error al restablecer catálogo en Firestore:", err);
        listaProductos = defaultProducts.map((p, idx) => ({ id: 'local_' + idx, ...p }));
        renderizarMenu();
        renderAdminInventory();
        alert("El catálogo ha sido actualizado en la pantalla.");
    } finally {
        if (DOM.resetCatalogBtn) {
            DOM.resetCatalogBtn.disabled = false;
            DOM.resetCatalogBtn.innerHTML = `<i data-lucide="refresh-cw"></i> Restablecer Fotos y Catálogo`;
            if (window.lucide) lucide.createIcons();
        }
    }
};

function init() {
    inicializarDOM();

    // 1. Listen for Products
    try {
        const qProds = query(collection(db, "products"), orderBy("nombre"));
        onSnapshot(qProds, (snapshot) => {
            if (snapshot.empty) {
                seedProducts();
                return;
            }
            const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Auto-heal: If fast food or incorrect Chinola picture detected, fix it
            const hasFastFood = prods.some(p => p.nombre?.includes("Hamburguesa") || p.nombre?.includes("Pizza"));
            if (hasFastFood) {
                console.log("Detectados datos de prueba antiguos, restableciendo catálogo oficial...");
                resetCatalog();
                return;
            }

            const chinolaDoc = snapshot.docs.find(d => d.data().nombre?.toLowerCase().includes("chinola"));
            if (chinolaDoc && (!chinolaDoc.data().imagen || !chinolaDoc.data().imagen.includes("photo-1590080875515"))) {
                console.log("Restableciendo foto correcta del Mousse de Chinola Silvestre...");
                updateDoc(doc(db, "products", chinolaDoc.id), {
                    imagen: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=800&q=80"
                }).catch(console.error);
            }

            listaProductos = prods;
            renderizarMenu();
            if (DOM.adminPanelModal && DOM.adminPanelModal.style.display === 'flex') {
                renderAdminInventory();
            }
        }, (error) => {
            console.warn("Firestore products warning, using local catalog:", error);
            listaProductos = defaultProducts.map((p, idx) => ({ id: 'fallback_' + idx, ...p }));
            renderizarMenu();
        });
    } catch (e) {
        console.warn("Error starting products listener:", e);
        listaProductos = defaultProducts.map((p, idx) => ({ id: 'local_' + idx, ...p }));
        renderizarMenu();
    }

    // 2. Listen for Orders (No registration required!)
    try {
        const qOrders = query(collection(db, "orders"), orderBy("fecha", "desc"));
        onSnapshot(qOrders, (snapshot) => {
            pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (DOM.adminPanelModal && DOM.adminPanelModal.style.display === 'flex') {
                renderAdminOrders();
            }
        }, (error) => {
            console.warn("Orders subscription notice:", error);
        });
    } catch (e) {
        console.warn("Error starting orders listener:", e);
    }

    // 3. Admin Events (Direct access from footer!)
    if (DOM.adminPanelBtn) {
        DOM.adminPanelBtn.onclick = (e) => {
            e.preventDefault();
            abrirAdminPanel();
        };
    }

    if (DOM.closeAdminBtn) {
        DOM.closeAdminBtn.onclick = () => {
            DOM.adminPanelModal.style.display = 'none';
        };
    }

    if (DOM.resetCatalogBtn) {
        DOM.resetCatalogBtn.onclick = async () => {
            if (confirm("¿Deseas restablecer todas las fotos y postres al catálogo oficial de KeyBakery?")) {
                await resetCatalog();
            }
        };
    }
    
    if (DOM.adminTabs) {
        DOM.adminTabs.forEach(tab => {
            tab.onclick = () => {
                DOM.adminTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.tab;
                if (target === 'inventory') {
                    DOM.adminInventoryTab.classList.remove('hidden');
                    DOM.adminOrdersTab.classList.add('hidden');
                } else {
                    DOM.adminInventoryTab.classList.add('hidden');
                    DOM.adminOrdersTab.classList.remove('hidden');
                }
            };
        });
    }

    if (DOM.addProductBtn) {
        DOM.addProductBtn.onclick = async () => {
            const nombre = prompt("Nombre del postre / producto:");
            if (!nombre) return;
            const precio = Number(prompt("Precio en DOP (ej: 450):"));
            if (isNaN(precio) || precio <= 0) return;
            const imagen = prompt("URL de la imagen (Unsplash o enlace directo):", "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80");
            if (!imagen) return;
            
            try {
                await addDoc(collection(db, "products"), { nombre, precio, imagen, activo: true, stock: 10 });
            } catch (err) {
                console.error("Error creating product:", err);
                listaProductos.push({ id: 'local_' + Date.now(), nombre, precio, imagen, activo: true, stock: 10 });
                renderizarMenu();
                renderAdminInventory();
            }
        };
    }

    renderizarMenu();
    actualizarCarrito();
    initScrollReveal();

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        const scrollTopBtn = document.getElementById('scroll-top');
        
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        if (scrollTopBtn) {
            if (window.scrollY > 500) scrollTopBtn.classList.add('visible');
            else scrollTopBtn.classList.remove('visible');
        }
    });

    // Scroll to top
    const scrollTopBtn = document.getElementById('scroll-top');
    if (scrollTopBtn) {
        scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Abrir Carrito
    if (DOM.openCartBtn) {
        DOM.openCartBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            DOM.cartSidebar.classList.add('open');
        };
    }

    if (DOM.mobileOpenCartBtn) {
        DOM.mobileOpenCartBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            DOM.cartSidebar.classList.add('open');
        };
    }

    // Cerrar Carrito
    if (DOM.closeCartBtn) {
        DOM.closeCartBtn.onclick = () => DOM.cartSidebar.classList.remove('open');
    }

    // Abrir Modal de Pago
    if (DOM.checkoutBtn) {
        DOM.checkoutBtn.addEventListener('click', () => {
            const total = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
            
            // Configurar opciones de entrega según el total
            const metroRadio = Array.from(DOM.deliveryMethods).find(r => r.value === 'metro');
            const deliveryRadio = Array.from(DOM.deliveryMethods).find(r => r.value === 'delivery');
            const pickupRadio = Array.from(DOM.deliveryMethods).find(r => r.value === 'pickup');

            if (total < MIN_PURCHASE_DELIVERY) {
                // Deshabilitar opciones de envío si es menor al mínimo
                metroRadio.disabled = true;
                deliveryRadio.disabled = true;
                metroRadio.parentElement.style.opacity = "0.5";
                deliveryRadio.parentElement.style.opacity = "0.5";
                metroRadio.parentElement.title = `Mínimo DOP$ ${MIN_PURCHASE_DELIVERY} para envío`;
                deliveryRadio.parentElement.title = `Mínimo DOP$ ${MIN_PURCHASE_DELIVERY} para envío`;
                pickupRadio.checked = true;
                
                if (DOM.deliveryNotice) DOM.deliveryNotice.classList.remove('hidden');
                
                // Forzar evento change para ocultar campos de dirección
                pickupRadio.dispatchEvent(new Event('change'));
            } else {
                // Habilitar todas las opciones
                metroRadio.disabled = false;
                deliveryRadio.disabled = false;
                metroRadio.parentElement.style.opacity = "1";
                deliveryRadio.parentElement.style.opacity = "1";
                metroRadio.parentElement.removeAttribute('title');
                deliveryRadio.parentElement.removeAttribute('title');
                
                if (DOM.deliveryNotice) DOM.deliveryNotice.classList.add('hidden');
            }

            DOM.stepUpsell.classList.remove('hidden');
            DOM.stepPayment.classList.add('hidden');
            DOM.successMessage.classList.add('hidden');
            
            cargarSugerencias();
            DOM.paymentModal.style.display = 'flex';
            DOM.cartSidebar.classList.remove('open');
        });
    }

    // Manejo de métodos de entrega
    if (DOM.deliveryMethods) {
        DOM.deliveryMethods.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const method = e.target.value;
                if (method === 'pickup') {
                    DOM.customerAddress.classList.add('hidden');
                    DOM.deliveryWarning.classList.add('hidden');
                    DOM.customerAddress.required = false;
                } else if (method === 'metro') {
                    DOM.customerAddress.classList.remove('hidden');
                    DOM.deliveryWarning.classList.add('hidden');
                    DOM.customerAddress.placeholder = "Indica la parada del metro donde deseas recibir";
                    DOM.customerAddress.required = true;
                } else {
                    DOM.customerAddress.classList.remove('hidden');
                    DOM.deliveryWarning.classList.remove('hidden');
                    DOM.customerAddress.placeholder = "Dirección completa de entrega";
                    DOM.customerAddress.required = true;
                }
            });
        });
    }

    // Continuar al formulario de pago
    if (DOM.goToPaymentBtn) {
        DOM.goToPaymentBtn.addEventListener('click', () => {
            const total = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
            DOM.modalTotal.innerText = `DOP$ ${total.toLocaleString()}`;
            DOM.stepUpsell.classList.add('hidden');
            DOM.stepPayment.classList.remove('hidden');
        });
    }

    // Cierre del Modal de Pago
    if (DOM.closePaymentBtn) {
        DOM.closePaymentBtn.onclick = () => DOM.paymentModal.style.display = 'none';
    }

    // Botón de éxito
    if (DOM.closeSuccessBtn) {
        DOM.closeSuccessBtn.onclick = () => {
            DOM.paymentModal.style.display = 'none';
            location.reload();
        };
    }

    // Envío del Formulario (WhatsApp)
    if (DOM.paymentForm) {
        DOM.paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('card-name').value;
            const telefono = document.getElementById('customer-phone').value;
            const direccion = document.getElementById('customer-address').value;
            const metodoEntrega = Array.from(DOM.deliveryMethods).find(r => r.checked).value;
            
            const subtotal = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
            let costoEnvio = 0;
            let metodoTexto = "";

            if (metodoEntrega === 'pickup') {
                metodoTexto = "Recoger en Taller (Gratis)";
            } else if (metodoEntrega === 'metro') {
                costoEnvio = METRO_DELIVERY_FEE;
                metodoTexto = `Parada del Metro (DOP$ ${METRO_DELIVERY_FEE})`;
            } else {
                metodoTexto = "Envío a Domicilio (Costo a acordar)";
            }

            const totalFinal = subtotal + costoEnvio;

            // Construir el mensaje de WhatsApp
            let mensaje = `*NUEVO PEDIDO - KEYBAKERY*\n\n`;
            mensaje += `*Cliente:* ${nombre}\n`;
            mensaje += `*Teléfono:* ${telefono}\n`;
            mensaje += `*Método:* ${metodoTexto}\n`;
            if (direccion) mensaje += `*Referencia/Dirección:* ${direccion}\n`;
            
            mensaje += `\n*DETALLE DEL PEDIDO:*\n`;
            carrito.forEach(item => {
                mensaje += `- ${item.cantidad}x ${item.nombre} (DOP$ ${(item.precio * item.cantidad).toLocaleString()})\n`;
            });

            mensaje += `\n*Subtotal: DOP$ ${subtotal.toLocaleString()}*`;
            if (costoEnvio > 0) mensaje += `\n*Envío: DOP$ ${costoEnvio.toLocaleString()}*`;
            mensaje += `\n*TOTAL FINAL: DOP$ ${totalFinal.toLocaleString()}*`;

            // Save to Firestore
            addDoc(collection(db, "orders"), {
                cliente: nombre,
                total: totalFinal,
                items: carrito.map(i => ({ id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad })),
                fecha: serverTimestamp(),
                status: 'pending'
            }).catch(err => console.error("Error saving order to Firestore:", err));

            // Guardar datos para la factura
            ultimoPedido = {
                nombre,
                telefono,
                direccion,
                metodoTexto,
                items: [...carrito],
                subtotal,
                costoEnvio,
                totalFinal,
                fecha: new Date().toLocaleString()
            };

            // Enviar factura por email (Resend)
            fetch('/api/send-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pedido: ultimoPedido })
            }).catch(err => console.error("Error al enviar factura por email:", err));

            // Codificar para URL
            const mensajeCodificado = encodeURIComponent(mensaje);
            const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeCodificado}`;

            // Mostrar éxito y redirigir con un pequeño retraso
            DOM.stepPayment.classList.add('hidden');
            DOM.successMessage.classList.remove('hidden');
            
            // Pequeño retraso para que el usuario lea el aviso de la factura
            setTimeout(() => {
                window.open(urlWhatsApp, '_blank');
            }, 1500);

            carrito = [];
            actualizarCarrito();
        });
    }

    // Envío del Formulario de Contacto (WhatsApp)
    if (DOM.contactForm) {
        DOM.contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('contact-name').value;
            const telefono = document.getElementById('contact-phone').value;
            const mensajeTexto = document.getElementById('contact-message').value;

            let mensaje = `*MENSAJE DE CONTACTO - KEYBAKERY*\n\n`;
            mensaje += `*Nombre:* ${nombre}\n`;
            mensaje += `*Teléfono:* ${telefono}\n`;
            mensaje += `\n*Mensaje:*\n${mensajeTexto}`;

            const mensajeCodificado = encodeURIComponent(mensaje);
            const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeCodificado}`;

            window.open(urlWhatsApp, '_blank');
            DOM.contactForm.reset();
        });
    }

    // Descargar Factura
    if (DOM.downloadInvoiceBtn) {
        DOM.downloadInvoiceBtn.onclick = () => descargarFactura();
    }

    // Formateo de teléfonos
    [DOM.contactPhone, DOM.customerPhone].forEach(input => {
        if (input) {
            input.addEventListener('input', (e) => {
                const inputVal = e.target.value.replace(/\D/g, ''); // Solo números
                let formatted = '';
                
                if (inputVal.length > 0) {
                    formatted = inputVal.substring(0, 3);
                    if (inputVal.length > 3) {
                        formatted += '-' + inputVal.substring(3, 6);
                    }
                    if (inputVal.length > 6) {
                        formatted += '-' + inputVal.substring(6, 10);
                    }
                }
                
                e.target.value = formatted;
            });
        }
    });

    // Manejo de clics global
    document.addEventListener('click', (e) => {
        if (!DOM.cartSidebar || !DOM.paymentModal || !DOM.openCartBtn) return;

        if (DOM.paymentModal.style.display === 'flex') {
            if (e.target === DOM.paymentModal) {
                DOM.paymentModal.style.display = 'none';
            }
            return; 
        }

        const esBotonAbrir = DOM.openCartBtn.contains(e.target);
        const esCarrito = DOM.cartSidebar.contains(e.target);
        const esBotonAgregar = e.target.closest('.btn-add') || e.target.closest('.btn-add-sm');
        const esBotonQty = e.target.closest('.btn-qty');

        if (!esCarrito && !esBotonAbrir && !esBotonAgregar && !esBotonQty) {
            DOM.cartSidebar.classList.remove('open');
        }
    });
}

// --- 8. GENERACIÓN DE FACTURA ---
function descargarFactura() {
    if (!ultimoPedido) return;

    const invoiceWindow = window.open('', '_blank');
    const itemsHtml = ultimoPedido.items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.nombre}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">DOP$ ${item.precio.toLocaleString()}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">DOP$ ${(item.precio * item.cantidad).toLocaleString()}</td>
        </tr>
    `).join('');

    invoiceWindow.document.write(`
        <html>
        <head>
            <title>Factura KeyBakery - ${ultimoPedido.nombre}</title>
            <style>
                body { font-family: 'Arial', sans-serif; color: #333; padding: 40px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f723b4; padding-bottom: 20px; }
                .header h1 { color: #f723b4; margin: 0; }
                .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: #f9f9f9; padding: 10px; text-align: left; border-bottom: 2px solid #eee; }
                .totals { text-align: right; }
                .totals p { margin: 5px 0; font-size: 1.1rem; }
                .footer { text-align: center; margin-top: 50px; font-size: 0.9rem; color: #666; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>KEYBAKERY</h1>
                <p>Repostería Artesanal Dominicana</p>
                <p>Santo Domingo, RD</p>
            </div>
            <div class="info">
                <div>
                    <h3>Cliente:</h3>
                    <p><strong>Nombre:</strong> ${ultimoPedido.nombre}</p>
                    <p><strong>Teléfono:</strong> ${ultimoPedido.telefono}</p>
                    <p><strong>Fecha:</strong> ${ultimoPedido.fecha}</p>
                </div>
                <div>
                    <h3>Detalles de Entrega:</h3>
                    <p><strong>Método:</strong> ${ultimoPedido.metodoTexto}</p>
                    ${ultimoPedido.direccion ? `<p><strong>Dirección:</strong> ${ultimoPedido.direccion}</p>` : ''}
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th style="text-align: center;">Cant.</th>
                        <th style="text-align: right;">Precio Unit.</th>
                        <th style="text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div class="totals">
                <p>Subtotal: <strong>DOP$ ${ultimoPedido.subtotal.toLocaleString()}</strong></p>
                ${ultimoPedido.costoEnvio > 0 ? `<p>Envío: <strong>DOP$ ${ultimoPedido.costoEnvio.toLocaleString()}</strong></p>` : ''}
                <p style="font-size: 1.5rem; color: #B08D57; margin-top: 10px;">TOTAL: <strong>DOP$ ${ultimoPedido.totalFinal.toLocaleString()}</strong></p>
            </div>
            <div class="footer">
                <p>¡Gracias por elegir KeyBakery para endulzar tus momentos!</p>
                <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #f723b4; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir Factura</button>
            </div>
        </body>
        </html>
    `);
    invoiceWindow.document.close();
}

async function seedProducts() {
    try {
        for (const prod of defaultProducts) {
            await addDoc(collection(db, "products"), prod);
        }
    } catch (err) {
        console.error("Error seeding products:", err);
    }
}

// Ejecución segura
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
