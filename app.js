// -------------------------------------------------
// LANDIFY BUILDER PRO — APP.JS COMPLETO
// -------------------------------------------------


// ===============================================
// MÓDULO 1 — SLUGIFIER PRO
// ===============================================
function crearSlug(texto) {
    return texto
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s\-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/\-+/g, "-")
        .substring(0, 60);
}


// ===============================================
// ELEMENTOS
// ===============================================
const promptCrear = document.getElementById("prompt-crear");
const btnCrear = document.getElementById("btn-crear");

const promptAjustar = document.getElementById("prompt-ajustar");
const btnAjustar = document.getElementById("btn-ajustar");

const btnRestaurarCrear = document.getElementById("restore-crear");
const btnRestaurarAjustar = document.getElementById("restore-ajustar");

const preview = document.getElementById("preview-container");
const loader = document.getElementById("loader");

const btnDescargar = document.getElementById("btn-descargar");
const btnPantalla = document.getElementById("btn-fullscreen");
const btnNueva = document.getElementById("btn-nueva");

const btnProyectosToggle = document.getElementById("btn-proyectos-toggle");
const proyectosLista = document.getElementById("proyectos-lista");

// Botones de vista
const btnMobile = document.getElementById("btn-mobile");
const btnTablet = document.getElementById("btn-tablet");
const btnDesktop = document.getElementById("btn-desktop");
const btnNormal = document.getElementById("btn-normal");

// Responsive
const responsiveWrapper = document.getElementById("responsive-frame-wrapper");
const responsiveFrame = document.getElementById("responsive-frame");
const viewportContainer = document.getElementById("viewport-container");

let zoomScale = 1; // por si luego quieres reactivar zoom


// ===============================================
// LOADER
// ===============================================
function showLoading() {
    loader.style.display = "flex";
}

function hideLoading() {
    loader.style.display = "none";
}


// ===============================================
// PREVIEW NORMAL / RESPONSIVE
// ===============================================
function updatePreview(html) {
    preview.style.display = "block";
    responsiveWrapper.style.display = "none";
    preview.innerHTML = html;
}

function updateResponsivePreview(html) {
    if (!html.trim()) return;

    preview.style.display = "none";
    responsiveWrapper.style.display = "block";

    const doc = responsiveFrame.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
}


