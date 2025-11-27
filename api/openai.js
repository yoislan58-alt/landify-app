export async function handler(event, context) {
    try {
        return await handle(event);
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: "Error interno",
                details: err.toString()
            })
        };
    }
}

async function handle(event) {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: corsHeaders()
        };
    }

    const body = JSON.parse(event.body || "{}");
    const { accion, prompt, htmlActual, ubicacion } = body;

    // Cargar clave real
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
        return json({
            success: false,
            error: "OPENAI_API_KEY no configurada en Netlify"
        });
    }

    /* =========================================================
       MODO 1 — GENERAR LANDING
    ========================================================== */
    if (accion === "generar") {

        if (!prompt)
            return json({ success: false, error: "Falta prompt" });

        // Generar textos
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

        const textosRaw = await textosRes.json();
        const parsed = JSON.parse(textosRaw.choices[0].message.content);

        // Generar imagen
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

    /* =========================================================
       MODO 2 — INSERTAR SECCIÓN NUEVA
    ========================================================== */
    if (accion === "insertar") {

        if (!htmlActual)
            return json({ success: false, error: "Falta HTML actual" });

        const promptInsertar = `
HTML actual:
-------------------------
${htmlActual}
-------------------------

Tu tarea:
- Insertar solo este contenido: "${prompt}"
- Ubicación: "${ubicacion}"
- NO borrar nada
- NO cambiar estilos
- NO reemplazar imágenes
- Solo insertar

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
                    { role: "system", content: "Eres experto en edición HTML." },
                    { role: "user", content: promptInsertar }
                ]
            })
        });

        const mod = await modRes.json();

        return json({
            success: true,
            htmlFinal: mod.choices[0].message.content
        });
    }

    return json({ success: false, error: "Acción no válida" });
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


