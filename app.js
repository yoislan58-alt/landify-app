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
// 🔥 MÓDULO 2 — SISTEMA DE PROYECTOS (sin backend)
// =====================================================

// Cargar proyectos desde localStorage
function cargarProyectos() {
    const data = localStorage.getItem("landify_proyectos");
    return data ? JSON.parse(data) : [];
}

// Guardar proyectos en localStorage
function guardarProyectos(lista) {
    localStorage.setItem("landify_proyectos", JSON.stringify(lista));
}

// Crear un proyecto nuevo
function guardarProyecto(titulo, slug, html, tipo = "create") {
    const proyectos = cargarProyectos();

    proyectos.push({
        id: slug,
        titulo: titulo,
        html: html,
        tipo: tipo,
        fecha: new Date().toISOString()
    });

    guardarProyectos(proyectos);
    renderMisProyectos();
}

// Renderizar listado en “Mis Proyectos”
function renderMisProyectos() {
    const cont = document.getElementById("lista-proyectos");
    if (!cont) return; // si aún no existe en index.html

    const proyectos = cargarProyectos();

    cont.innerHTML = "";

    if (proyectos.length === 0) {
        cont.innerHTML = "<p>No tienes proyectos todavía.</p>";
        return;
    }

    proyectos.forEach(proy => {
        const card = document.createElement("div");
        card.className = "proyecto-item";
        card.innerHTML = `
            <button class="proyecto-btn" data-id="${proy.id}">
                <strong>${proy.titulo}</strong>
                <span>${new Date(proy.fecha).toLocaleString()}</span>
            </button>
        `;
        cont.appendChild(card);
    });

    // Evento para cargar proyectos
    document.querySelectorAll(".proyecto-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            cargarProyectoEnPreview(id);
        });
    });
}

// Cargar un proyecto en el preview
function cargarProyectoEnPreview(id) {
    const proyectos = cargarProyectos();
    const proy = proyectos.find(p => p.id === id);

    if (!proy) return alert("Proyecto no encontrado");

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

// Mostrar loader
function showLoading() {
    loader.style.display = "flex";
}

// Ocultar loader
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



// =====================================================
// LLAMADA AL BACKEND
// =====================================================
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
        hideLoading();

        if (!data.html) {
            alert("Error generando la landing");
            return;
        }

        updatePreview(data.html);

        // Guardar última landing
        localStorage.setItem("ultimaLanding", data.html);

        return data.html;

    } catch (err) {
        hideLoading();
        console.error("ERROR:", err);
        alert("Ocurrió un error generando la landing");
    }
}



// =====================================================
// EVENTOS – CREAR LANDING
// =====================================================
btnCrear.addEventListener("click", async () => {
    const p = promptCrear.value.trim();
    if (p.length < 5) return alert("Describe tu landing primero.");

    const html = await generarLanding(p, "create");
    if (!html) return;

    // Crear slug y guardar proyecto
    const slug = crearSlug(p);
    const titulo = p.substring(0, 40) + "...";

    guardarProyecto(titulo, slug, html, "create");
});

// Restaurar cuadro crear
btnRestaurarCrear.addEventListener("click", () => {
    promptCrear.value = "";
});



// =====================================================
// EVENTOS – AJUSTAR LANDING
// =====================================================
btnAjustar.addEventListener("click", async () => {
    const p = promptAjustar.value.trim();
    if (p.length < 5) return alert("Describe qué ajustar/agregar.");

    const nuevaSeccion = await generarLanding(p, "adjust");
    if (!nuevaSeccion) return;

    preview.innerHTML += "\n\n" + nuevaSeccion;

    // Guardar como proyecto de tipo "adjust"
    const slug = crearSlug("ajuste-" + p);
    const titulo = "Ajuste: " + p.substring(0, 25) + "...";

    guardarProyecto(titulo, slug, preview.innerHTML, "adjust");
});

// Restaurar cuadro ajustar
btnRestaurarAjustar.addEventListener("click", () => {
    promptAjustar.value = "";
});



// =====================================================
// DESCARGAR HTML
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
// CARGAR AL INICIAR
// =====================================================
window.addEventListener("load", () => {
    const ultima = localStorage.getItem("ultimaLanding");
    if (ultima) updatePreview(ultima);

    renderMisProyectos();
});













