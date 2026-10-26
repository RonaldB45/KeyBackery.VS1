-- Script de creación de base de datos para SQL Server (T-SQL)
-- Nombre de la base de datos sugerido: KeyBakeryDB

-- 1. Crear la tabla de Pedidos (Cabecera)
CREATE TABLE Pedidos (
    id INT PRIMARY KEY IDENTITY(1,1),
    cliente NVARCHAR(255) NOT NULL,
    total DECIMAL(18, 2) NOT NULL,
    fecha DATETIME DEFAULT GETDATE()
);

-- 2. Crear la tabla de Detalle de Pedidos (Líneas del carrito)
CREATE TABLE Detalle_Pedidos (
    id INT PRIMARY KEY IDENTITY(1,1),
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    nombre NVARCHAR(255) NOT NULL,
    precio DECIMAL(18, 2) NOT NULL,
    cantidad INT NOT NULL,
    
    -- Relación de integridad referencial
    CONSTRAINT FK_Pedido_Detalle FOREIGN KEY (pedido_id) 
    REFERENCES Pedidos(id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento en búsquedas
CREATE INDEX IX_Pedidos_Fecha ON Pedidos(fecha);
CREATE INDEX IX_Detalle_PedidoID ON Detalle_Pedidos(pedido_id);
