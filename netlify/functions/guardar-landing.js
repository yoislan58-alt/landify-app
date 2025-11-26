import fs from "fs";
import path from "path";

export default async (req, res) => {
    try {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
            return res.status(200).end();
        }

        const { id, html } = req.body;

        if (!id || !html) {
            return res.status(400).json({ error: "Falta id o html" });
        }

        const folder = path.join(process.cwd(), "landing-pages");

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }

        const filePath = path.join(folder, `${id}.html`);
        fs.writeFileSync(filePath, html);

        return res.status(200).json({
            success: true,
            url: `/landing-pages/${id}.html`,
        });

    } catch (err) {
        return res.status(500).json({ error: "Error guardando landing", details: err });
    }
};
