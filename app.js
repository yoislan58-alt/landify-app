// -------------------------------------------------
// LANDIFY BUILDER PRO — APP.JS (FASE 6 + ARREGLOS)
// -------------------------------------------------


// ===============================================
// MÓDULO 1 — SLUGIFIER
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

const btnGuardar = document.getElementById("btn-guardar");
const btnNueva = document.getElementById("btn-nueva");
const toggleProyectos = document.getElementById("toggle-proyectos");

const preview = document.getElementById("preview-container");
const loader = document.getElementById("loader");

const btnDescargar = document.getElementById("btn-descargar");
const btnPantalla = document.getElementById("btn-fullscreen");

const proyectosLista = document.getElementById("proyectos-lista");

// Vista responsiva
const btnMobile = document.getElementById("btn-mobile");
const btnTablet = document.getElementById("btn-tablet");
const btnDesktop = document.getElementById("btn-desktop");
const btnNormal = document.getElementById("btn-normal");
const responsiveWrapper = document.getElementById("responsive-frame-wrapper");
const responsiveFrame = document.getElementById("responsive-frame");
const viewportContainer = document.getElementById("viewport-container");


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
// UTILIDADES LOCALSTORAGE
// ===============================================
function getProyectos() {
    return JSON.parse(localStorage.getItem("proyectos") || "[]");
}

function setProyectos(lista) {
    localStorage.setItem("proyectos", JSON.stringify(lista));
}


// ===============================================
// GUARDAR PROYECTO
// ===============================================
function guardarProyecto(slug, html) {
    const proyectos = getProyectos();

    // si ya existe con ese slug, lo actualizamos
    const idx = proyectos.findIndex(p => p.slug === slug);
    const nuevo = {
        slug,
        html,
        fecha: new Date().toISOString()
    };

    if (idx >= 0) {
        proyectos[idx] = nuevo;
    } else {
        proyectos.unshift(nuevo);
    }

    setProyectos(proyectos);
    renderProyectos();
    alert("Landing guardada en Mis Proyectos.");
}


// ===============================================
// RENDER PROYECTOS + SUBMENÚ
// ===============================================
function renderProyectos() {
    const proyectos = getProyectos();
    proyectosLista.innerHTML = "";

    proyectos.forEach(p => {
        const item = document.createElement("div");
        item.className = "project-item";
        item.textContent = p.slug;

        const submenu = document.createElement("div");
        submenu.className = "project-options";

        const btnAbrir = document.createElement("button");
        btnAbrir.textContent = "Abrir";
        btnAbrir.onclick = () => {
            updatePreview(p.html);
        };

        const btnFull = document.createElement("button");
        btnFull.textContent = "Vista completa";
        btnFull.onclick = () => {
            const win = window.open("", "_blank");
            win.document.write(p.html);
            win.document.close();
        };

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
// URL LIMPIA (FASE 6 — HASH #/p/slug)
// ===============================================
function copiarURL(slug) {
    const url = `${window.location.origin}/#/p/${slug}`;
    navigator.clipboard.writeText(url)
        .then(() => alert("URL copiada:\n" + url))
        .catch(() => alert("No se pudo copiar. URL:\n" + url));
}

function cargarLandingDesdeURL() {
    const hash = window.location.hash;
    if (!hash.startsWith("#/p/")) return;

    const slug = hash.replace("#/p/", "").trim();
    if (!slug) return;

    const proyectos = getProyectos();
    const proyecto = proyectos.find(p => p.slug === slug);
    if (proyecto) {
        updatePreview(proyecto.html);
    }
}

window.addEventListener("load", cargarLandingDesdeURL);
window.addEventListener("hashchange", cargarLandingDesdeURL);


// ===============================================
// GENERAR LANDING (LLAMADA A /api/openai)
// ===============================================
async function generarLanding(prompt, modo) {
    try {
        showLoading();

        const resp = await fetch("/api/openai", {
            method: "POST",
            body: JSON.stringify({ prompt, mode: modo })
        });

        const data = await resp.json();
        hideLoading();

        if (!data.html) {
            alert("Error generando landing");
            return null;
        }

        // IMPORTANTE:
        // Si es "create": montamos landing completa
        // Si es "adjust": devolvemos solo el HTML para agregar, sin tocar lo anterior
        if (modo === "create") {
            updatePreview(data.html);
        }

        return data.html;

    } catch (err) {
        hideLoading();
        console.error(err);
        alert("Error generando landing.");
        return null;
    }
}


// ===============================================
// EVENTOS — CREAR LANDING
// ===============================================
btnCrear.onclick = async () => {
    const p = promptCrear.value.trim();
    if (p.length < 4) {
        alert("Describe tu landing primero.");
        return;
    }
    await generarLanding(p, "create");
};

btnRestaurarCrear.onclick = () => {
    promptCrear.value = "";
};


// ===============================================
// EVENTOS — AJUSTAR / AGREGAR SECCIÓN
// ===============================================
btnAjustar.onclick = async () => {
    const p = promptAjustar.value.trim();
    if (p.length < 4) {
        alert("Describe qué quieres agregar o ajustar.");
        return;
    }

    const seccion = await generarLanding(p, "adjust");
    if (!seccion) return;

    // 👉 YA NO BORRA LO QUE ESTABA
    // Solo agrega al final de la landing existente
    preview.innerHTML += "\n\n" + seccion;
};

btnRestaurarAjustar.onclick = () => {
    promptAjustar.value = "";
};


// ===============================================
// BOTÓN GUARDAR LANDING
// ===============================================
btnGuardar.onclick = () => {
    const html = preview.innerHTML.trim();
    if (!html) {
        alert("No hay landing generada para guardar.");
        return;
    }

    let base = promptCrear.value.trim();
    if (base.length < 3) {
        const nombreManual = window.prompt("Pon un nombre para esta landing:", "mi-landing");
        if (!nombreManual) return;
        base = nombreManual;
    }

    const slug = crearSlug(base);
    guardarProyecto(slug, html);
};


// ===============================================
// NUEVA LANDING (LIMPIAR)
// ===============================================
btnNueva.onclick = () => {
    preview.innerHTML = "";
    promptCrear.value = "";
    promptAjustar.value = "";
    alert("Listo, puedes crear una nueva landing.");
};


// ===============================================
// ACORDEÓN "MIS PROYECTOS"
// ===============================================
toggleProyectos.onclick = () => {
    if (proyectosLista.style.display === "block") {
        proyectosLista.style.display = "none";
    } else {
        proyectosLista.style.display = "block";
    }
};


// ===============================================
// DESCARGAR HTML
// ===============================================
btnDescargar.onclick = () => {
    const html = preview.innerHTML.trim();
    if (!html) return alert("No hay landing para descargar.");
    const base = promptCrear.value.trim() || "landing-generada";
    const slug = crearSlug(base);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = slug + ".html";
    a.click();

    URL.revokeObjectURL(url);
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
// VISTAS RESPONSIVE (SIN ZOOM EXTRA)
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

btnNormal.onclick = () => {
    responsiveWrapper.style.display = "none";
    preview.style.display = "block";
};



















