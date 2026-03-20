const STORAGE_KEY = "uiux-portfolio-data-v1";

const defaultData = {
  brandName: "Ваше Имя",
  heroTitle: "Создаю интерфейсы, которые решают задачи бизнеса и радуют пользователей",
  heroSubtitle: "Делаю исследования, прототипы и финальный UI. Работаю от гипотезы до запуска продукта.",
  aboutText:
    "Я UI/UX дизайнер с фокусом на e-commerce и SaaS. Помогаю продуктовым командам повышать конверсию и упрощать пользовательский путь через данные, интервью и визуально чистый интерфейс.",
  email: "hello@example.com",
  telegram: "@username",
  telegramUrl: "https://t.me/username",
  behance: "Behance",
  behanceUrl: "https://www.behance.net",
  services: [
    { title: "UX Исследования", text: "Интервью, CJM, анализ сценариев и проблем пользователей." },
    { title: "Прототипирование", text: "Wireframes и интерактивные прототипы в Figma для быстрого теста гипотез." },
    { title: "UI Дизайн", text: "Современный интерфейс, дизайн-система и адаптивные экраны." },
    { title: "Сопровождение запуска", text: "Передача макетов, UI QA и контроль качества реализации." }
  ],
  projects: [
    {
      id: crypto.randomUUID(),
      title: "FinTrack Mobile",
      description: "Редизайн банковского приложения. Сократил путь до оплаты с 6 до 3 шагов.",
      category: "Mobile App",
      link: "https://example.com",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: crypto.randomUUID(),
      title: "SaaS Analytics Dashboard",
      description: "Создание новой информационной архитектуры и визуализации ключевых метрик.",
      category: "Web SaaS",
      link: "https://example.com",
      image: "https://images.unsplash.com/photo-1551281044-8f8d6c58e6f4?auto=format&fit=crop&w=1200&q=80"
    }
  ]
};

let data = loadData();
let editMode = false;
let currentEditingProjectId = null;

const servicesEl = document.getElementById("services");
const projectsEl = document.getElementById("projects");
const projectTemplate = document.getElementById("projectTemplate");
const editorPanel = document.getElementById("editorPanel");
const editToggle = document.getElementById("editToggle");
const addProjectBtn = document.getElementById("addProjectBtn");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");
const resetBtn = document.getElementById("resetBtn");
const projectDialog = document.getElementById("projectDialog");
const projectForm = document.getElementById("projectForm");
const cancelDialogBtn = document.getElementById("cancelDialogBtn");
const dialogTitle = document.getElementById("dialogTitle");

