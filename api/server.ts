import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { Resend } from "resend";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
    const app = express();
    const PORT = 3000;

    // Lazy Resend initialization
    let resendClient: Resend | null = null;
    function getResend() {
        if (!resendClient) {
            const apiKey = process.env.RESEND_API_KEY;
            if (!apiKey) {
                throw new Error("RESEND_API_KEY no está configurada en el servidor.");
            }
            resendClient = new Resend(apiKey);
        }
        return resendClient;
    }

    // Middleware
    app.use(cors());
    app.use(express.json());

    // API: Enviar Factura por Email
    app.post("/api/send-invoice", async (req, res) => {
        const { pedido } = req.body;

        if (!pedido) {
            return res.status(400).json({ error: "Datos de factura incompletos" });
        }

        try {
            const resend = getResend();
            const { nombre, totalFinal, items, fecha, metodoTexto, direccion, telefono } = pedido;

            const itemsHtml = items.map((item: any) => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.nombre}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">DOP$ ${item.precio.toLocaleString()}</td>
                </tr>
            `).join("");

            const { data, error } = await resend.emails.send({
                from: "KeyBakery <onboarding@resend.dev>",
                to: ["ronalbatista577@gmail.com"], // Usamos el correo del usuario como destino por ahora
                subject: `Factura de Pedido - ${nombre}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                        <h1 style="color: #d4af37; text-align: center;">KeyBakery</h1>
                        <h2 style="text-align: center;">Factura de Pedido</h2>
                        <p><strong>Cliente:</strong> ${nombre}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Teléfono:</strong> ${telefono}</p>
                        <p><strong>Método de Entrega:</strong> ${metodoTexto}</p>
                        ${direccion ? `<p><strong>Dirección:</strong> ${direccion}</p>` : ""}
                        
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <thead>
                                <tr style="background-color: #f9f9f9;">
                                    <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Producto</th>
                                    <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: center;">Cant.</th>
                                    <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                        
                        <div style="margin-top: 20px; text-align: right;">
                            <p style="font-size: 1.2em; font-weight: bold;">Total Final: DOP$ ${totalFinal.toLocaleString()}</p>
                        </div>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="text-align: center; color: #888; font-size: 0.9em;">Gracias por preferir KeyBakery. ¡Disfruta tu pedido!</p>
                    </div>
                `,
            });

            if (error) {
                console.error("Error de Resend:", error);
                return res.status(400).json({ error });
            }

            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Error al enviar email:", error);
            res.status(500).json({ error: "Error interno al enviar el correo" });
        }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Servidor KeyBakery corriendo en http://localhost:${PORT}`);
    });
}

startServer();
