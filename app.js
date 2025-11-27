// ===============================
//  VARIABLES Y ELEMENTOS
// ===============================
const generarBtn = document.getElementById("generarBtn");
const mejorarBtn = document.getElementById("mejorarBtn");
const guardarBtn = document.getElementById("guardarBtn");
const salida = document.getElementById("salida");
const promptInput = document.getElementById("promptInput");

// ===============================
//  GENERAR LANDING
// ===============================
async function generarLanding() {
    try {
        salida.innerHTML = "⏳ Generando landing, espera...";

        const prompt = promptInput.value.trim();
        if (!prompt) {
            alert("Escribe una descripción para generar la landing.");
            return;
        }

        // 🔥 IMPORTANTE: RUTA CORRECTA PARA VERCEL
        const response = await fetch("/api/openai", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        if (data.error) {
            salida.innerHTML = "❌ Error generando la landing.";
            console.error("Error:", data.error);
            return;
        }

        salida.innerHTML = data.output;
    } catch (error) {
        salida.innerHTML = "❌ Error inesperado generando landing.";
        console.error(error);
    }
}

// ===============================
//  MEJORAR PROMPT
// ===============================
async function mejorarPrompt() {
    try {
        const original = promptInput.value.trim();
        if (!original) {
            alert("Escribe algo para mejorar el prompt.");
            return;
        }

        const prompt = `Mejora este prompt para obtener un HTML atractivo y moderno: ${original}`;

        const response = await fetch("/api/openai", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        if (data.error) {
            console.error(data.error);
            alert("Error mejorando el prompt.");
            return;
        }

        promptInput.value = data.output;
    } catch (error) {
        console.error(error);
        alert("Error inesperado.");
    }
}

// ===============================
//  GUARDAR LANDING HTML
// ===============================
async function guardarLanding() {
    try {
        const html = salida.innerHTML.trim();

        if (!html) {
            alert("No hay landing generada para guardar.");
            return;
        }

        const id = Date.now().toString();

        // 🔥 RUTA CORRECTA PARA VERCEL
        const response = await fetch("/api/guardar-landing", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id, html })
        });

        const data = await response.json();

        if (data.error) {
            console.error(data.error);
            alert("Error guardando la landing.");
            return;
        }

        alert("Landing guardada correctamente. URL:\n" + data.url);

        window.open(data.url, "_blank");
    } catch (error) {
        console.error(error);
        alert("Error inesperado guardando la landing.");
    }
}

// ===============================
//  EVENTOS
// ===============================
generarBtn.addEventListener("click", generarLanding);
mejorarBtn.addEventListener("click", mejorarPrompt);
guardarBtn.addEventListener("click", guardarLanding);



















