export default async (req, res) => {
    try {
        // Habilitar CORS para Netlify Functions
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
            return res.status(200).end();
        }

        const { prompt, htmlActual, accion, ubicacion } = req.body;

        if (!prompt && accion !== "insertar") {
            return res.status(400).json({ error: "Falta prompt" });
        }

        // 🟪 TU API KEY (NO visible al usuario)
        const OPENAI_KEY = "TU_API_KEY_AQUI";

        // 🟩 1) GENERACIÓN COMPLETA DE LANDING (gpt-4o-mini)
        if (accion !== "insertar") {
            const textosRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content:
                                "Devuelve JSON válido con heroText, subText, cta, benefits[], features[], testimonials[]."
                        },
                        { role: "user", content: prompt }
                    ]
                }),
            });

            const textos = await textosRes.json();
            const parsed = JSON.parse(textos.choices[0].message.content);

            // 🟦 IMAGEN (GPT-4o)
            const imgRes = await fetch("https://api.openai.com/v1/images/generations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    prompt: parsed.heroText || prompt,
                    size: "1024x1024",
                }),
            });

            const imgData = await imgRes.json();

            return res.status(200).json({
                success: true,
                textos: parsed,
                heroImage: imgData.data[0].url,
            });
        }

        // 🟩 2) MODO: INSERTAR SECCIÓN (ULTRA PRO)
        if (accion === "insertar") {
            if (!htmlActual) {
                return res.status(400).json({ error: "Falta HTML actual" });
            }

            const promptInsertar = `
Aquí tienes la landing actual en HTML:

-------------------------
${htmlActual}
-------------------------

Tu tarea:
👉 Insertar SOLO este contenido nuevo: "${prompt}"
👉 Ubicación deseada: "${ubicacion}"
👉 NO borrar ninguna sección.
👉 NO regenerar toda la landing.
👉 NO cambiar estilos ni colores.
👉 NO modificar imágenes existentes.
👉 NO tocar el código que ya existe.
👉 SOLO insertar respetando estructura y diseño actual.

Devuelve SOLO el HTML final completo, limpio, sin explicaciones.
            `;

            const modRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: "Eres un asistente experto en edición de HTML. Mantén todo, solo inserta."
                        },
                        { role: "user", content: promptInsertar }
                    ]
                }),
            });

            const resultado = await modRes.json();

            return res.status(200).json({
                success: true,
                htmlFinal: resultado.choices[0].message.content,
            });
        }

    } catch (err) {
        return res.status(500).json({ error: "Error en el servidor OpenAI", details: err });
    }
};
