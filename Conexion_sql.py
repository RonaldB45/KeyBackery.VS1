import sqlite3
from flask import Flask, request, jsonify

app = Flask(__name__)

# Configuración de la base de datos
def init_db():
    conn = sqlite3.connect('keybakery.db')
    cursor = conn.cursor()
    
    # Tabla de Pedidos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente TEXT NOT NULL,
            total REAL NOT NULL,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de Detalles
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Detalle_Pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER,
            producto_id INTEGER,
            nombre TEXT,
            precio REAL,
            cantidad INTEGER,
            FOREIGN KEY (pedido_id) REFERENCES Pedidos(id)
        )
    ''')
    
    conn.commit()
    conn.close()

@app.route('/api/pedidos', methods=['POST'])
def guardar_pedido():
    data = request.json
    cliente = data.get('cliente')
    total = data.get('total')
    items = data.get('items')
    
    if not cliente or not total or not items:
        return jsonify({"error": "Datos incompletos"}), 400
    
    try:
        conn = sqlite3.connect('keybakery.db')
        cursor = conn.cursor()
        
        # Insertar pedido principal
        cursor.execute("INSERT INTO Pedidos (cliente, total) VALUES (?, ?)", (cliente, total))
        pedido_id = cursor.lastrowid
        
        # Insertar cada item del carrito
        for item in items:
            cursor.execute('''
                INSERT INTO Detalle_Pedidos (pedido_id, producto_id, nombre, precio, cantidad)
                VALUES (?, ?, ?, ?, ?)
            ''', (pedido_id, item['id'], item['nombre'], item['precio'], item['cantidad']))
            
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "pedidoId": pedido_id}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(port=3000)
