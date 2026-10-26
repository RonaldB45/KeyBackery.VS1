/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingBasket, MapPin, X, CheckCircle, ShoppingCart, Settings, Plus, Trash2, Save, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, loginWithGoogle } from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

interface Product {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  stock?: number;
  activo?: boolean;
}

interface OrderItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface Order {
  id: string;
  cliente: string;
  total: number;
  items: OrderItem[];
  fecha: any;
  status: 'pending' | 'completed' | 'cancelled';
}

interface CartItem extends Product {
  cantidad: number;
}

const ADMIN_EMAIL = "ronalbatista577@gmail.com";

export default function App() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'inventory' | 'orders'>('inventory');
  
  const [carrito, setCarrito] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('keybakery_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'upsell' | 'payment' | 'success'>('upsell');
  const [cardName, setCardName] = useState('');

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === ADMIN_EMAIL);
    });
    return () => unsubscribe();
  }, []);

  // Products listener
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("nombre"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProductos(prods);
      
      if (prods.length === 0) {
        seedProducts();
      }
    });
    return () => unsubscribe();
  }, []);

  // Orders listener
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "orders"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ords);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const seedProducts = async () => {
    const initialProds = [
      { nombre: "Pastel de Bodas Clásico", precio: 2500, imagen: "https://images.unsplash.com/photo-1535254973040-607b474cb8c2?q=80&w=600", stock: 10, activo: true },
      { nombre: "Cupcakes Red Velvet (6 uds)", precio: 450, imagen: "https://images.unsplash.com/photo-1614707267537-b85af00c4b81?q=80&w=600", stock: 50, activo: true },
      { nombre: "Bocadillos de Queso (12 uds)", precio: 180, imagen: "https://images.unsplash.com/photo-1541529086526-db283c563270?q=80&w=600", stock: 100, activo: true },
      { nombre: "Tarta de Frutas Tropicales", precio: 1200, imagen: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?q=80&w=600", stock: 15, activo: true },
      { nombre: "Pastel de Chocolate Intenso", precio: 1800, imagen: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600", stock: 12, activo: true },
      { nombre: "Mini Quiches Variados (8 uds)", precio: 320, imagen: "https://images.unsplash.com/photo-1623334834998-a48bf9f04439?q=80&w=600", stock: 40, activo: true },
      { nombre: "Bizcocho Dominicano de Suspiro", precio: 950, imagen: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?q=80&w=600", stock: 20, activo: true },
      { nombre: "Cheesecake de Guayaba Real", precio: 1100, imagen: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600", stock: 18, activo: true },
      { nombre: "Croissants de Mantequilla (4 uds)", precio: 240, imagen: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600", stock: 30, activo: true },
      { nombre: "Mousse de Chinola Silvestre", precio: 350, imagen: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=600", stock: 25, activo: true },
      { nombre: "Pudin de Pan con Pasas", precio: 500, imagen: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=600", stock: 15, activo: true },
      { nombre: "Catibías Gourmet (10 uds)", precio: 400, imagen: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=600", stock: 60, activo: true }
    ];
    
    const batch = writeBatch(db);
    initialProds.forEach(p => {
      const docRef = doc(collection(db, "products"));
      batch.set(docRef, p);
    });
    await batch.commit();
  };

  useEffect(() => {
    localStorage.setItem('keybakery_cart', JSON.stringify(carrito));
  }, [carrito]);

  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const cartCount = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  const agregarAlCarrito = (id: string) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === id);
      if (existe) {
        return prev.map(i => i.id === id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      const prod = productos.find(p => p.id === id);
      if (prod) return [...prev, { ...prod, cantidad: 1 }];
      return prev;
    });
  };

  const cambiarCant = (id: string, delta: number) => {
    setCarrito(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const nuevaCant = item.cantidad + delta;
          return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
    });
  };

  const handleCheckout = () => {
    if (total < 1500) {
      alert("El pedido mínimo es de DOP$ 1,500.");
      return;
    }
    setModalStep('upsell');
    setIsModalOpen(true);
    setIsCartOpen(false);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const datosPedido = {
      cliente: cardName,
      total: total,
      items: carrito.map(i => ({ id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad })),
      fecha: serverTimestamp(),
      status: 'pending'
    };

    try {
      // Save to Firestore
      await addDoc(collection(db, "orders"), datosPedido);

      // Send email via server (optional, but good for Resend integration)
      fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido: {
            nombre: cardName,
            totalFinal: total,
            items: carrito,
            fecha: new Date().toLocaleString(),
            metodoTexto: "Pago con Tarjeta",
            telefono: "N/A",
            direccion: ""
          }
        })
      }).catch(err => console.error("Error sending invoice email:", err));

      setModalStep('success');
      setCarrito([]);
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Error al procesar el pedido.");
    }
  };

  const sugeridos = productos
    .filter(p => !carrito.find(item => item.id === p.id))
    .slice(0, 2);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <a href="#" className="logo">KEYBAKERY</a>
          <ul className="nav-links hidden md:flex">
            <li><a href="#nosotros">Nosotros</a></li>
            <li><a href="#menu">Menú</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ul>
          <div className="nav-actions">
            <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
              <ShoppingBasket size={24} />
              <span id="cart-count">{cartCount}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Sabor que se nota, <br /><span className="highlight">dulzura que se recuerda</span></h1>
          <p><MapPin size={20} /> Santo Domingo, República Dominicana</p>
          <a href="#menu" className="btn-primary uppercase tracking-wide">Hacer Pedido</a>
        </div>
      </header>

      {/* Nosotros */}
      <section id="nosotros" className="section bg-cream">
        <div className="container grid-2">
          <div className="about-text">
            <h2 className="section-title left">Sobre Nosotros</h2>
            <p>En KeyBakery, nos apasiona crear momentos dulces e inolvidables. Utilizamos ingredientes locales de la más alta calidad para brindarte la mejor repostería artesanal dominicana.</p>
          </div>
          <div className="about-image">
            <img src="https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=600" alt="Nuestra repostería" className="rounded-img shadow-lg" />
          </div>
        </div>
      </section>

      {/* Misión, Visión, Valores */}
      <section className="section bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center p-8 rounded-3xl bg-cream/30 border border-gold/10">
              <h3 className="text-2xl font-bold color-gold mb-4">Misión</h3>
              <p className="text-gray-600">Deleitar el paladar de nuestros clientes con repostería artesanal de la más alta calidad, fusionando tradición y creatividad en cada bocado.</p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-cream/30 border border-gold/10">
              <h3 className="text-2xl font-bold color-gold mb-4">Visión</h3>
              <p className="text-gray-600">Ser la repostería artesanal referente en la República Dominicana, reconocida por nuestra excelencia, sabor auténtico y compromiso con la felicidad de nuestros clientes.</p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-cream/30 border border-gold/10">
              <h3 className="text-2xl font-bold color-gold mb-4">Valores</h3>
              <ul className="text-gray-600 space-y-2">
                <li>✨ <strong>Calidad:</strong> Ingredientes premium siempre.</li>
                <li>❤️ <strong>Pasión:</strong> Amor en cada preparación.</li>
                <li>🤝 <strong>Integridad:</strong> Honestidad con nuestros clientes.</li>
                <li>🚀 <strong>Innovación:</strong> Evolucionando sabores clásicos.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Menú */}
      <section id="menu" className="section">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="section-title">Nuestro Menú</h2>
            <p className="section-subtitle">Descubre nuestras delicias preparadas diariamente.</p>
          </div>
          <div className="products-grid">
            {productos.map(p => (
              <div key={p.id} className="product-card">
                <div className="product-image-wrapper"><img src={p.imagen} alt={p.nombre} /></div>
                <div className="product-info">
                  <h3>{p.nombre}</h3>
                  <div className="product-meta">
                    <span className="price">DOP$ {p.precio.toLocaleString()}</span>
                    <button className="btn-add" onClick={() => agregarAlCarrito(p.id)}>Agregar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container text-center">
          <p className="logo mb-4">KEYBAKERY</p>
          <p className="text-sm opacity-70 mb-6">© {new Date().getFullYear()} KeyBakery. Todos los derechos reservados.</p>
          
          <div className="flex justify-center gap-4 mt-4">
            <button 
              onClick={() => setIsAdminPanelOpen(true)}
              className="bg-gold text-white px-6 py-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 font-bold text-sm"
            >
              <Settings size={18} /> Panel Admin
            </button>
            {user && (
              <button 
                onClick={() => signOut(auth)}
                className="bg-white text-red-500 px-6 py-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 border border-gray-200 font-bold text-sm"
              >
                <LogOut size={18} /> Salir
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Sidebar Carrito */}
      <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3><ShoppingBasket size={24} /> Tu Carrito</h3>
          <button onClick={() => setIsCartOpen(false)} className="close-btn"><X size={24} /></button>
        </div>
        <div className="cart-items">
          {carrito.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Tu carrito está vacío</div>
          ) : (
            carrito.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.imagen} className="cart-item-img" alt={item.nombre} />
                <div className="cart-item-info">
                  <p className="cart-item-title">{item.nombre}</p>
                  <p className="cart-item-price">DOP$ {item.precio.toLocaleString()}</p>
                  <div className="cart-item-controls">
                    <button className="btn-qty" onClick={() => cambiarCant(item.id, -1)}>-</button>
                    <span className="cart-item-qty">{item.cantidad}</span>
                    <button className="btn-qty" onClick={() => cambiarCant(item.id, 1)}>+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-footer">
          <div className="total">Total: <span id="cart-total">DOP$ {total.toLocaleString()}</span></div>
          <button className="btn-checkout w-full" onClick={handleCheckout}>
            Finalizar Compra <CheckCircle size={20} />
          </button>
        </div>
      </div>

      {/* Modal de Pago */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', opacity: 1 }}>
          <div className="payment-content">
            <button onClick={() => setIsModalOpen(false)} className="close-modal-btn">×</button>

            {modalStep === 'upsell' && (
              <div>
                <h2 className="section-title" style={{ fontSize: '2rem' }}>¿Deseas algo más?</h2>
                <p className="text-center mb-6">Nuestros clientes también agregaron:</p>
                <div className="upsell-grid">
                  {sugeridos.map(p => (
                    <div key={p.id} className="upsell-item">
                      <img src={p.imagen} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} alt={p.nombre} />
                      <div>
                        <p className="font-bold" style={{ fontSize: '0.9rem', margin: 0 }}>{p.nombre}</p>
                        <button className="btn-add-sm" onClick={() => agregarAlCarrito(p.id)}>
                          + Añadir (DOP$ {p.precio})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setModalStep('payment')} className="btn-primary w-full mt-6">Continuar al Pago</button>
              </div>
            )}

            {modalStep === 'payment' && (
              <div>
                <h2 className="section-title" style={{ fontSize: '2rem' }}>Registro de Pago</h2>
                <p className="text-center mb-6">Total a pagar: <span className="font-bold color-gold">DOP$ {total.toLocaleString()}</span></p>
                <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-4">
                  <input 
                    type="text" 
                    placeholder="Nombre en la tarjeta" 
                    required 
                    className="p-3 border-2 border-gray-100 rounded-xl focus:border-pink-light outline-none"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000" 
                    maxLength={16} 
                    required 
                    className="p-3 border-2 border-gray-100 rounded-xl focus:border-pink-light outline-none"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="MM/AA" 
                      maxLength={5} 
                      required 
                      className="p-3 border-2 border-gray-100 rounded-xl focus:border-pink-light outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="CVV" 
                      maxLength={3} 
                      required 
                      className="p-3 border-2 border-gray-100 rounded-xl focus:border-pink-light outline-none"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full">Pagar Ahora</button>
                </form>
              </div>
            )}

            {modalStep === 'success' && (
              <div className="text-center py-5">
                <CheckCircle size={80} className="mx-auto text-green-500" />
                <h2 className="color-gold mt-6 text-2xl font-bold">¡Pedido Confirmado!</h2>
                <p className="mt-2">Tu orden ha sido registrada en el sistema.</p>
                <button onClick={() => setIsModalOpen(false)} className="btn-primary mt-6">Volver al Inicio</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {isAdminPanelOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[5000] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 bg-gold text-white flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Settings size={28} /> Panel Admin
                  </h2>
                  <div className="flex bg-white/20 p-1 rounded-xl">
                    <button 
                      onClick={() => setAdminTab('inventory')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${adminTab === 'inventory' ? 'bg-white text-gold' : 'hover:bg-white/10'}`}
                    >
                      Inventario
                    </button>
                    <button 
                      onClick={() => setAdminTab('orders')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${adminTab === 'orders' ? 'bg-white text-gold' : 'hover:bg-white/10'}`}
                    >
                      Pedidos ({orders.length})
                    </button>
                  </div>
                  <button 
                    onClick={async () => {
                      if(confirm("¿Restablecer todo el catálogo con fotos corregidas? Esto borrará los cambios manuales.")) {
                        const batch = writeBatch(db);
                        // Delete existing
                        productos.forEach(p => batch.delete(doc(db, "products", p.id)));
                        await batch.commit();
                        // Seed new
                        seedProducts();
                      }
                    }}
                    className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors"
                  >
                    Restablecer Fotos
                  </button>
                </div>
                <button onClick={() => setIsAdminPanelOpen(false)} className="hover:rotate-90 transition-transform">
                  <X size={32} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {adminTab === 'inventory' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Add New Product Card */}
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-500 hover:border-gold hover:text-gold transition-colors cursor-pointer"
                      onClick={() => {
                        const nombre = prompt("Nombre del producto:");
                        const precio = Number(prompt("Precio (DOP):"));
                        const imagen = prompt("URL de la imagen:");
                        if (nombre && precio && imagen) {
                          addDoc(collection(db, "products"), { nombre, precio, imagen, stock: 0, activo: true });
                        }
                      }}
                    >
                      <Plus size={48} />
                      <span className="font-bold mt-2">Añadir Producto</span>
                    </div>

                    {productos.map(p => (
                      <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gold/10 flex flex-col gap-3">
                        <img src={p.imagen} alt={p.nombre} className="w-full h-32 object-cover rounded-xl" />
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-gray-400">Nombre</label>
                          <input 
                            className="font-bold bg-transparent border-b border-gray-100 focus:border-gold outline-none py-1"
                            defaultValue={p.nombre}
                            onBlur={(e) => updateDoc(doc(db, "products", p.id), { nombre: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400">Precio (DOP)</label>
                            <input 
                              type="number"
                              className="font-bold bg-transparent border-b border-gray-100 focus:border-gold outline-none py-1"
                              defaultValue={p.precio}
                              onBlur={(e) => updateDoc(doc(db, "products", p.id), { precio: Number(e.target.value) })}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400">Stock</label>
                            <input 
                              type="number"
                              className="font-bold bg-transparent border-b border-gray-100 focus:border-gold outline-none py-1"
                              defaultValue={p.stock || 0}
                              onBlur={(e) => updateDoc(doc(db, "products", p.id), { stock: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                          <button 
                            onClick={() => {
                              if(confirm("¿Eliminar este producto?")) {
                                deleteDoc(doc(db, "products", p.id));
                              }
                            }}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase font-bold text-gray-400">Activo</span>
                            <input 
                              type="checkbox" 
                              defaultChecked={p.activo !== false}
                              onChange={(e) => updateDoc(doc(db, "products", p.id), { activo: e.target.checked })}
                              className="w-5 h-5 accent-gold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {orders.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-3xl text-gray-400">
                        No hay pedidos registrados aún.
                      </div>
                    ) : (
                      orders.map(order => (
                        <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                order.status === 'completed' ? 'bg-green-100 text-green-600' : 
                                order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                              }`}>
                                {order.status || 'pending'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {order.fecha?.toDate ? order.fecha.toDate().toLocaleString() : 'Recién creado'}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">{order.cliente}</h3>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {order.items.map((item, idx) => (
                                <span key={idx} className="bg-gray-50 px-2 py-1 rounded-md text-xs border border-gray-100">
                                  {item.cantidad}x {item.nombre}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-between gap-4">
                            <div className="text-right">
                              <p className="text-xs text-gray-400 uppercase font-bold">Total</p>
                              <p className="text-xl font-bold text-gold">DOP$ {order.total.toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                              {order.status !== 'completed' && (
                                <button 
                                  onClick={() => updateDoc(doc(db, "orders", order.id), { status: 'completed' })}
                                  className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition-colors flex items-center gap-2"
                                >
                                  <CheckCircle size={16} /> Completar
                                </button>
                              )}
                              {order.status !== 'cancelled' && (
                                <button 
                                  onClick={() => updateDoc(doc(db, "orders", order.id), { status: 'cancelled' })}
                                  className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                                >
                                  Cancelar
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  if(confirm("¿Eliminar registro de pedido?")) {
                                    deleteDoc(doc(db, "orders", order.id));
                                  }
                                }}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-white text-center text-[10px] text-gray-400 border-t uppercase tracking-widest font-bold">
                Panel de Control KeyBakery • {adminTab === 'inventory' ? 'Gestión de Productos' : 'Gestión de Pedidos'}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
