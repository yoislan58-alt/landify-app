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

// Preview / acciones navbar
const previewFrame = document.getElementById("previewFrame");
const btnAbrir = document.getElementById("btnAbrir");
const btnCopiar = document.getElementById("btnCopiar");
const btnDescargar = document.getElementById("btnDescargar");

// Loading
const loadingBox = document.getElementById("loading");

// Tema
const toggleTheme = document.getElementById("toggleTheme");

// Proyectos
const projectList = document.getElementById("projectList");

// ===========================
// FUNCIONES DE UTILIDAD
// ===========================

function showLoading() {
    loadingBox.classList.remove("hidden");
}

function hideLoading() {
    loadingBox.classList.add("hidden");
}

function cleanHTML(html) {
    return html
        .replace(/```html/gi, "")
        .replace(/```/g, "")
        .trim();
}

function renderPreview(html) {
    previewFrame.srcdoc = cleanHTML(html);
}

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
// NUEVA LANDING (RESET)
// ===========================

btnNueva.addEventListener("click", () => {
    userPrompt.value = "";
    ajustarPrompt.value = "";
    renderPreview("<h3 style='padding:20px;color:gray;'>Vista previa aquí…</h3>");
    hideAllPanels();
    panelGenerar.classList.remove("hidden");
});

// ===========================
// GENERAR LANDING
// ===========================

async function generarLanding() {
    const prompt = userPrompt.value.trim();
    if (!prompt) return alert("Ingresa una descripción");

    showLoading();

    const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    hideLoading();

    if (!data.output) return alert("Error generando la landing");

    const html = cleanHTML(data.output);

    renderPreview(html);
    saveProject(html);
}

generateBtn.addEventListener("click", generarLanding);

// ===========================
// AJUSTAR LANDING
// ===========================

async function ajustarLanding() {
    const last = localStorage.getItem("lastLanding");
    if (!last) return alert("Primero genera una landing");

    const mod = ajustarPrompt.value.trim();
    if (!mod) return alert("Describe qué ajustar");

    const prompt = `
Ajusta esta landing según:
Acción: ${mod}
Posición: ${ajustarPosicion.value}

HTML:
${last}
`;

    showLoading();

    const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    hideLoading();

    if (!data.output) return alert("Error ajustando la landing");

    const html = cleanHTML(data.output);

    localStorage.setItem("lastLanding", html);
    renderPreview(html);
    saveProject(html);
}

adjustBtn.addEventListener("click", ajustarLanding);

// ===========================
// SISTEMA DE PROYECTOS PRO
// ===========================

function generateID() {
    return "land-" + Date.now();
}

function saveProject(html) {
    const id = generateID();

    const project = {
        id,
        html,
        date: new Date().toLocaleString(),
        url: `/l/${id}`
    };

    // guardar
    let all = JSON.parse(localStorage.getItem("projects") || "[]");
    all.unshift(project);
    localStorage.setItem("projects", JSON.stringify(all));

    localStorage.setItem("lastLanding", html);

    loadProjects();
}

function loadProjects() {
    const all = JSON.parse(localStorage.getItem("projects") || "[]");

    if (all.length === 0) {
        projectList.innerHTML = "<p style='opacity:0.6;'>Aún no tienes proyectos.</p>";
        return;
    }

    projectList.innerHTML = all
        .map(p => `
        <div class="proj-item">
            <div class="proj-info">
                <strong>${p.id}</strong>
                <span>${p.date}</span>
            </div>
            <div class="proj-actions">
                <button onclick="verProyecto('${p.id}')">👁</button>
                <button onclick="abrirURL('${p.url}')">🔗</button>
                <button onclick="copiarURL('${p.url}')">📋</button>
                <button onclick="descargarHTML('${p.id}')">⬇</button>
                <button onclick="borrarProyecto('${p.id}')">🗑</button>
            </div>
        </div>
    `).join("");
}

function verProyecto(id) {
    const all = JSON.parse(localStorage.getItem("projects") || "[]");
    const p = all.find(x => x.id === id);
    if (!p) return;

    renderPreview(p.html);
    localStorage.setItem("lastLanding", p.html);
}

function abrirURL(url) {
    alert("Cuando configuremos API de guardado real, esta ruta abrirá la landing:\n\n" + url);
}

function copiarURL(url) {
    navigator.clipboard.writeText(url);
    alert("URL copiada!");
}

function descargarHTML(id) {
    const all = JSON.parse(localStorage.getItem("projects") || "[]");
    const p = all.find(x => x.id === id);
    if (!p) return;

    const blob = new Blob([p.html], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${id}.html`;
    link.click();
}

function borrarProyecto(id) {
    let all = JSON.parse(localStorage.getItem("projects") || "[]");
    all = all.filter(x => x.id !== id);
    localStorage.setItem("projects", JSON.stringify(all));
    loadProjects();
}

// ===========================
// NAVBAR ACCIONES
// ===========================

btnAbrir.addEventListener("click", () => {
    alert("Cuando activemos guardado real, se abrirá en una URL limpia.");
});

btnCopiar.addEventListener("click", () => {
    const html = localStorage.getItem("lastLanding");
    if (!html) return alert("No hay landing actual");
    navigator.clipboard.writeText(html);
    alert("Código HTML copiado!");
});

btnDescargar.addEventListener("click", () => {
    const html = localStorage.getItem("lastLanding");
    if (!html) return alert("No hay landing actual");

    const blob = new Blob([html], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `landing.html`;
    link.click();
});

// ===========================
// TEMA
// ===========================

toggleTheme.addEventListener("click", () => {
    const html = document.getElementById("htmlTag");
    const mode = html.getAttribute("data-theme");

    if (mode === "dark") {
        html.setAttribute("data-theme", "light");
        toggleTheme.textContent = "☀️";
    } else {
        html.setAttribute("data-theme", "dark");
        toggleTheme.textContent = "🌙";
    }
});













