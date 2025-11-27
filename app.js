// ===========================
// ELEMENTOS UI
// ===========================

// Sidebar
const btnNueva = document.getElementById("btnNueva");
const btnCrear = document.getElementById("btnCrear");
const btnProyectos = document.getElementById("btnProyectos");
const btnAjustar = document.getElementById("btnAjustar");
const btnAjustes = document.getElementById("btnAjustes");

// Panels
const panelGenerar = document.getElementById("panelGenerar");
const panelAjustar = document.getElementById("panelAjustar");
const panelProyectos = document.getElementById("panelProyectos");
const panelAjustes = document.getElementById("panelAjustes");

// Inputs
const userPrompt = document.getElementById("userPrompt");
const ajustarPrompt = document.getElementById("ajustarPrompt");
const ajustarPosicion = document.getElementById("ajustarPosicion");

// Botones principales
const generateBtn = document.getElementById("generateBtn");
const adjustBtn = document.getElementById("adjustLandingBtn");
const resetTodoBtn = document.getElementById("resetTodo");

// Preview / acciones navbar
const previewFrame = document.getElementById("previewFrame");
const btnAbrir = document.getElementById("btnAbrir");
const btnCopiar = document.getElementById("btnCopiar");
const btnDescargar = document.getElementById("btnDescargar");

// Desktop / Mobile toggle
const btnDesktop = document.getElementById("btnDesktop");
const btnMobile = document.getElementById("btnMobile");
const previewCol = document.getElementById("previewCol");

// Loading
const loadingBox = document.getElementById("loading");

// Tema
const toggleTheme = document.getElementById("toggleTheme");

// Proyectos
const projectList = document.getElementById("projectList");

// ===========================
// UTIL
// ===========================

function showLoading() { loadingBox.classList.remove("hidden"); }
function hideLoading() { loadingBox.classList.add("hidden"); }

// Limpia ```html, ``` y la palabra "html" suelta al inicio
function cleanHTML(html) {
    return html
        .replace(/```html/gi, "")
        .replace(/```/g, "")
        .replace(/^\s*html\s*/i, "")
        .trim();
}

function renderPreview(html) {
    previewFrame.srcdoc = cleanHTML(html);
}

// ===========================
// PREVIEW MODE: DESKTOP / MOBILE
// ===========================

function setPreviewMode(mode) {
    if (mode === "mobile") {
        previewCol.classList.remove("desktop");
        previewCol.classList.add("mobile");
        btnMobile.classList.add("active");
        btnDesktop.classList.remove("active");
    } else {
        previewCol.classList.add("desktop");
        previewCol.classList.remove("mobile");
        btnDesktop.classList.add("active");
        btnMobile.classList.remove("active");
    }
}

btnDesktop.addEventListener("click", () => setPreviewMode("desktop"));
btnMobile.addEventListener("click", () => setPreviewMode("mobile"));

// Default
setPreviewMode("desktop");

// ===========================
// PANEL SWITCHING
// ===========================

function hideAllPanels() {
    panelGenerar.classList.add("hidden");
    panelAjustar.classList.add("hidden");
    panelProyectos.classList.add("hidden");
    panelAjustes.classList.add("hidden");
}

btnCrear.addEventListener("click", () => {
    hideAllPanels();
    panelGenerar.classList.remove("hidden");
});

btnAjustar.addEventListener("click", () => {
    hideAllPanels();
    panelAjustar.classList.remove("hidden");
});

btnProyectos.addEventListener("click", () => {
    hideAllPanels();
    panelProyectos.classList.remove("hidden");
    loadProjects();
});

btnAjustes.addEventListener("click", () => {
    hideAllPanels();
    panelAjustes.classList.remove("hidden");
});

// ===========================
// NUEVA LANDING (RESET SUAVE)
// ===========================

btnNueva.addEventListener("click", () => {
    userPrompt.value = "";
    ajustarPrompt.value = "";
    renderPreview("<h3 style='padding:20px;color:gray;'>Vista previa aquí…</h3>");
    hideAllPanels();
    panelGenerar.classList.remove("hidden");
    setPreviewMode("desktop");
});

// ===========================
// GENERAR LANDING
// ===========================

