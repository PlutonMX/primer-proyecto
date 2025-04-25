import express from 'express';
import axios from 'axios';
import { UAParser } from 'ua-parser-js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));


app.get("/", async (req, res) => {
    try {
      const response = await axios.get("https://ipapi.co/json/");
      const data = response.data;
      const userAgent = req.headers['user-agent'];
      const parser = new UAParser(userAgent);
      const parsed = parser.getResult();
    
      const browser = parsed.browser.name;
      const os = parsed.os.name;
      const device = parsed.device.type || "Desktop";
  
      // luego renderizas tu index.ejs con los datos
      res.render("index.ejs", {
        ip: data.ip,
        country: data.country_name,
        region: data.region,
        city: data.city,
        coords: `${data.latitude}, ${data.longitude}`,
        postalCode: data.postal,
        internetProvider: data.org,
        language: data.languages,
        os: os,
        browser: browser,
        device: device,
        error: null
      });
  
    } catch (error) {
      console.error("Error al obtener IP info:", error.message);
      res.status(500).render("index.ejs", {
        error: "No se pudo obtener la información de IP",
        ip: null, country: null, region: null, city: null,
        coords: null, postalCode: null, internetProvider: null,
        language: null, os: null, browser: null, device: null
      });
    }
  });
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });