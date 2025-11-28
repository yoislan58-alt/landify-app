// =======================================================
// ELEMENTOS
// =======================================================

// Panel izquierdo
const panelGenerar = document.getElementById("panelGenerar");
const panelAjustar = document.getElementById("panelAjustar");

const userPrompt = document.getElementById("userPrompt");
const ajustarPrompt = document.getElementById("ajustarPrompt");
const ajustarPosicion = document.getElementById("ajustarPosicion");

const generateBtn = document.getElementById("generateBtn");
const resetGenerarBtn = document.getElementById("resetGenerar");

const adjustBtn = document.getElementById("adjustLandingBtn");
const resetAjustarBtn = document.getElementById("resetAjustar");

// Acciones rápidas
const btnNueva = document.getElementById("btnNueva");
const btnProyectosToggle = document.getElementById("btnProyectosToggle");
const submenuProyectos = document.getElementById("submenuProyectos");
const projectListSidebar = document.getElementById("projectListSidebar");
const resetTodoBtn = document.getElementById("resetTodo");

// Preview / topnav
const previewCol = document.getElementById("previewCol");
const previewFrame = document.getElementById("previewFrame");

const btnDesktop = document.getElementById("btnDesktop");
const btnMobile = document.getElementById("btnMobile");

const btnFullscreen = document.getElementById("btnFullscreen");
const btnDescargar = document.getElementById("btnDescargar");

// Tema
const toggleTheme = document.getElementById("toggleTheme");

// Loader
const loadingBox = document.getElementById("loading");

// =======================================================
// UTILIDADES
// =======================================================

function showLoading() {
  loadingBox.classList.remove("hidden");
}

function hideLoading() {
  loadingBox.classList.add("hidden");
}

// Limpia ```html, ``` y "html" suelto
function cleanHTML(html) {
  return (html || "")
    .replace(/```html/gi, "")
    .replace(/```/g, "")
    .replace(/^\s*html\s*/i, "")
    .trim();
}

function renderPreview(html) {
  previewFrame.srcdoc = cleanHTML(html);
}

function getProjects() {
  return JSON.parse(localStorage.getItem("projects") || "[]");
}

function setProjects(arr) {
  localStorage.setItem("projects", JSON.stringify(arr));
}

function generateID() {
  return "land-" + Date.now();
}

function buildProjectName(baseText, prefix = "Landing") {
  const clean = (baseText || "").trim();
  if (!clean) return prefix + " " + new Date().toLocaleString();
  const short = clean.length > 40 ? clean.slice(0, 40) + "…" : clean;
  return prefix + ": " + short;
}

// =======================================================
// PROYECTOS
// =======================================================

function saveProject(html, nameHint) {
  const projects = getProjects();

  const project = {
    id: generateID(),
    name: buildProjectName(nameHint, "Landing"),
    html: cleanHTML(html),
    date: new Date().toLocaleString()
  };

  projects.unshift(project);
  setProjects(projects);
  localStorage.setItem("lastLanding", project.html);

  renderProjectsSidebar();
}

function renderProjectsSidebar() {
  const projects = getProjects();

  if (projects.length === 0) {
    projectListSidebar.innerHTML =
      "<p style='font-size:11px; opacity:0.7; margin:0;'>Aún no tienes proyectos.</p>";
    return;
  }

  projectListSidebar.innerHTML = projects
    .map(
      (p) => `
      <button class="proj-btn" onclick="loadProject('${p.id}')" title="${p.date}">
        ${p.name}
      </button>
    `
    )
    .join("");
}

window.loadProject = function (id) {
  const projects = getProjects();
  const p = projects.find((x) => x.id === id);
  if (!p) return;
  localStorage.setItem("lastLanding", p.html);
  renderPreview(p.html);
};

function resetApp() {
  localStorage.removeItem("projects");
  localStorage.removeItem("lastLanding");
  userPrompt.value = "";
  ajustarPrompt.value = "";
  ajustarPosicion.value = "inicio";
  renderPreview("<h3 style='padding:20px;color:gray;'>Vista previa aquí…</h3>");
  renderProjectsSidebar();
}

// =======================================================
// PREVIEW MODES
// =======================================================

function setPreviewMode(mode) {
  if (mode === "mobile") {
    previewCol.classList.add("mobile");
    btnMobile.classList.add("active");
    btnDesktop.classList.remove("active");
  } else {
    previewCol.classList.remove("mobile");
    btnDesktop.classList.add("active");
    btnMobile.classList.remove("active");
  }
}

// =======================================================
// EVENTOS PRINCIPALES
// =======================================================

