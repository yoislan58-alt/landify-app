import fs from "fs";
import path from "path";

export default async function handler(req, res) {
    try {
        const { id, html } = req.body;

        if (!id || !html) {
            return res.status(400).json({ error: "Faltan datos" });
        }

        // Carpeta donde se guardan las landings
        const folder = path.join(process.cwd(), "landing-pages");

        // Crear la carpeta si no existe
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }

        // Guardar archivo final
        const filePath = path.join(folder, `${id}.html`);
        fs.writeFileSync(filePath, html);

        return res.status(200).json({
            success: true,
            url: `/landing-pages/${id}.html`,
        });

    } catch (err) {
        return res.status(500).json({ error: "Error guardando landing" });
    }
}
