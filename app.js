/* =========================================================
   CONFIG GLOBAL
========================================================= */

function generarIdLanding() {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let random = "";
    for (let i = 0; i < 6; i++) {
        random += letras.charAt(Math.floor(Math.random() * letras.length));
    }
    return "ldg-" + random;
}

let ultimoIdGenerado = null;

const notifyBox = document.getElementById("notify");
const loading = document.getElementById("loading");

const generateBtn = document.getElementById("generateBtn");
const adjustBtn = document.getElementById("adjustLandingBtn");
const projectList = document.getElementById("projectList");
const projectListSec = document.getElementById("projectListSec");

/* =========================================================
   NOTIFY
========================================================= */
function notify(msg) {
    notifyBox.textContent = msg;
    notifyBox.classList.add("show");
    setTimeout(() => notifyBox.classList.remove("show"), 3000);
}

/* =========================================================
   GENERAR LANDING
========================================================= */

generateBtn.onclick = async () => {
    const prompt = document.getElementById("userPrompt").value.trim();
    if (!prompt) return notify("Describe la landing primero.");

    loading.classList.remove("hidden");

    try {
        const response = await fetch("/.netlify/functions/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accion: "generar", prompt })
        });

        const data = await response.json();

        if (!data.success) {
            loading.classList.add("hidden");
            return notify("Error generando la landing.");
        }

        const textos = data.textos;
        textos.heroImage = data.heroImage;

        const template = await fetch("template.html").then(r => r.text());

        const finalHTML = template
            .replace("{{heroImage}}", textos.heroImage)
            .replace("{{heroText}}", textos.heroText)
            .replace("{{subText}}", textos.subText)
            .replace("{{cta}}", textos.cta)
            .replace("{{benefits}}", textos.benefits.map(b => `<div class="card">${b}</div>`).join(""))
            .replace("{{features}}", textos.features.map(f => `<div class="card">${f}</div>`).join(""))
            .replace("{{testimonials}}", textos.testimonials.map(t => `<div class="card">${t}</div>`).join(""));

        const id = generarIdLanding();
        ultimoIdGenerado = id;

        const urlFinal = await guardarLandingEnServidor(id, finalHTML);

        if (!urlFinal) {
            loading.classList.add("hidden");
            return notify("Error guardando la landing.");
        }

        textos.url = urlFinal;
        localStorage.setItem(`landing-${id}`, JSON.stringify(textos));

        addProject(id, textos);
        syncProjectListSecondary();

        notify("Landing generada ✔");

        document.getElementById("btn-ver-landing").onclick = () => {
            window.open(urlFinal, "_blank");
        };

    } catch (e) {
        console.error(e);
        notify("Error generando la landing.");
    }

    loading.classList.add("hidden");
};

/* =========================================================
   GUARDAR LANDING
========================================================= */

async function guardarLandingEnServidor(id, html) {
    try {
        const response = await fetch("/.netlify/functions/guardar-landing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: `${id}.html`, html })
        });

        const data = await response.json();

        if (!data.success) return null;

        return data.url;

    } catch (e) {
        console.error(e);
        return null;
    }
}

/* =========================================================
   MOSTRAR PROYECTOS
========================================================= */

function addProject(id, data) {
    const card = document.createElement("div");
    card.className = "card-proyecto";

    card.innerHTML = `
        <div class="card">
            <img src="${data.heroImage}" style="width:100%;border-radius:10px;margin-bottom:10px;">
            <h3>${data.heroText}</h3>
            <small>ID: ${id}</small>

            <button class="btn-outline" onclick="verLanding('${id}')">👁 Ver</button>
            <button class="btn-outline" onclick="copiarHTML('${id}')">📋 Copiar HTML</button>
            <button class="btn-outline" onclick="exportarHTML('${id}')">⬇ Exportar</button>
        </div>
    `;

    projectList.appendChild(card);
}

function syncProjectListSecondary() {
    projectListSec.innerHTML = projectList.innerHTML;
}

/* =========================================================
   VER LANDING
========================================================= */

function verLanding(id) {
    window.open(`/landing-pages/${id}.html`, "_blank");
}
window.verLanding = verLanding;

/* =========================================================
   COPIAR HTML
========================================================= */

