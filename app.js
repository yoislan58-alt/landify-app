/* =========================================================
   CONFIGURACIÓN GLOBAL
========================================================= */

function generarIdLanding() {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let random = "";
    for (let i = 0; i < 5; i++) {
        random += letras.charAt(Math.floor(Math.random() * letras.length));
    }
    return "ldg-" + random;
}

const generateBtn = document.getElementById("generateBtn");
const loading = document.getElementById("loading");
const projectList = document.getElementById("projectList");
const notifyBox = document.getElementById("notify");

/* =========================================================
   NOTIFICACIONES
========================================================= */
function notify(msg) {
    notifyBox.textContent = msg;
    notifyBox.classList.add("show");
    setTimeout(() => notifyBox.classList.remove("show"), 3000);
}

/* =========================================================
   GENERAR LANDING (LLAMA A /api/openai)
========================================================= */

generateBtn.onclick = async () => {
    const prompt = document.getElementById("userPrompt").value;
    if (!prompt) return notify("Describe la landing primero.");

    loading.classList.remove("hidden");

    try {
        // 🔥 AHORA todo pasa por tu función segura del servidor
        const response = await fetch("/api/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        if (!data.success) {
            notify("Error generando la landing.");
            loading.classList.add("hidden");
            return;
        }

        const textos = data.textos;
        const imgHero = data.heroImage;
        textos.heroImage = imgHero;

        const id = generarIdLanding();

        // Construir HTML final con template
        const rawTemplate = await fetch("/landing/template.html").then(r => r.text());
        
        const htmlFinal = rawTemplate
            .replace("{{heroImage}}", textos.heroImage)
            .replace("{{heroText}}", textos.heroText)
            .replace("{{subText}}", textos.subText)
            .replace("{{cta}}", textos.cta)
            .replace("{{benefits}}", (textos.benefits || []).map(b => `<div class="card">${b}</div>`).join(""))
            .replace("{{features}}", (textos.features || []).map(f => `<div class="card">${f}</div>`).join(""))
            .replace("{{testimonials}}", (textos.testimonials || []).map(t => `<div class="test-card">${t}</div>`).join(""));

        // Guardar landing en servidor
        const urlFinal = await guardarLandingEnServidor(id, htmlFinal);

        if (!urlFinal) {
            notify("Error guardando la landing.");
            loading.classList.add("hidden");
            return;
        }

        textos.url = urlFinal;
        localStorage.setItem(`landing-${id}`, JSON.stringify(textos));

        addProject(id, textos);
        notify("Landing creada ✔");

        // Botón para ver la landing generada
        document.getElementById("btn-ver-landing").onclick = () => {
            window.open(urlFinal, "_blank");
        };

    } catch (err) {
        notify("Error generando la landing.");
    }

    loading.classList.add("hidden");
};

/* =========================================================
   GUARDAR EN SERVIDOR
========================================================= */

async function guardarLandingEnServidor(id, html) {
    const response = await fetch("/api/guardar-landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, html })
    });

    const data = await response.json();
    return data.url;
}

/* =========================================================
   LISTA DE PROYECTOS
========================================================= */

function addProject(id, data) {
    const card = document.createElement("div");
    card.className = "card-proyecto";

    card.innerHTML = `
        <img src="${data.heroImage}" class="card-thumb" />
        <h3>${data.heroText}</h3>
        <small>ID: ${id}</small>

        <button class="btn-proyecto" onclick="verLanding('${id}')">👁 Ver</button>
        <button class="btn-proyecto btn-secondary" onclick="copiarHTML('${id}')">📋 Copiar HTML</button>
        <button class="btn-proyecto btn-export" onclick="exportarHTML('${id}')">⬇️ Exportar HTML</button>
    `;

    projectList.appendChild(card);
}

/* =========================================================
   VER LANDING
========================================================= */

function verLanding(id) {
    window.open(`/landing-pages/${id}.html`, "_blank");
}

/* =========================================================
   COPIAR HTML
========================================================= */

function copiarHTML(id) {
    const raw = localStorage.getItem(`landing-${id}`);
    if (!raw) return notify("Landing no encontrada.");

    fetch("/landing/template.html")
        .then(res => res.text())
        .then(template => {
            const data = JSON.parse(raw);

            const htmlFinal = template
                .replace("{{heroImage}}", data.heroImage)
                .replace("{{heroText}}", data.heroText)
                .replace("{{subText}}", data.subText)
                .replace("{{cta}}", data.cta)
                .replace("{{benefits}}", (data.benefits || []).map(b => `<div class="card">${b}</div>`).join(""))
                .replace("{{features}}", (data.features || []).map(f => `<div class="card">${f}</div>`).join(""))
                .replace("{{testimonials}}", (data.testimonials || []).map(t => `<div class="test-card">${t}</div>`).join(""));

            navigator.clipboard.writeText(htmlFinal);
            notify("HTML copiado al portapapeles ✔");
        });
}

/* =========================================================
   EXPORTAR HTML
========================================================= */

function exportarHTML(id) {
    const raw = localStorage.getItem(`landing-${id}`);
    if (!raw) return notify("Landing no encontrada.");

    fetch("/landing/template.html")
        .then(res => res.text())
        .then(template => {
            const data = JSON.parse(raw);

            const htmlFinal = template
                .replace("{{heroImage}}", data.heroImage)
                .replace("{{heroText}}", data.heroText)
                .replace("{{subText}}", data.subText)
                .replace("{{cta}}", data.cta)
                .replace("{{benefits}}", (data.benefits || []).map(b => `<div class="card">${b}</div>`).join(""))
                .replace("{{features}}", (data.features || []).map(f => `<div class="card">${f}</div>`).join(""))
                .replace("{{testimonials}}", (data.testimonials || []).map(t => `<div class="test-card">${t}</div>`).join(""));

            const blob = new Blob([htmlFinal], { type: "text/html" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${id}.html`;
            a.click();

            notify("HTML exportado correctamente ✔");
        });
}

/* =========================================================
   UPGRADE PLAN BUTTON
========================================================= */

const btnUpgrade = document.getElementById("btnUpgrade");

if (btnUpgrade) {
    btnUpgrade.onclick = () => {
        window.open("https://pay.hotmart.com/TU_LINK_DE_PAGO", "_blank");
    };
}








