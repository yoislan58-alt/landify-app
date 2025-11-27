// ===============================
//  ELEMENTOS DEL DOM
// ===============================
const generateBtn = document.getElementById("generateBtn");
const adjustBtn = document.getElementById("adjustLandingBtn");
const verLandingBtn = document.getElementById("btn-ver-landing");

const userPrompt = document.getElementById("userPrompt");
const ajustarPrompt = document.getElementById("ajustarPrompt");
const ajustarPosicion = document.getElementById("ajustarPosicion");

const projectList = document.getElementById("projectList");
const loadingBox = document.getElementById("loading");


// ===============================
//  FUNCIONES helper
// ===============================
function showLoading() {
    loadingBox.classList.remove("hidden");
}

function hideLoading() {
    loadingBox.classList.add("hidden");
}

function notify(msg, type="ok") {
    const box = document.getElementById("notify");
    box.innerText = msg;
    box.className = "notify show " + type;

    setTimeout(() => box.className = "notify", 2500);
}


// ===============================
//  GENERAR LANDING (OPENAI)
// ===============================
async function generarLanding() {
    const prompt = userPrompt.value.trim();
    if (!prompt) {
        notify("Escribe una descripción primero", "error");
        return;
    }

    showLoading();

    try {
        const res = await fetch("/api/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();
        hideLoading();

        if (data.error) {
            console.error(data.error);
            notify("Error generando la landing", "error");
            return;
        }

        // Guardar temporalmente
        localStorage.setItem("lastLanding", data.output);

        notify("Landing generada correctamente");

        renderProject(data.output);

    } catch (err) {
        hideLoading();
        console.error(err);
        notify("Error inesperado", "error");
    }
}


// ===============================
//  AJUSTAR / AGREGAR SECCIÓN
// ===============================
async function ajustarLanding() {
    const original = localStorage.getItem("lastLanding") || "";
    if (!original) {
        notify("Primero genera una landing", "error");
        return;
    }

    const instruccion = ajustarPrompt.value.trim();
    if (!instruccion) {
        notify("Escribe qué quieres agregar o ajustar", "error");
        return;
    }

    const posicion = ajustarPosicion.value;

    const prompt = `
Eres un experto en HTML.
Toma esta landing y agrega/ajusta según lo siguiente:

- Acción solicitada: ${instruccion}
- Ubicación: ${posicion}

HTML ORIGINAL:
${original}
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

        if (!data.output) {
            notify("Error ajustando la landing", "error");
            return;
        }

        localStorage.setItem("lastLanding", data.output);
        renderProject(data.output);

        notify("Sección agregada / ajustada correctamente");

    } catch (err) {
        hideLoading();
        console.error(err);
        notify("Error inesperado", "error");
    }
}


// ===============================
//  MOSTRAR LANDING EN PANTALLA
// ===============================
function renderProject(html) {
    projectList.innerHTML = `
        <div class="proyecto-card">
            <iframe srcdoc="${html.replace(/"/g, '&quot;')}"></iframe>
        </div>
    `;
}


// ===============================
//  VER ÚLTIMA LANDING
// ===============================
function verLanding() {
    const html = localStorage.getItem("lastLanding");
    if (!html) {
        notify("Aún no has generado una landing", "error");
        return;
    }

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
}


// ===============================
//  EVENTOS
// ===============================
generateBtn.addEventListener("click", generarLanding);
adjustBtn.addEventListener("click", ajustarLanding);
verLandingBtn.addEventListener("click", verLanding);

console.log("🟦 app.js cargado correctamente");





















