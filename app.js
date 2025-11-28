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
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s\-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/\-+/g, "-")
        .substring(0, 60);
}



// =====================================================
// 🔥 MÓDULO 3 — MINIATURAS AUTOMÁTICAS PRO
// =====================================================

// 📌 Convierte un HTML en una miniatura PNG (canvas)
async function generarMiniatura(html) {
    return new Promise((resolve) => {
        const iframe = document.createElement("iframe");
        iframe.style.width = "1200px"; // tamaño real
        iframe.style.height = "2000px";
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px"; // oculto
        document.body.appendChild(iframe);

        iframe.contentDocument.open();
        iframe.contentDocument.write(html);
        iframe.contentDocument.close();

        setTimeout(() => {
            html2canvas(iframe.contentDocument.body, {
                width: 1200,
                height: 900,
                windowWidth: 1200
            }).then(canvas => {
                const img = canvas.toDataURL("image/png");
                iframe.remove();
                resolve(img);
            });
        }, 500);
    });
}



// =====================================================
// 🔥 MÓDULO 2 — SISTEMA DE PROYECTOS (con thumbnails)
// =====================================================

// Cargar proyectos desde localStorage
function cargarProyectos() {
    const data = localStorage.getItem("landify_proyectos");
    return data ? JSON.parse(data) : [];
}

// Guardar proyectos
function guardarProyectos(lista) {
    localStorage.setItem("landify_proyectos", JSON.stringify(lista));
}

// Guardar un PROYECTO completo (incluye miniatura)
async function guardarProyecto(titulo, slug, html, tipo = "create") {

    // generar thumbnail
    const thumbnail = await generarMiniatura(html);

    const proyectos = cargarProyectos();

    proyectos.push({
        id: slug,
        titulo,
        html,
        tipo,
        fecha: new Date().toISOString(),
        thumbnail
    });

    guardarProyectos(proyectos);
    renderMisProyectos();
}



// =====================================================
// RENDER DE PROYECTOS CON MINIATURAS PRO
// =====================================================
function renderMisProyectos() {
    const cont = document.getElementById("proyectos-lista");
    if (!cont) return;

    const proyectos = cargarProyectos();

    cont.innerHTML = "";

    if (proyectos.length === 0) {
        cont.innerHTML = "<p style='opacity:0.6;'>No tienes proyectos todavía.</p>";
        return;
    }

    proyectos.forEach(proy => {
        const item = document.createElement("div");
        item.className = "project-item";
        item.style.cursor = "pointer";

        item.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <img src="${proy.thumbnail}" 
                     style="width:70px; height:50px; border-radius:6px; object-fit:cover;">
                <div>
                    <div style="font-size:14px; font-weight:600;">${proy.titulo}</div>
                    <div style="font-size:11px; opacity:0.6;">
                        ${new Date(proy.fecha).toLocaleString()}
                    </div>
                </div>
            </div>
        `;

        item.addEventListener("click", () => {
            cargarProyectoEnPreview(proy.id);
        });

        cont.appendChild(item);
    });
}



// =====================================================
// Cargar proyecto al preview
// =====================================================
function cargarProyectoEnPreview(id) {
    const proyectos = cargarProyectos();
    const proy = proyectos.find(p => p.id === id);

    if (!proy) return alert("Proyecto no encontrado.");

    updatePreview(proy.html);
}



// =====================================================
// ELEMENTOS
// =====================================================
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



// =====================================================
// UTILIDADES
// =====================================================

function showLoading() {
    loader.style.display = "flex";
}

function hideLoading() {
    loader.style.display = "none";
}

function updatePreview(html) {
    preview.innerHTML = html;
}

function descargarHTML(nombre, contenido) {
    const blob = new Blob([contenido], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = nombre + ".html";
    a.click();

    URL.revokeObjectURL(url);
}



// =====================================================
// BACKEND
// =====================================================
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
            alert("Error generando la landing");
            return;
        }

        updatePreview(data.html);

        localStorage.setItem("ultimaLanding", data.html);

        return data.html;

    } catch (err) {
        hideLoading();
        alert("Error generando la landing");
    }
}



// =====================================================
// CREAR LANDING
// =====================================================
btnCrear.addEventListener("click", async () => {
    const p = promptCrear.value.trim();
    if (p.length < 5) return alert("Describe tu landing primero.");

    const html = await generarLanding(p, "create");
    if (!html) return;

    const slug = crearSlug(p);
    const titulo = p.substring(0, 40) + "...";

    await guardarProyecto(titulo, slug, html, "create");
});

btnRestaurarCrear.addEventListener("click", () => promptCrear.value = "");



// =====================================================
// AJUSTAR LANDING
// =====================================================
btnAjustar.addEventListener("click", async () => {
    const p = promptAjustar.value.trim();
    if (p.length < 5) return alert("Describe qué ajustar/agregar.");

    const nuevaSeccion = await generarLanding(p, "adjust");
    if (!nuevaSeccion) return;

    preview.innerHTML += "\n\n" + nuevaSeccion;

    const slug = crearSlug("ajuste-" + p);
    const titulo = "Ajuste: " + p.substring(0, 25) + "...";

    await guardarProyecto(titulo, slug, preview.innerHTML, "adjust");
});

btnRestaurarAjustar.addEventListener("click", () => promptAjustar.value = "");



// =====================================================
// DESCARGAR
// =====================================================
btnDescargar.addEventListener("click", () => {
    const html = preview.innerHTML.trim();
    if (!html) return alert("No hay landing para descargar.");
    descargarHTML("landing-generada", html);
});



// =====================================================
// PANTALLA COMPLETA
// =====================================================
btnPantalla.addEventListener("click", () => {
    const win = window.open("", "_blank");
    win.document.write(preview.innerHTML);
    win.document.close();
});



// =====================================================
// ON LOAD
// =====================================================
window.addEventListener("load", () => {
    const ultima = localStorage.getItem("ultimaLanding");
    if (ultima) updatePreview(ultima);

    renderMisProyectos();
});

// -------------------------------------
// MÓDULO 4 — VISTA RESPONSIVE PRO
// -------------------------------------

const btnMobile   = document.getElementById("btn-mobile");
const btnTablet   = document.getElementById("btn-tablet");
const btnDesktop  = document.getElementById("btn-desktop");

const responsiveWrapper = document.getElementById("responsive-frame-wrapper");
const responsiveFrame   = document.getElementById("responsive-frame");

function cargarEnResponsive() {
    const html = preview.innerHTML.trim();
    const doc = responsiveFrame.contentWindow.document;

    doc.open();
    doc.write(html);
    doc.close();
}

function activarResponsive(tipo) {
    preview.style.display = "none";  
    responsiveWrapper.style.display = "block";

    responsiveWrapper.classList.remove("responsive-mobile","responsive-tablet","responsive-desktop");
    responsiveWrapper.classList.add(tipo);

    cargarEnResponsive();
}

btnMobile.addEventListener("click", () => {
    activarResponsive("responsive-mobile");
});

btnTablet.addEventListener("click", () => {
    activarResponsive("responsive-tablet");
});

btnDesktop.addEventListener("click", () => {
    activarResponsive("responsive-desktop");
});

// Volver a la vista normal si recargan
window.addEventListener("load", () => {
    responsiveWrapper.style.display = "none";
});













