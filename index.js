import express from 'express';
import axios from 'axios';
import { UAParser } from 'ua-parser-js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.set('trust proxy', true); // Habilitar manejo de proxies

app.get("/", async (req, res) => {
    try {
        // Obtener la primera IP del header x-forwarded-for
        const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;

        // Validar que la IP no sea privada (opcional, para evitar IPs como 10.x.x.x)
        const isPrivateIp = /^10\.|^192\.168\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^127\.|^0\.|^169\.254\.|^::1|^fc00:|^fe80:/.test(clientIp);
        if (isPrivateIp) {
            throw new Error("IP privada detectada, no se puede geolocalizar");
        }

        // Hacer la solicitud a ipapi.co con la IP del cliente
        const response = await axios.get(`https://ipapi.co/${clientIp}/json/`);
        const data = response.data;

        // Validar que la respuesta contiene datos válidos
        if (data.error || !data.ip) {
            throw new Error(data.error_message || "Respuesta inválida de ipapi.co");
        }

        // Parsear el User-Agent
        const userAgent = req.headers['user-agent'];
        const parser = new UAParser(userAgent);
        const parsed = parser.getResult();

        const browser = parsed.browser.name || "Desconocido";
        const os = parsed.os.name || "Desconocido";
        const device = parsed.device.type || "Desktop";

        // Renderizar la página con los datos
        res.render("index.ejs", {
            ip: data.ip,
            country: data.country_name || "Desconocido",
            region: data.region || "Desconocido",
            city: data.city || "Desconocido",
            coords: `${data.latitude || "Desconocido"}, ${data.longitude || "Desconocido"}`,
            postalCode: data.postal || "Desconocido",
            internetProvider: data.org || "Desconocido",
            language: data.languages || "Desconocido",
            os: os,
            browser: browser,
            device: device,
            error: null
        });

    } catch (error) {
        console.error("Error al obtener información de IP:", error.message);
        // Parsear el User-Agent incluso en caso de error
        const userAgent = req.headers['user-agent'];
        const parser = new UAParser(userAgent);
        const parsed = parser.getResult();

        res.status(500).render("index.ejs", {
            error: "No se pudo obtener la información de IP: " + error.message,
            ip: null,
            country: null,
            region: null,
            city: null,
            coords: null,
            postalCode: null,
            internetProvider: null,
            language: null,
            os: parsed.os.name || null,
            browser: parsed.browser.name || null,
            device: parsed.device.type || "Desktop"
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});