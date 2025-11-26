import fs from "fs";
import path from "path";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    try {
        const { id, html } = req.body;

        const folder = path.join(process.cwd(), "public", "landing-pages");

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        const filePath = path.join(folder, `${id}.html`);
        fs.writeFileSync(filePath, html);

        return res.status(200).json({
            success: true,
            url: `/landing-pages/${id}.html`
        });

    } catch (err) {
        return res.status(500).json({ error: "Error al guardar" });
    }
}