function copiarHTML(id) {
    const raw = localStorage.getItem(`landing-${id}`);
    if (!raw) return notify("Landing no encontrada.");

    fetch("template.html")
        .then(r => r.text())
        .then(template => {
            const data = JSON.parse(raw);
            const html = template
                .replace("{{heroImage}}", data.heroImage)
                .replace("{{heroText}}", data.heroText)
                .replace("{{subText}}", data.subText)
                .replace("{{cta}}", data.cta)
                .replace("{{benefits}}", data.benefits.map(b => `<div class="card">${b}</div>`).join(""))
                .replace("{{features}}", data.features.map(f => `<div class="card">${f}</div>`).join(""))
                .replace("{{testimonials}}", data.testimonials.map(t => `<div class="card">${t}</div>`).join(""));

            navigator.clipboard.writeText(html);
            notify("HTML copiado ✔");
        });
}
window.copiarHTML = copiarHTML;

/* =========================================================
   EXPORTAR HTML
========================================================= */

function exportarHTML(id) {
    const raw = localStorage.getItem(`landing-${id}`);
    if (!raw) return notify("Landing no encontrada.");

    fetch("template.html")
        .then(r => r.text())
        .then(template => {
            const data = JSON.parse(raw);
            const html = template
                .replace("{{heroImage}}", data.heroImage)
                .replace("{{heroText}}", data.heroText)
                .replace("{{subText}}", data.subText)
                .replace("{{cta}}", data.cta)
                .replace("{{benefits}}", data.benefits.map(b => `<div class="card">${b}</div>`).join(""))
                .replace("{{features}}", data.features.map(f => `<div class="card">${f}</div>`).join(""))
                .replace("{{testimonials}}", data.testimonials.map(t => `<div class="card">${t}</div>`).join(""));

            const blob = new Blob([html], { type: "text/html" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${id}.html`;
            a.click();

            notify("HTML exportado ✔");
        });
}
window.exportarHTML = exportarHTML;

/* =========================================================
   AJUSTAR LANDING (INSERTAR SECCIÓN)
========================================================= */

adjustBtn.onclick = async () => {
    if (!ultimoIdGenerado) return notify("Primero genera una landing.");

    const textoNuevo = document.getElementById("ajustarPrompt").value.trim();
    if (!textoNuevo) return notify("Describe qué quieres agregar.");

    const ubicacion = document.getElementById("ajustarPosicion").value;

    loading.classList.remove("hidden");

    try {
        const data = JSON.parse(localStorage.getItem(`landing-${ultimoIdGenerado}`));
        const htmlActual = await fetch(data.url).then(r => r.text());

        const response = await fetch("/.netlify/functions/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                accion: "insertar",
                htmlActual,
                prompt: textoNuevo,
                ubicacion
            })
        });

        const result = await response.json();

        if (!result.success) {
            loading.classList.add("hidden");
            return notify("Error ajustando la landing.");
        }

        const urlFinal = await guardarLandingEnServidor(ultimoIdGenerado, result.htmlFinal);

        if (!urlFinal) {
            loading.classList.add("hidden");
            return notify("Error guardando cambios.");
        }

        data.url = urlFinal;
        localStorage.setItem(`landing-${ultimoIdGenerado}`, JSON.stringify(data));

        notify("Sección agregada ✔");
        window.open(urlFinal, "_blank");

    } catch (e) {
        console.error(e);
        notify("Error ajustando.");
    }

    loading.classList.add("hidden");
};

/* =========================================================
   NAVEGACIÓN ENTRE SECCIONES
========================================================= */

document.getElementById("btnCrear").onclick = () => activar("seccionCrear");
document.getElementById("btnProyectos").onclick = () => activar("seccionProyectos");
document.getElementById("btnAjustes").onclick = () => activar("seccionAjustes");

function activar(id) {
    document.querySelectorAll(".seccion").forEach(s => s.classList.remove("activa"));
    document.getElementById(id).classList.add("activa");

    document.querySelectorAll(".side-btn").forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");
}

/* =========================================================
   CAMBIO TEMA (CLARO/OSCURO)
========================================================= */

document.getElementById("toggleTheme").onclick = () => {
    const body = document.body;
    const actual = body.getAttribute("data-theme") || "dark";
    const nuevo = actual === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", nuevo);
};



















