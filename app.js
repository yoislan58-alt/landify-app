// ------------------------------------------
// LANDIFY BUILDER PRO — VERSIÓN ESTABLE
// ------------------------------------------


// ============================
// UTILIDAD: SLUG
// ============================
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



// ============================
// ELEMENTOS DOM
// ============================
const promptCrear = document.getElementById("prompt-crear");
const btnCrear = document.getElementById("btn-crear");

const promptAjustar = document.getElementById("prompt-ajustar");
const btnAjustar = document.getElementById("btn-ajustar");

const loader = document.getElementById("loader");
const landingRoot = document.getElementById("landing-root");

const proyectosLista = document.getElementById("proyectos-lista");
const proyectosTrigger = document.querySelector(".accordion-trigger");

// NUEVO BOTÓN GUARDAR (ARRIBA DERECHA)
const btnGuardarTop = document.getElementById("btn-guardar-top");

// OTROS BOTONES SUPERIORES
const btnDescargar = document.getElementById("btn-descargar");
const btnPantalla = document.getElementById("btn-fullscreen");
const toggleThemeBtn = document.getElementById("toggle-theme");



// ============================
// LOADER
// ============================
function showLoading() {
  loader.style.display = "flex";
}
function hideLoading() {
  loader.style.display = "none";
}



// ============================
// PREVIEW: SET / GET
// ============================
function setLandingHTML(html) {
  landingRoot.innerHTML = html;
}
function getLandingHTML() {
  return landingRoot.innerHTML.trim();
}



// ============================
// BACKEND — CREAR LANDING
// ============================
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
      alert("Error generando la landing.");
      return null;
    }

    setLandingHTML(data.html);
    return data.html;

  } catch (error) {
    hideLoading();
    console.error(error);
    alert("Error generando la landing");
    return null;
  }
}



// ============================
// BACKEND — AGREGAR SECCIÓN
// ============================
async function generarSeccion(prompt) {
  try {
    showLoading();

    const res = await fetch("/api/openai", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        mode: "adjust-section"
      })
    });

    const data = await res.json();
    hideLoading();

    if (!data || !data.section) {
      alert("El backend debe devolver { section: \"<section>...</section>\" }");
      return null;
    }

    return data.section;

  } catch (error) {
    hideLoading();
    console.error(error);
    alert("Error agregando sección");
    return null;
  }
}



// ============================
// PROYECTOS — GUARDAR
// ============================
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



// ============================
// PROYECTOS — MOSTRAR LISTA
// ============================
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

    item.onclick = () => setLandingHTML(p.html);

    proyectosLista.appendChild(item);
  });
}

renderProyectos();



// ============================
// EVENTOS CREAR
// ============================
btnCrear.addEventListener("click", async () => {
  const p = promptCrear.value.trim();
  if (p.length < 5) {
    alert("Describe mejor la landing.");
    return;
  }

  await generarLanding(p);
});



// ============================
// EVENTOS AJUSTAR / SECCIÓN
// ============================
btnAjustar.addEventListener("click", async () => {
  const inst = promptAjustar.value.trim();
  if (inst.length < 5) {
    alert("Describe qué sección ajustar/agregar.");
    return;
  }

  const htmlActual = getLandingHTML();
  if (!htmlActual) {
    alert("Primero crea una landing.");
    return;
  }

  const seccion = await generarSeccion(inst);
  if (!seccion) return;

  landingRoot.innerHTML += "\n\n" + seccion;
});



// ============================
// EVENTO: NUEVA LANDING
// ============================
document.getElementById("btn-nueva").addEventListener("click", () => {
  setLandingHTML("");
  promptCrear.value = "";
  promptAjustar.value = "";
  alert("Nueva landing lista para comenzar.");
});



// ============================
// EVENTO: MOSTRAR / OCULTAR PROYECTOS
// ============================
proyectosTrigger.addEventListener("click", () => {
  proyectosLista.style.display =
    proyectosLista.style.display === "block" ? "none" : "block";
});



// ============================
// DESCARGAR HTML
// ============================
btnDescargar.addEventListener("click", () => {
  const contenido = getLandingHTML();
  if (!contenido) {
    alert("No hay landing para descargar.");
    return;
  }

  const htmlCompleto = `
<!DOCTYPE html>
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
  const blob = new Blob([htmlCompleto], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = slug + ".html";
  a.click();

  URL.revokeObjectURL(url);
});



// ============================
// PANTALLA COMPLETA
// ============================
btnPantalla.addEventListener("click", () => {
  const contenido = getLandingHTML();
  if (!contenido) {
    alert("No hay landing para mostrar.");
    return;
  }

  const win = window.open("", "_blank");
  win.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Preview</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${contenido}
</body>
</html>`);
  win.document.close();
});



// ============================
// NUEVO BOTÓN GUARDAR (ARRIBA)
// ============================
btnGuardarTop.addEventListener("click", guardarProyecto);



// ============================
// MODO CLARO / OSCURO
// ============================
toggleThemeBtn.addEventListener("click", () => {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
});

























