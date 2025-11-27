const generateBtn = document.getElementById("generateBtn");
const adjustBtn = document.getElementById("adjustLandingBtn");
const verLandingBtn = document.getElementById("btn-ver-landing");
const previewFrame = document.getElementById("previewFrame");

const userPrompt = document.getElementById("userPrompt");
const ajustarPrompt = document.getElementById("ajustarPrompt");
const ajustarPosicion = document.getElementById("ajustarPosicion");

const loadingBox = document.getElementById("loading");


function showLoading() {
    loadingBox.classList.remove("hidden");
}
function hideLoading() {
    loadingBox.classList.add("hidden");
}

function renderPreview(html) {
    previewFrame.srcdoc = html;
}


// ==== GENERAR ====
async function generarLanding() {
    const prompt = userPrompt.value.trim();
    if (!prompt) return alert("Ingresa una descripción");

    showLoading();

    const res = await fetch("/api/openai", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    hideLoading();

    if (!data.output) return alert("Error generando la landing");

    localStorage.setItem("lastLanding", data.output);
    renderPreview(data.output);
}


// ==== AJUSTAR ====
async function ajustarLanding() {
    const last = localStorage.getItem("lastLanding");
    if (!last) return alert("Primero genera una landing");

    const mod = ajustarPrompt.value.trim();
    if (!mod) return alert("Ingresa qué ajustar");

    const prompt = `
Modifica esta landing HTML según:
Acción: ${mod}
Posición: ${ajustarPosicion.value}

HTML:
${last}
`;

    showLoading();

    const res = await fetch("/api/openai", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    hideLoading();

    if (!data.output) return alert("Error al ajustar");

    localStorage.setItem("lastLanding", data.output);
    renderPreview(data.output);
}


// ==== VER ÚLTIMA ====
function verLanding() {
    const html = localStorage.getItem("lastLanding");
    if (!html) return alert("No has generado ninguna landing");
    renderPreview(html);
}


generateBtn.addEventListener("click", generarLanding);
adjustBtn.addEventListener("click", ajustarLanding);
verLandingBtn.addEventListener("click", verLanding);