// ===============================================
// DESCARGAR ARCHIVO
// ===============================================
function descargarHTML(nombre, contenido) {
    const blob = new Blob([contenido], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = nombre + ".html";
    a.click();

    URL.revokeObjectURL(url);
}


// ===============================================
// LLAMADA A BACKEND
// ===============================================
async function generarLanding(prompt, modo) {
    showLoading();
    try {
        const respuesta = await fetch("/api/openai", {
            method: "POST",
            body: JSON.stringify({
                prompt: prompt,
                mode: modo
            })
        });

        const data = await respuesta.json();

        if (!data || !data.html) {
            alert("Error generando la landing");
            return null;
        }

        // Modo CREAR → reemplaza todo y guarda proyecto
        if (modo === "create") {
            updatePreview(data.html);
            guardarProyecto(data.html, prompt);
        }

        // En ambos modos devolvemos el HTML
        return data.html;

    } catch (err) {
        console.error("ERROR generando landing:", err);
        alert("Ocurrió un error generando la landing");
        return null;
    } finally {
        hideLoading();
    }
}


// ===============================================
// PROYECTOS EN LOCALSTORAGE
// ===============================================
function guardarProyecto(html, prompt) {
    const slug = crearSlug(prompt) || "landing-" + Date.now();
    const proyectos = JSON.parse(localStorage.getItem("proyectos") || "[]");

    proyectos.unshift({
        slug,
        html,
        fecha: new Date().toISOString()
    });

    localStorage.setItem("proyectos", JSON.stringify(proyectos));
    renderProyectos();
}

function renderProyectos() {
    const proyectos = JSON.parse(localStorage.getItem("proyectos") || "[]");
    proyectosLista.innerHTML = "";

    if (!proyectos.length) {
        const vacio = document.createElement("div");
        vacio.style.fontSize = "13px";
        vacio.style.color = "#bdbdd2";
        vacio.textContent = "Aún no tienes landings guardadas.";
        proyectosLista.appendChild(vacio);
        return;
    }

    proyectos.forEach(p => {
        const item = document.createElement("div");
        item.className = "project-item";
        item.textContent = p.slug;

        item.onclick = () => {
            updatePreview(p.html);
        };

        proyectosLista.appendChild(item);
    });
}

// Render inicial
renderProyectos();


// ===============================================
// EVENTOS — CREAR LANDING
// ===============================================
btnCrear.addEventListener("click", async () => {
    const p = promptCrear.value.trim();
    if (p.length < 5) {
        alert("Describe tu landing primero.");
        return;
    }

    await generarLanding(p, "create");
});

btnRestaurarCrear.addEventListener("click", () => {
    promptCrear.value = "";
});


// ===============================================
// EVENTOS — AJUSTAR / AGREGAR SECCIÓN
// ===============================================
btnAjustar.addEventListener("click", async () => {
    const instruccion = promptAjustar.value.trim();
    if (instruccion.length < 5) {
        alert("Describe qué ajustar o agregar.");
        return;
    }

    const htmlActual = preview.innerHTML.trim();
    if (!htmlActual) {
        alert("Primero genera una landing antes de ajustar.");
        return;
    }

    // En el backend, el modo "adjust" debe devolver SOLO una sección HTML
    const nuevaSeccion = await generarLanding(instruccion, "adjust");
    if (!nuevaSeccion) return;

    // Agregamos la sección al final SIN tocar el resto
    preview.innerHTML += "\n\n" + nuevaSeccion;
});

btnRestaurarAjustar.addEventListener("click", () => {
    promptAjustar.value = "";
});


// ===============================================
// NUEVA LANDING
// ===============================================
btnNueva.addEventListener("click", () => {
    preview.innerHTML = "";
    promptCrear.value = "";
    promptAjustar.value = "";
    alert("Listo, puedes comenzar una nueva landing desde cero.");
});


// ===============================================
// PROYECTOS — ACORDEÓN
// ===============================================
btnProyectosToggle.addEventListener("click", () => {
    const visible = proyectosLista.style.display === "block";
    proyectosLista.style.display = visible ? "none" : "block";
});


// ===============================================
// DESCARGAR
// ===============================================
btnDescargar.addEventListener("click", () => {
    const html = preview.innerHTML.trim();
    if (!html) {
        alert("No hay landing para descargar.");
        return;
    }

    descargarHTML("landing-generada", html);
});


// ===============================================
// PANTALLA COMPLETA
// ===============================================
btnPantalla.addEventListener("click", () => {
    const html = preview.innerHTML.trim();
    if (!html) {
        alert("No hay landing para mostrar en pantalla completa.");
        return;
    }

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
});


// ===============================================
// MODO CLARO / OSCURO
// ===============================================
document.getElementById("toggle-theme").onclick = () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
};


// ===============================================
// MARCOS — VISTAS RESPONSIVE
// ===============================================
btnMobile.onclick = () => {
    viewportContainer.style.width = "390px";
    zoomScale = 1;
    viewportContainer.style.transform = "scale(1)";
    updateResponsivePreview(preview.innerHTML);
};

btnTablet.onclick = () => {
    viewportContainer.style.width = "820px";
    zoomScale = 1;
    viewportContainer.style.transform = "scale(1)";
    updateResponsivePreview(preview.innerHTML);
};

btnDesktop.onclick = () => {
    viewportContainer.style.width = "1280px";
    zoomScale = 1;
    viewportContainer.style.transform = "scale(1)";
    updateResponsivePreview(preview.innerHTML);
};


// ===============================================
// VOLVER A VISTA NORMAL
// ===============================================
btnNormal.onclick = () => {
    responsiveWrapper.style.display = "none";
    preview.style.display = "block";
};


// ===============================================
// CARGAR ÚLTIMA LANDING (opcional)
// ===============================================
window.addEventListener("load", () => {
    // Si quieres que cargue la última landing automáticamente,
    // puedes leerla de localStorage aquí.
    // Por ahora, solo mantenemos los proyectos en la lista.
});


