render();
bindEvents();

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultData);
    const parsed = JSON.parse(saved);
    return { ...structuredClone(defaultData), ...parsed };
  } catch (error) {
    console.error("Load failed:", error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function render() {
  renderContentFields();
  renderServices();
  renderProjects();
}

function renderContentFields() {
  document.querySelectorAll("[data-field]").forEach((node) => {
    const key = node.dataset.field;
    if (!(key in data)) return;

    if (node.tagName === "A") {
      if (key === "email") {
        node.href = `mailto:${data.email}`;
      } else if (key === "telegram") {
        node.href = data.telegramUrl;
      } else if (key === "behance") {
        node.href = data.behanceUrl;
      }
      node.textContent = data[key];
      return;
    }

    node.textContent = data[key];
  });
}

function renderServices() {
  servicesEl.innerHTML = "";
  data.services.forEach((service) => {
    const card = document.createElement("article");
    card.className = "service-card";
    card.innerHTML = `
      <h3>${escapeHtml(service.title)}</h3>
      <p>${escapeHtml(service.text)}</p>
    `;
    servicesEl.appendChild(card);
  });
}

function renderProjects() {
  projectsEl.innerHTML = "";
  data.projects.forEach((project) => {
    const clone = projectTemplate.content.cloneNode(true);
    const root = clone.querySelector(".project-card");
    const image = clone.querySelector(".project-image");
    const title = clone.querySelector(".project-title");
    const description = clone.querySelector(".project-description");
    const tag = clone.querySelector(".tag");
    const link = clone.querySelector(".project-link");
    const controls = clone.querySelector(".project-controls");
    const editBtn = clone.querySelector(".edit-project");
    const deleteBtn = clone.querySelector(".delete-project");

    root.dataset.projectId = project.id;
    image.src = project.image;
    image.alt = project.title;
    title.textContent = project.title;
    description.textContent = project.description;
    tag.textContent = project.category;
    link.href = project.link;
    controls.classList.toggle("hidden", !editMode);

    editBtn.addEventListener("click", () => openProjectDialog(project.id));
    deleteBtn.addEventListener("click", () => deleteProject(project.id));

    projectsEl.appendChild(clone);
  });
}

function bindEvents() {
  editToggle.addEventListener("click", toggleEditMode);
  addProjectBtn.addEventListener("click", () => openProjectDialog(null));
  exportBtn.addEventListener("click", exportJSON);
  importInput.addEventListener("change", importJSON);
  resetBtn.addEventListener("click", resetToDefault);
  projectForm.addEventListener("submit", onProjectSubmit);
  cancelDialogBtn.addEventListener("click", () => projectDialog.close());

  document.querySelectorAll("[data-field]").forEach((node) => {
    const key = node.dataset.field;
    node.addEventListener("blur", () => {
      if (!editMode) return;
      if (node.tagName === "A") {
        const value = node.textContent.trim();
        data[key] = value;

        if (key === "email") {
          node.href = `mailto:${value}`;
        }

        if (key === "telegram") {
          data.telegramUrl = buildTelegramUrl(value);
          node.href = data.telegramUrl;
        }

        if (key === "behance") {
          data.behanceUrl = normalizeUrl(value);
          node.href = data.behanceUrl;
        }
      } else {
        data[key] = node.textContent.trim();
      }
      saveData();
    });
  });
}

function toggleEditMode() {
  editMode = !editMode;
  editToggle.textContent = editMode ? "Выйти из редактирования" : "Режим редактирования";
  editorPanel.classList.toggle("hidden", !editMode);
  addProjectBtn.classList.toggle("hidden", !editMode);

  document.querySelectorAll("[data-field]").forEach((node) => {
    node.setAttribute("contenteditable", editMode ? "true" : "false");
  });

  renderProjects();
}

function openProjectDialog(projectId) {
  currentEditingProjectId = projectId;
  const editingProject = data.projects.find((p) => p.id === projectId);

  dialogTitle.textContent = editingProject ? "Редактировать проект" : "Добавить проект";
  projectForm.reset();

  if (editingProject) {
    projectForm.title.value = editingProject.title;
    projectForm.description.value = editingProject.description;
    projectForm.category.value = editingProject.category;
    projectForm.link.value = editingProject.link;
    projectForm.image.value = editingProject.image;
  }

  projectDialog.showModal();
}

function onProjectSubmit(event) {
  event.preventDefault();

  const formData = new FormData(projectForm);
  const payload = {
    title: (formData.get("title") || "").toString().trim(),
    description: (formData.get("description") || "").toString().trim(),
    category: (formData.get("category") || "").toString().trim(),
    link: normalizeUrl((formData.get("link") || "").toString().trim()),
    image: normalizeUrl((formData.get("image") || "").toString().trim())
  };

  if (currentEditingProjectId) {
    data.projects = data.projects.map((project) =>
      project.id === currentEditingProjectId ? { ...project, ...payload } : project
    );
  } else {
    data.projects.unshift({
      id: crypto.randomUUID(),
      ...payload
    });
  }

  saveData();
  renderProjects();
  projectDialog.close();
}

function deleteProject(projectId) {
  const confirmed = window.confirm("Удалить проект?");
  if (!confirmed) return;

  data.projects = data.projects.filter((project) => project.id !== projectId);
  saveData();
  renderProjects();
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "portfolio-content.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importJSON(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      data = { ...structuredClone(defaultData), ...imported };
      saveData();
      render();
      alert("Данные успешно импортированы.");
    } catch {
      alert("Файл не распознан. Проверьте JSON формат.");
    } finally {
      importInput.value = "";
    }
  };
  reader.readAsText(file);
}

function resetToDefault() {
  const confirmed = window.confirm("Сбросить все изменения и вернуть демо-данные?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  data = structuredClone(defaultData);
  render();
}

function normalizeUrl(rawUrl) {
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl) || /^mailto:/i.test(rawUrl)) return rawUrl;
  return `https://${rawUrl}`;
}

function buildTelegramUrl(raw) {
  const value = raw.trim();
  if (!value) return "https://t.me/";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("@")) return `https://t.me/${value.slice(1)}`;
  return `https://t.me/${value}`;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