async function generarLanding() {
    const prompt = userPrompt.value.trim();
    if (!prompt) return alert("Ingresa una descripción para la landing.");

    showLoading();

    try {
        const res = await fetch("/api/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();
        hideLoading();

        if (!data.output) return alert("Error generando la landing.");

        const html = cleanHTML(data.output);

        renderPreview(html);
        saveProject(html);

    } catch (e) {
        hideLoading();
        console.error(e);
        alert("Error inesperado al generar la landing.");
    }
}

generateBtn.addEventListener("click", generarLanding);

// ===========================
// AJUSTAR LANDING
// ===========================

async function ajustarLanding() {
    const last = localStorage.getItem("lastLanding");
    if (!last) return alert("Primero genera una landing.");

    const mod = ajustarPrompt.value.trim();
    if (!mod) return alert("Describe qué quieres ajustar o agregar.");

    const prompt = `
Ajusta esta landing según:
Acción: ${mod}
Posición: ${ajustarPosicion.value}

HTML:
${last}
`;

    showLoading();

    try {
        const res = await fetch("/api/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();
        hideLoading();

        if (!data.output) return alert("Error ajustando la landing.");

        const html = cleanHTML(data.output);

        localStorage.setItem("lastLanding", html);
        renderPreview(html);
        saveProject(html);

    } catch (e) {
        hideLoading();
        console.error(e);
        alert("Error inesperado al ajustar la landing.");
    }
}

adjustBtn.addEventListener("click", ajustarLanding);

// ===========================
// SISTEMA DE PROYECTOS
// ===========================

function generateID() {
    return "land-" + Date.now();
}

function saveProject(html) {
    const id = generateID();

    const project = {
        id,
        html: cleanHTML(html),
        date: new Date().toLocaleString(),
        url: `/l/${id}` // reservado para futuro hosting real
    };

    let all = JSON.parse(localStorage.getItem("projects") || "[]");
    all.unshift(project);
    localStorage.setItem("projects", JSON.stringify(all));
    localStorage.setItem("lastLanding", project.html);

    loadProjects();
}

function loadProjects() {
    const all = JSON.parse(localStorage.getItem("projects") || "[]");

    if (all.length === 0) {
        projectList.innerHTML = "<p style='opacity:0.6;font-size:12px;'>Aún no tienes proyectos.</p>";
        return;
    }

    projectList.innerHTML = all.map(p => {
        const safeHTML = cleanHTML(p.html)
            .replace(/`/g, "&#96;")
            .replace(/"/g, "&quot;");

        return `
        <div class="proj-item">
            <div class="proj-thumb">
                <iframe srcdoc="${safeHTML}"></iframe>
            </div>
            <div class="proj-info">
                <strong>${p.id}</strong>
                <span>${p.date}</span>
            </div>
            <div class="proj-actions">
                <button onclick="verProyecto('${p.id}')" title="Ver en vista previa">👁 Ver</button>
                <button onclick="descargarHTML('${p.id}')" title="Descargar HTML de este proyecto">⬇</button>
                <button onclick="borrarProyecto('${p.id}')" title="Borrar proyecto">🗑</button>
            </div>
        </div>`;
    }).join("");
}

window.verProyecto = function(id) {
    const all = JSON.parse(localStorage.getItem("projects") || "[]");
    const p = all.find(x => x.id === id);
    if (!p) return;

    renderPreview(p.html);
    localStorage.setItem("lastLanding", p.html);
};

window.descargarHTML = function(id) {
    const all = JSON.parse(localStorage.getItem("projects") || "[]");
    const p = all.find(x => x.id === id);
    if (!p) return;

    const clean = cleanHTML(p.html);
    const blob = new Blob([clean], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${id}.html`;
    link.click();
};

window.borrarProyecto = function(id) {
    let all = JSON.parse(localStorage.getItem("projects") || "[]");
    all = all.filter(x => x.id !== id);
    localStorage.setItem("projects", JSON.stringify(all));
    loadProjects();
};

// ===========================
// NAVBAR ACCIONES (ARRIBA DERECHA)
// ===========================

btnAbrir.addEventListener("click", () => {
    const html = localStorage.getItem("lastLanding");
    if (!html) return alert("No hay landing actual para abrir.");

    const win = window.open("", "_blank");
    win.document.write(cleanHTML(html));
    win.document.close();
});

btnCopiar.addEventListener("click", () => {
    const html = localStorage.getItem("lastLanding");
    if (!html) return alert("No hay landing actual para copiar.");

    navigator.clipboard.writeText(cleanHTML(html));
    alert("HTML copiado al portapapeles.");
});

btnDescargar.addEventListener("click", () => {
    const html = localStorage.getItem("lastLanding");
    if (!html) return alert("No hay landing actual para descargar.");

    const clean = cleanHTML(html);
    const blob = new Blob([clean], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `landing.html`;
    link.click();
});

// ===========================
// AJUSTES: RESET TOTAL
// ===========================

resetTodoBtn.addEventListener("click", () => {
    const ok = confirm("¿Seguro que quieres borrar TODOS los proyectos y reiniciar la app?");
    if (!ok) return;

    localStorage.removeItem("projects");
    localStorage.removeItem("lastLanding");
    userPrompt.value = "";
    ajustarPrompt.value = "";
    renderPreview("<h3 style='padding:20px;color:gray;'>Vista previa aquí…</h3>");
    loadProjects();
});

// ===========================
// TEMA CLARO/OSC
// ===========================

toggleTheme.addEventListener("click", () => {
    const html = document.getElementById("htmlTag");
    const mode = html.getAttribute("data-theme");

    if (mode === "dark") {
        html.setAttribute("data-theme", "light");
        toggleTheme.textContent = "☀️";
        toggleTheme.title = "Cambiar a modo oscuro";
    } else {
        html.setAttribute("data-theme", "dark");
        toggleTheme.textContent = "🌙";
        toggleTheme.title = "Cambiar a modo claro";
    }
});

// Estado inicial
renderPreview("<h3 style='padding:20px;color:gray;'>Vista previa aquí…</h3>");
hideAllPanels();
panelGenerar.classList.remove("hidden");









