export async function handler(event, context) {
    try {
        // CORS
        return await handle(event);
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error interno", details: err.toString() })
        };
    }
}

async function handle(event) {
    // CORS
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: corsHeaders()
        };
    }

    const body = JSON.parse(event.body || "{}");
    const { prompt, htmlActual, accion, ubicacion } = body;

    // 🟪 Cargar clave desde Netlify (NO en el archivo)
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
        return json({ success: false, error: "OPENAI_API_KEY no configurada en Netlify" });
    }

    // 🟦 1) MODO GENERAR LANDING
    if (accion !== "insertar") {
        if (!prompt) return json({ success: false, error: "Falta prompt" });

        // Generar textos (GPT)
        const textosRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_KEY}`
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
            })
        });

        const textos = await textosRes.json();
        const parsed = JSON.parse(textos.choices[0].message.content);

        // Generar imagen del héroe (GPT-4o)
        const imgRes = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                prompt: parsed.heroText || prompt,
                size: "1024x1024"
            })
        });

        const imgData = await imgRes.json();

        return json({
            success: true,
            textos: parsed,
            heroImage: imgData.data[0].url
        });
    }

    // 🟧 2) MODO INSERTAR SECCIÓN
    if (accion === "insertar") {
        if (!htmlActual) return json({ success: false, error: "Falta HTML actual" });

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
👉 NO tocar imágenes ya existentes.
👉 SOLO insertar respetando diseño actual.

Devuelve SOLO el HTML final completo.
`;

        const modRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Eres un experto en edición HTML; no eliminas nada, solo insertas."
                    },
                    { role: "user", content: promptInsertar }
                ]
            })
        });

        const result = await modRes.json();

        return json({
            success: true,
            htmlFinal: result.choices[0].message.content
        });
    }

    return json({ success: false, error: "Acción no reconocida" });
}

/* Helpers */
function json(obj) {
    return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify(obj)
    };
}

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };
}

