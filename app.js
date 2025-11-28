// ---------------------------
// LANDIFY BUILDER PRO – APP.JS
// ---------------------------


// ---------------------------
// MÓDULO 1 — SLUGIFIER PRO
// ---------------------------
function crearSlug(texto) {
    return texto
        .toString()
        .toLowerCase()
        .normalize("NFD")                     // separa acentos
        .replace(/[\u0300-\u036f]/g, "")       // elimina acentos
        .replace(/[^a-z0-9\s\-]/g, "")         // elimina símbolos
        .trim()
        .replace(/\s+/g, "-")                  // espacios → guiones
        .replace(/\-+/g, "-")                  // colapsa guiones dobles
        .substring(0, 60);                     // límite recomendado
}


// ---------------------------
// ELEMENTOS
// ---------------------------
const promptCrear = document.getElementById("prompt-crear");
const btnCrear = document.getElementById("btn-crear");

const promptAjustar = document.getElementById("prompt-ajustar");
const btnAjustar = document.getElementById("btn-ajustar");

const preview = document.getElementById("preview-container");
const loader = document.getElementById("loader");

const btnRestaurarCrear = document.getElementById("restore-crear");
const btnRestaurarAjustar = document.getElementById("restore-ajustar");

const btnDescargar = document.getElementById("btn-descargar");
const btnPantalla = document.getElementById("btn-fullscreen");


// ----------------------------
//   UTILIDADES
// ----------------------------

// Mostrar loader
function showLoading() {
    loader.style.display = "flex";
}

// Ocultar loader (¡Arreglado!)
function hideLoading() {
    loader.style.display = "none";
}

// Colocar HTML en la vista previa
function updatePreview(html) {
    preview.innerHTML = html;
}

// Descargar archivo HTML
function descargarHTML(nombre, contenido) {
    const blob = new Blob([contenido], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = nombre + ".html";
    a.click();

    URL.revokeObjectURL(url);
}


// ----------------------------
// LLAMADA AL BACKEND PRO
// ----------------------------
async function generarLanding(prompt, modo) {
    try {
        showLoading();

        const respuesta = await fetch("/api/openai", {
            method: "POST",
            body: JSON.stringify({
                prompt: prompt,
                mode: modo
            })
        });

        const data = await respuesta.json();

        hideLoading(); // SIEMPRE SE APAGA AQUÍ ✔

        if (!data.html) {
            alert("Error generando la landing");
            return;
        }

        // Actualizar preview
        updatePreview(data.html);

        // Guardar última landing en memoria local
        localStorage.setItem("ultimaLanding", data.html);

        return data.html;

    } catch (err) {
        hideLoading();
        console.error("ERROR:", err);
        alert("Ocurrió un error generando la landing");
    }
}


// ----------------------------
// EVENTOS – CREAR LANDING
// ----------------------------
btnCrear.addEventListener("click", async () => {
    const p = promptCrear.value.trim();
    if (p.length < 5) return alert("Describe tu landing primero.");

    const html = await generarLanding(p, "create");

    // Aquí usaremos el slug en Módulo 2 ✔
    // const slug = crearSlug(p);
});

// Restaurar cuadro crear
btnRestaurarCrear.addEventListener("click", () => {
    promptCrear.value = "";
});


// ----------------------------
// EVENTOS – AJUSTAR LANDING
// ----------------------------
btnAjustar.addEventListener("click", async () => {
    const p = promptAjustar.value.trim();
    if (p.length < 5) return alert("Describe qué ajustar/agregar.");

    const nuevaSeccion = await generarLanding(p, "adjust");

    if (!nuevaSeccion) return;

    // Insertar sección al final del preview
    preview.innerHTML += "\n\n" + nuevaSeccion;
});

// Restaurar cuadro ajustar
btnRestaurarAjustar.addEventListener("click", () => {
    promptAjustar.value = "";
});


// ----------------------------
// DESCARGAR HTML
// ----------------------------
btnDescargar.addEventListener("click", () => {
    const html = preview.innerHTML.trim();
    if (!html) return alert("No hay landing para descargar.");

    descargarHTML("landing-generada", html);
});


// ----------------------------
// MODO PANTALLA COMPLETA
// ----------------------------
btnPantalla.addEventListener("click", () => {
    const win = window.open("", "_blank");
    win.document.write(preview.innerHTML);
    win.document.close();
});


// ----------------------------
// CARGAR ÚLTIMA LANDING
// ----------------------------
window.addEventListener("load", () => {
    const ultima = localStorage.getItem("ultimaLanding");
    if (ultima) updatePreview(ultima);
});