// Nueva landing
btnNueva.addEventListener("click", () => {
  userPrompt.value = "";
  ajustarPrompt.value = "";
  ajustarPosicion.value = "inicio";
  renderPreview("<h3 style='padding:20px;color:gray;'>Vista previa aquí…</h3>");
  setPreviewMode("desktop");
});

// Acordeón Mis Proyectos
btnProyectosToggle.addEventListener("click", () => {
  submenuProyectos.classList.toggle("hidden");
  if (!submenuProyectos.classList.contains("hidden")) {
    renderProjectsSidebar();
  }
});

// Reset total
resetTodoBtn.addEventListener("click", () => {
  const ok = confirm(
    "¿Seguro que quieres borrar TODOS los proyectos y reiniciar la app?"
  );
  if (!ok) return;
  resetApp();
});

// Vista desktop / móvil
btnDesktop.addEventListener("click", () => setPreviewMode("desktop"));
btnMobile.addEventListener("click", () => setPreviewMode("mobile"));

// Restaurar campos
resetGenerarBtn.addEventListener("click", () => {
  userPrompt.value = "";
});
resetAjustarBtn.addEventListener("click", () => {
  ajustarPrompt.value = "";
  ajustarPosicion.value = "inicio";
});

// =======================================================
// GENERAR LANDING
// =======================================================

async function generarLanding() {
  const prompt = userPrompt.value.trim();
  if (!prompt) {
    alert("Escribe cómo quieres la landing.");
    return;
  }

  showLoading();

  try {
    const res = await fetch("/api/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    hideLoading();

    if (!data.output) {
      alert("No se pudo generar la landing.");
      return;
    }

    const html = cleanHTML(data.output);
    renderPreview(html);
    saveProject(html, prompt);
  } catch (err) {
    hideLoading();
    console.error(err);
    alert("Error inesperado al generar la landing.");
  }
}

generateBtn.addEventListener("click", generarLanding);

// =======================================================
// AJUSTAR / AGREGAR SECCIÓN
// =======================================================

async function ajustarLanding() {
  const last = localStorage.getItem("lastLanding");
  if (!last) {
    alert("Primero genera una landing antes de ajustarla.");
    return;
  }

  const mod = ajustarPrompt.value.trim();
  if (!mod) {
    alert("Describe qué quieres ajustar o agregar.");
    return;
  }

  const prompt = `
Ajusta esta landing según:
Acción: ${mod}
Posición: ${ajustarPosicion.value}

HTML:
${last}
`;

  showLoading();

  try {
    const res = await fetch("/api/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    hideLoading();

    if (!data.output) {
      alert("No se pudo ajustar la landing.");
      return;
    }

    const html = cleanHTML(data.output);
    localStorage.setItem("lastLanding", html);
    renderPreview(html);
    saveProject(html, "Landing ajustada");
  } catch (err) {
    hideLoading();
    console.error(err);
    alert("Error inesperado al ajustar la landing.");
  }
}

adjustBtn.addEventListener("click", ajustarLanding);

// =======================================================
// BOTONES TOPO: FULLSCREEN + DESCARGAR
// =======================================================

btnFullscreen.addEventListener("click", () => {
  const html = localStorage.getItem("lastLanding");
  if (!html) {
    alert("No hay landing actual para mostrar en pantalla completa.");
    return;
  }
  const win = window.open("", "_blank");
  win.document.write(cleanHTML(html));
  win.document.close();
});

btnDescargar.addEventListener("click", () => {
  const html = localStorage.getItem("lastLanding");
  if (!html) {
    alert("No hay landing actual para descargar.");
    return;
  }
  const clean = cleanHTML(html);
  const blob = new Blob([clean], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "landing.html";
  link.click();
});

// =======================================================
// TEMA CLARO / OSCURO
// =======================================================

toggleTheme.addEventListener("click", () => {
  const htmlTag = document.getElementById("htmlTag");
  const current = htmlTag.getAttribute("data-theme");

  if (current === "dark") {
    htmlTag.setAttribute("data-theme", "light");
    toggleTheme.textContent = "☀️";
    toggleTheme.title = "Cambiar a modo oscuro";
  } else {
    htmlTag.setAttribute("data-theme", "dark");
    toggleTheme.textContent = "🌙";
    toggleTheme.title = "Cambiar a modo claro";
  }
});

// =======================================================
// ESTADO INICIAL
// =======================================================

renderPreview("<h3 style='padding:20px;color:gray;'>Vista previa aquí…</h3>");
setPreviewMode("desktop");
renderProjectsSidebar();
hideLoading();









