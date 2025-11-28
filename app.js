// -------------------------------------------------
// LANDIFY BUILDER PRO — APP.JS FINAL (FASE 6 PRO)
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

const proyectosLista = document.getElementById("proyectos-lista");

// Vista responsiva
const btnMobile = document.getElementById("btn-mobile");
const btnTablet = document.getElementById("btn-tablet");
const btnDesktop = document.getElementById("btn-desktop");
const btnZoomIn = document.getElementById("btn-zoom-in");
const btnZoomOut = document.getElementById("btn-zoom-out");
const btnZoomReset = document.getElementById("btn-zoom-reset");
const btnNormal = document.getElementById("btn-normal");

const responsiveWrapper = document.getElementById("responsive-frame-wrapper");
const responsiveFrame = document.getElementById("responsive-frame");
const viewportContainer = document.getElementById("viewport-container");

let zoomScale = 1;



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
// PREVIEW SYSTEM
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
// GENERAR LANDING (LLAMADA IA)
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

        // Guardar proyecto
        const slug = crearSlug(prompt);
        guardarProyecto(slug, data.html);

        return data.html;

    } catch (error) {
        hideLoading();
        alert("Error generando landing.");
        console.error(error);
        return null;
    }
}



// ===============================================
// MÓDULO 3 — PROYECTOS (LOCALSTORAGE)
// ===============================================
function guardarProyecto(slug, html) {
    const proyectos = JSON.parse(localStorage.getItem("proyectos") || "[]");

    const proyecto = {
        slug,
        html,
        fecha: new Date().toISOString()
    };

    proyectos.unshift(proyecto);

    localStorage.setItem("proyectos", JSON.stringify(proyectos));

    renderProyectos();
}


function renderProyectos() {
    const proyectos = JSON.parse(localStorage.getItem("proyectos") || "[]");
    proyectosLista.innerHTML = "";

    proyectos.forEach(p => {
        const item = document.createElement("div");
        item.className = "project-item";
        item.textContent = p.slug;

        const submenu = document.createElement("div");
        submenu.className = "project-options";

        // Botón abrir
        const btnAbrir = document.createElement("button");
        btnAbrir.textContent = "Abrir";
        btnAbrir.onclick = () => updatePreview(p.html);

        // Botón vista completa
        const btnFull = document.createElement("button");
        btnFull.textContent = "Vista Completa";
        btnFull.onclick = () => {
            const win = window.open("", "_blank");
            win.document.write(p.html);
            win.document.close();
        };

        // Botón copiar URL
        const btnCopy = document.createElement("button");
        btnCopy.textContent = "Copiar URL";
        btnCopy.onclick = () => copiarURL(p.slug);

        submenu.appendChild(btnAbrir);
        submenu.appendChild(btnFull);
        submenu.appendChild(btnCopy);

        item.onclick = () => {
            submenu.style.display = submenu.style.display === "block" ? "none" : "block";
        };

        proyectosLista.appendChild(item);
        proyectosLista.appendChild(submenu);
    });
}

renderProyectos();



// ===============================================
// MÓDULO 6 — URL LIMPIA (FASE 6 PRO)
// ===============================================
function copiarURL(slug) {
    const url = `${window.location.origin}/#/p/${slug}`;
    navigator.clipboard.writeText(url);
    alert("URL copiada:\n" + url);
}

function cargarLandingDesdeURL() {
    const hash = window.location.hash;

    if (!hash.startsWith("#/p/")) return;

    const slug = hash.replace("#/p/", "").trim();
    if (!slug) return;

    const proyectos = JSON.parse(localStorage.getItem("proyectos") || "[]");
    const proyecto = proyectos.find(p => p.slug === slug);

    if (proyecto) {
        updatePreview(proyecto.html);
    }
}

window.addEventListener("load", cargarLandingDesdeURL);
window.addEventListener("hashchange", cargarLandingDesdeURL);



// ===============================================
// EVENTOS — CREAR LANDING
// ===============================================
btnCrear.onclick = async () => {
    const p = promptCrear.value.trim();
    if (p.length < 4) return alert("Describe tu landing primero.");

    await generarLanding(p, "create");
};

btnRestaurarCrear.onclick = () => {
    promptCrear.value = "";
};



// ===============================================
// EVENTOS — AJUSTAR LANDING
// ===============================================
btnAjustar.onclick = async () => {
    const p = promptAjustar.value.trim();
    if (p.length < 4) return alert("Describe qué agregar.");

    const nueva = await generarLanding(p, "adjust");
    if (!nueva) return;

    preview.innerHTML += "\n\n" + nueva;
};

btnRestaurarAjustar.onclick = () => {
    promptAjustar.value = "";
};



// ===============================================
// NUEVA LANDING
// ===============================================
btnNueva.onclick = () => {
    preview.innerHTML = "";
    promptCrear.value = "";
    promptAjustar.value = "";
    alert("Listo para crear una nueva landing.");
};



// ===============================================
// DESCARGAR
// ===============================================
btnDescargar.onclick = () => {
    const html = preview.innerHTML.trim();
    if (!html) return alert("No hay landing para descargar.");

    descargarHTML("landing-generada", html);
};



// ===============================================
// PANTALLA COMPLETA
// ===============================================
btnPantalla.onclick = () => {
    const win = window.open("", "_blank");
    win.document.write(preview.innerHTML);
    win.document.close();
};



// ===============================================
// TEMA CLARO / OSCURO
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
// ZOOM
// ===============================================
btnZoomIn.onclick = () => {
    zoomScale += 0.1;
    viewportContainer.style.transform = `scale(${zoomScale})`;
};

btnZoomOut.onclick = () => {
    zoomScale -= 0.1;
    if (zoomScale < 0.2) zoomScale = 0.2;
    viewportContainer.style.transform = `scale(${zoomScale})`;
};

btnZoomReset.onclick = () => {
    zoomScale = 1;
    viewportContainer.style.transform = "scale(1)";
};



// ===============================================
// VOLVER VISTA NORMAL
// ===============================================
btnNormal.onclick = () => {
    responsiveWrapper.style.display = "none";
    preview.style.display = "block";
};





















