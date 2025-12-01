// ------------------------------------------
// LANDIFY BUILDER PRO — VERSIÓN ESTABLE
// ------------------------------------------


// ============= SLUG PARA PROYECTOS =============
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

// ============= ELEMENTOS =============
const promptCrear = document.getElementById("prompt-crear");
const btnCrear = document.getElementById("btn-crear");

const promptAjustar = document.getElementById("prompt-ajustar");
const btnAjustar = document.getElementById("btn-ajustar");

const loader = document.getElementById("loader");
const landingRoot = document.getElementById("landing-root");

const btnDescargar = document.getElementById("btn-descargar");
const btnPantalla = document.getElementById("btn-fullscreen");
const btnNueva = document.getElementById("btn-nueva");
const btnGuardar = document.getElementById("btn-guardar");

const proyectosLista = document.getElementById("proyectos-lista");
const proyectosTrigger = document.querySelector(".accordion-trigger");

const toggleThemeBtn = document.getElementById("toggle-theme");

// ============= LOADER =============
function showLoading() {
  loader.style.display = "flex";
}
function hideLoading() {
  loader.style.display = "none";
}

// ============= PREVIEW =============
function setLandingHTML(html) {
  landingRoot.innerHTML = html;
}
function getLandingHTML() {
  return landingRoot.innerHTML.trim();
}

// ============= LLAMADA BACKEND: CREAR =============
async function generarLanding(prompt) {
  try {
    showLoading();

    const res = await fetch("/api/openai", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        mode: "create"
      })
    });

    const data = await res.json();
    hideLoading();

    if (!data || !data.html) {
      alert("Error generando la landing");
      return null;
    }

    // TODO: aquí se supone que data.html es la landing completa
    setLandingHTML(data.html);
    return data.html;

  } catch (e) {
    hideLoading();
    console.error(e);
    alert("Error generando la landing");
    return null;
  }
}

// ============= LLAMADA BACKEND: SECCIÓN =============
async function generarSeccion(prompt) {
  try {
    showLoading();

    const res = await fetch("/api/openai", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        mode: "adjust-section" // IMPORTANTE: que el backend devuelva { section: "<section>...</section>" }
      })
    });

    const data = await res.json();
    hideLoading();

    if (!data || !data.section) {
      alert("No se pudo generar la sección. Revisa openai.js para devolver { section }.");
      return null;
    }

    return data.section;

  } catch (e) {
    hideLoading();
    console.error(e);
    alert("Error generando sección");
    return null;
  }
}

// ============= PROYECTOS (LOCALSTORAGE) =============
function guardarProyecto() {
  const html = getLandingHTML();
  if (!html) {
    alert("No hay landing para guardar.");
    return;
  }

  const proyectos = JSON.parse(localStorage.getItem("proyectos") || "[]");

  const nombreBase = promptCrear.value.trim() || "landing";
  const slug = crearSlug(nombreBase || "landing-" + Date.now());

  proyectos.unshift({
    slug,
    html,
    fecha: new Date().toISOString()
  });

  localStorage.setItem("proyectos", JSON.stringify(proyectos));
  renderProyectos();
  alert("Proyecto guardado correctamente.");
}

function renderProyectos() {
  const proyectos = JSON.parse(localStorage.getItem("proyectos") || "[]");
  proyectosLista.innerHTML = "";

  if (!proyectos.length) {
    const div = document.createElement("div");
    div.style.color = "#bdbdd2";
    div.style.fontSize = "12px";
    div.textContent = "Aún no tienes landings guardadas.";
    proyectosLista.appendChild(div);
    return;
  }

  proyectos.forEach(p => {
    const item = document.createElement("div");
    item.className = "project-item";
    item.textContent = p.slug;

    item.onclick = () => {
      setLandingHTML(p.html);
    };

    proyectosLista.appendChild(item);
  });
}

// iniciar lista al cargar
renderProyectos();

// ============= EVENTOS CREAR =============
btnCrear.addEventListener("click", async () => {
  const p = promptCrear.value.trim();
  if (p.length < 5) {
    alert("Describe la landing con un poco más de detalle.");
    return;
  }

  await generarLanding(p);
});

// ============= EVENTOS AJUSTAR / AGREGAR SECCIÓN =============
btnAjustar.addEventListener("click", async () => {
  const instruccion = promptAjustar.value.trim();
  if (instruccion.length < 5) {
    alert("Describe qué sección quieres agregar o ajustar.");
    return;
  }

  const htmlActual = getLandingHTML();
  if (!htmlActual) {
    alert("Primero genera una landing antes de agregar secciones.");
    return;
  }

  const seccion = await generarSeccion(instruccion);
  if (!seccion) return;

  // Solo se inserta dentro de la landing, NO en la app
  landingRoot.innerHTML += "\n\n" + seccion;
});

// ============= GUARDAR PROYECTO =============
btnGuardar.addEventListener("click", guardarProyecto);

// ============= NUEVA LANDING =============
btnNueva.addEventListener("click", () => {
  setLandingHTML("");
  promptCrear.value = "";
  promptAjustar.value = "";
  alert("Listo, puedes comenzar una nueva landing desde cero.");
});

// ============= PROYECTOS: MOSTRAR / OCULTAR =============
proyectosTrigger.addEventListener("click", () => {
  const visible = proyectosLista.style.display === "block";
  proyectosLista.style.display = visible ? "none" : "block";
});

// ============= DESCARGAR HTML =============
btnDescargar.addEventListener("click", () => {
  const contenido = getLandingHTML();
  if (!contenido) {
    alert("No hay landing para descargar.");
    return;
  }

  const htmlCompleto =
`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Landing generada</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${contenido}
</body>
</html>`;

  const slug = crearSlug(promptCrear.value || "landing-generada");
  const nombre = slug || "landing-generada";
  const blob = new Blob([htmlCompleto], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = nombre + ".html";
  a.click();

  URL.revokeObjectURL(url);
});

// ============= PANTALLA COMPLETA =============
btnPantalla.addEventListener("click", () => {
  const contenido = getLandingHTML();
  if (!contenido) {
    alert("No hay landing para mostrar.");
    return;
  }

  const win = window.open("", "_blank");
  win.document.write(
`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Preview Landing</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${contenido}
</body>
</html>`
  );
  win.document.close();
});

// ============= MODO CLARO/OSCURO =============
toggleThemeBtn.addEventListener("click", () => {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
});























