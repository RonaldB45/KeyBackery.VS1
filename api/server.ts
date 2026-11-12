import express from "express";
import path from "path";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.set("trust proxy", 1);

// Security headers for Express (local dev & Vercel serverless)
app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
});

// Strict CORS: allow same-origin, localhost dev, Vercel deployment domains, and AI Studio preview
function isAllowedOrigin(origin: string | undefined): boolean {
    if (!origin) return true; // Same-origin or server-to-server requests without Origin header
    try {
        const parsed = new URL(origin);
        const host = parsed.hostname.toLowerCase();
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
        if (host === "localhost" || host === "127.0.0.1") return true;
        if (host.endsWith(".vercel.app")) return true;
        if (host === "keybakery.com.do" || host.endsWith(".keybakery.com.do")) return true;
        if (host.endsWith(".aistudio.google.com") || host.endsWith(".scf.usercontent.goog") || host.endsWith(".run.app")) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

app.use(
    cors({
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
        maxAge: 600,
    })
);

app.use(express.json({ limit: "16kb" }));

// Lightweight in-memory rate limiter for /api/chat (protects Gemini quota on Vercel)
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 20;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    if (rateBuckets.size > 2000) {
        for (const [k, v] of rateBuckets.entries()) {
            if (v.resetAt <= now) rateBuckets.delete(k);
        }
    }
    const existing = rateBuckets.get(ip);
    if (!existing || existing.resetAt <= now) {
        rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }
    if (existing.count >= RATE_MAX_REQUESTS) {
        return false;
    }
    existing.count += 1;
    return true;
}

app.get("/api/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ ok: true });
});

// API: Chatbot Repostera Chef Keyla
app.post("/api/chat", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    const clientIp = (req.ip || req.socket?.remoteAddress || "unknown").slice(0, 64);
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: "Demasiadas solicitudes. Intenta en unos segundos." });
    }

    const rawMessage = req.body?.message;
    if (typeof rawMessage !== "string") {
        return res.status(400).json({ error: "Mensaje requerido" });
    }

    // Strip ASCII control characters (except newline/tab) and enforce length limit
    const sanitizedMessage = rawMessage
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .trim();

    if (!sanitizedMessage || sanitizedMessage.length > 500) {
        return res.status(400).json({ error: "El mensaje debe tener entre 1 y 500 caracteres." });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: sanitizedMessage,
                config: {
                    systemInstruction: `Eres la Chef Keyla, repostera artesanal de "KeyBakery" en Los Alcarrizos, Santo Domingo Oeste, República Dominicana (WhatsApp/Tel: 809-442-8442).
Tu personalidad es dulce, cercana, amable y profesional.
Reglas del negocio:
1. Porciones individuales y entregas: Entregas fijas los DOMINGOS en Los Alcarrizos (Taller gratis, Paradas del Teleférico por DOP$ 50: Estación 1 Los Alcarrizos/Duarte, Estación 2 Las Toronjas cercana al Parque de las Toronjas, Estación 3 Puente Blanco, Estación 4 Los Americanos; o Delivery a domicilio según sector).
2. Regla de pedido mínimo:
   - Producto de la Semana (Brownies Artesanales Melcochosos a RD$ 100 c/u) y pasteles completos o personalizados: se pueden pedir desde 1 unidad.
   - Los demás postres del menú regular (Pastisetas RD$ 160, Alfajores RD$ 130, Tres Leches Tradicional RD$ 130, Coco RD$ 150, Chocolate RD$ 190, Flan RD$ 200, Carrot Cake RD$ 220, Bizcocho Vainilla RD$ 250, Milky Way RD$ 280, Chocomatilda RD$ 225, Volteado de Piña RD$ 140): pedido mínimo de 3 unidades en adelante por sabor.
3. REGLA SOBRE EL PRODUCTO DE LA SEMANA: Solo menciona qué producto es el de la semana (Brownies Artesanales Melcochosos a RD$ 100 c/u) si el usuario pregunta por el producto de la semana, qué postre hay disponible o qué se hornea esta semana.
4. Pasteles enteros o bandejas para eventos: Se elaboran bajo encargo para cualquier día de la semana con 48h mínimas de anticipación.
5. Métodos de pago: Transferencias a Banco Popular, BHD, Banreservas o Efectivo contra entrega.
Sé concisa, entusiasta (máximo 2 párrafos cortos), responde solo sobre KeyBakery y orienta al cliente a agregar al carrito o coordinar por WhatsApp al 809-442-8442.`
                }
            });
            return res.status(200).json({ reply: response.text || null });
        }
    } catch {
        // Fallback silencioso a base de conocimiento del cliente sin filtrar detalles internos
    }

    return res.status(200).json({ reply: null });
});

// Handle unknown /api/* routes cleanly without leaking Express stack
app.use("/api", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(404).json({ error: "Ruta API no encontrada" });
});

// Solo iniciar servidor HTTP & Vite middleware cuando NO se ejecuta como Serverless Function en Vercel
async function startLocalServer() {
    if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (_req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Servidor KeyBakery corriendo en http://localhost:${PORT}`);
    });
}

if (!process.env.VERCEL) {
    startLocalServer().catch((err) => {
        console.error("Error al iniciar servidor local:", err);
        process.exit(1);
    });
}

export default app;
