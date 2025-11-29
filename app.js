// -------------------------------------------------
// LANDIFY BUILDER PRO — APP.JS COMPLETO Y FINAL
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
const btnGuardar = document.getElementById("btn-guardar");

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

let zoomScale = 1;


// ===============================================
// LOADER
// ===============================================
function showLoading() { loader.style.display = "flex"; }
function hideLoading() { loader.style.display = "none"; }


// ===============================================
// PREVIEW
// ===============================================
function updatePreview(html) {
    preview.style.display = "block";
    responsiveWrapper.style.display = "none";
    preview.innerHTML = html;
}

function updateResponsivePreview(html) {
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
// GENERAR LANDING
// ===============================================
async function generarLanding(prompt, modo) {
    try {
        showLoading();

        const respuesta = await fetch("/api/openai", {
            method: "POST",
            body: JSON.stringify({ prompt, mode: modo })
        });

        const data = await respuesta.json();
        hideLoading();

        if (!data.html) {
            alert("Error generando landing");
            return null;
        }

        updatePreview(data.html);
        return data.html;

    } catch (err) {
        hideLoading();
        alert("Error generando.");
        return null;
    }
}


// ===============================================
// GENERAR SECCIÓN (NUEVO y CORRECTO)
// ===============================================
async function generarSeccion(prompt) {
    showLoading();

    const respuesta = await fetch("/api/openai", {
        method: "POST",
        body: JSON.stringify({
            prompt,
            mode: "adjust-section"
        })
    });

    const data = await respuesta.json();
    hideLoading();

    return data.section || null;
}


// ===============================================
// MODULO 3 — PROYECTOS LOCALSTORAGE
// ===============================================
function guardarProyecto() {
    const html = preview.innerHTML.trim();
    if (!html) return alert("No hay landing para guardar.");

    const slug = crearSlug("landing-" + Date.now());
    const proyectos = JSON.parse(localStorage.getItem("proyectos") || "[]");

    proyectos.unshift({
        slug,
        html,
        fecha: new Date().toISOString()
    });

    localStorage.setItem("proyectos", JSON.stringify(proyectos));
    renderProyectos();

    alert("Proyecto guardado con éxito");
}

function renderProyectos() {
    const proyectos = JSON.parse(localStorage.getItem("proyectos") || "[]");
    proyectosLista.innerHTML = "";

    proyectos.forEach(p => {
        const item = document.createElement("div");
        item.className = "project-item";
        item.textContent = p.slug;

        item.onclick = () => updatePreview(p.html);

        proyectosLista.appendChild(item);
    });
}

renderProyectos();


// ===============================================
// EVENTOS — CREAR LANDING
// ===============================================
btnCrear.addEventListener("click", async () => {
    const p = promptCrear.value.trim();
    if (p.length < 4) return alert("Escribe una descripción primero.");

    await generarLanding(p, "create");
});

btnRestaurarCrear.addEventListener("click", () => {
    promptCrear.value = "";
});


// ===============================================
// EVENTOS — AJUSTAR / AGREGAR SECCIÓN (FINAL)
// ===============================================
btnAjustar.addEventListener("click", async () => {
    const p = promptAjustar.value.trim();
    if (p.length < 4) return alert("Escribe qué agregar.");

    const seccion = await generarSeccion(p);
    if (!seccion) return alert("No se pudo generar la sección.");

    preview.innerHTML += "\n\n" + seccion;
});

btnRestaurarAjustar.addEventListener("click", () => {
    promptAjustar.value = "";
});


// ===============================================
// GUARDAR PROYECTO
// ===============================================
btnGuardar.onclick = guardarProyecto;


// ===============================================
// NUEVA LANDING
// ===============================================
btnNueva.addEventListener("click", () => {
    preview.innerHTML = "";
    promptCrear.value = "";
    promptAjustar.value = "";
    alert("Listo: proyecto limpio para empezar uno nuevo");
});


// ===============================================
// DESCARGAR
// ===============================================
btnDescargar.addEventListener("click", () => {
    const html = preview.innerHTML.trim();
    if (!html) return alert("No hay landing para descargar.");
    descargarHTML("landing-generada", html);
});


// ===============================================
// PANTALLA COMPLETA
// ===============================================
btnPantalla.addEventListener("click", () => {
    const win = window.open("", "_blank");
    win.document.write(preview.innerHTML);
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
// MARCOS APPLE — VISTAS
// ===============================================
btnMobile.onclick = () => {
    viewportContainer.style.width = "390px";
    updateResponsivePreview(preview.innerHTML);
};

btnTablet.onclick = () => {
    viewportContainer.style.width = "820px";
    updateResponsivePreview(preview.innerHTML);
};

btnDesktop.onclick = () => {
    viewportContainer.style.width = "1280px";
    updateResponsivePreview(preview.innerHTML);
};


// ===============================================
// VOLVER A VISTA NORMAL
// ===============================================
btnNormal.onclick = () => {
    responsiveWrapper.style.display = "none";
    preview.style.display = "block";
};




















