export default async function handler(req, res) {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Falta prompt" });
        }

        // 👉 TU API KEY aquí (no se ve en el frontend)
        const OPENAI_KEY = "TU_API_KEY_AQUI";

        // 1) GPT-4o-mini — generar textos
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

        // 2) GPT-4o — generar la imagen
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

    } catch (err) {
        return res.status(500).json({ error: "Error generando la landing" });
    }
}
