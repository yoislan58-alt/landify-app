import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { id, html } = req.body;

    const folder = path.join(process.cwd(), "landing-pages");
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);

    const filePath = path.join(folder, `${id}.html`);
    fs.writeFileSync(filePath, html);

    res.status(200).json({ url: `/landing-pages/${id}.html` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


