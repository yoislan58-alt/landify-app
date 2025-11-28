export default async function handler(req, res) {
  try {
    const { prompt, mode } = JSON.parse(req.body || "{}");

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "API Key no configurada" });
    }

    if (!prompt || !mode) {
      return res.status(400).json({ error: "Faltan parámetros: prompt o mode" });
    }

    // TEMPLATE PRO — SYSTEM INSTRUCTION
    const SYSTEM_PROMPT = `
Eres Landify AI, un generador de landing pages ultra-profesional.

REGLAS IMPORTANTES:
- Usa SIEMPRE el TEMPLATE PRO (estructura HTML completa del usuario).
- NO inventes layouts nuevos.
- Rellena EXCLUSIVAMENTE los placeholders {{...}}.
- NO agregues explicaciones, comentarios, notas o texto fuera del <html>.
- NO uses triple backticks.
- NO pongas "Aquí tienes tu landing".
- NO pongas texto guía ni frases técnicas.
- Si un campo no aplica, usa un texto profesional corto.
- BENEFICIOS / FEATURES / TESTIMONIOS / FAQ deben ser BLOQUES HTML completos:
    Ejemplo:
      <div class="info-card">
        <div class="info-icon">🔥</div>
        <div class="info-title">Título</div>
        <div class="info-text">Descripción breve.</div>
      </div>

- Testimonios deben usar:
      <div class="test-card">
          <div class="test-person">
              <div class="test-avatar"><img src="URL" /></div>
              <div>
                  <div class="test-info-name">Nombre</div>
                  <div class="test-info-role">Rol</div>
              </div>
          </div>
          <div class="test-text">Comentario usuario.</div>
      </div>

- FAQ deben usar:
    <div class="faq-item">
        <div class="faq-q">Pregunta</div>
        <div class="faq-a">Respuesta corta.</div>
    </div>

NO USES IMÁGENES QUE ROMPAN (NUNCA iconos con URLs rotas). Usa URLs mínimas o imágenes de Unsplash.

GENERAR RESULTADO:
- Debe devolver **solo** el HTML final completo reemplazando {{...}}.
- Mode = "create" → generar landing completa.
- Mode = "adjust" → insertar una sección con estilo del template y retornar SOLO la nueva sección HTML (sin reemplazar todo).
`;

    // --- LLAMADA A OPENAI ---
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1",  // Puedes usar gpt-4.1-mini si quieres ahorrar créditos
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `
PROMPT USUARIO:
${prompt}

MODO:
${mode}

IMPORTANTE:
Si mode=create → devuelve todo el HTML final con placeholders completados.
Si mode=adjust → devuelve SOLO la nueva sección HTML.
`
          }
        ]
      })
    });

    const data = await completion.json();

    if (!data.choices) {
      return res.status(500).json({ error: "Error generando contenido", raw: data });
    }

    const content = data.choices[0].message.content;

    // LIMPIEZA: quitar ```html o ```
    const cleaned = content
      .replace(/```html/gi, "")
      .replace(/```/g, "")
      .trim();

    return res.status(200).json({ html: cleaned });

  } catch (err) {
    console.error("Error en openai.js:", err);
    res.status(500).json({ error: "Error interno", detail: err });
  }
}



