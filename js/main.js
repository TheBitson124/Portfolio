const SECTIONS = {
  published: 'Published',
  developing: 'Developing',
  abandoned: 'Abandoned',
};

const params = new URLSearchParams(location.search);

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return res.text();
}

// Folder names of all projects, in the order listed in projects/projects.json.
async function loadSlugs() {
  const list = await fetchJson('projects/projects.json');
  return list.projects;
}

// Folder names may contain spaces or symbols, so encode them for URLs.
function projectPath(slug) {
  return `projects/${encodeURIComponent(slug)}/`;
}

async function loadProject(slug) {
  const project = await fetchJson(projectPath(slug) + 'project.json');
  return { ...project, slug };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function showError(container, message) {
  container.replaceChildren(el('p', 'empty', message));
}

// ---------- Home ----------

function initHome() {
  document.getElementById('randomize').addEventListener('click', async () => {
    const slugs = await loadSlugs();
    if (slugs.length === 0) return;
    const slug = slugs[Math.floor(Math.random() * slugs.length)];
    location.href = `project.html?p=${encodeURIComponent(slug)}`;
  });
}

// ---------- Section ----------

async function initSection() {
  const status = params.get('s');
  const title = document.getElementById('section-title');
  const list = document.getElementById('project-list');

  if (!SECTIONS[status]) {
    title.textContent = 'Section not found';
    return;
  }

  title.textContent = SECTIONS[status];
  document.title = `${SECTIONS[status]} · Portfolio`;

  try {
    const projects = await Promise.all((await loadSlugs()).map(loadProject));
    const matching = projects.filter(p => p.status === status);

    if (matching.length === 0) {
      showError(list, 'No projects here yet.');
      return;
    }

    for (const project of matching) {
      const link = el('a', 'btn project-btn');
      link.href = `project.html?p=${encodeURIComponent(project.slug)}`;
      link.append(el('span', 'project-btn-title', project.title));
      if (project.summary) link.append(el('span', 'project-btn-summary', project.summary));
      list.append(link);
    }
  } catch (err) {
    showError(list, err.message);
  }
}

// ---------- Project ----------

async function initProject() {
  const slug = params.get('p');
  const container = document.getElementById('project');

  try {
    const project = await loadProject(slug);
    const base = projectPath(slug);
    document.title = `${project.title} · Portfolio`;

    if (SECTIONS[project.status]) {
      const sectionLink = document.getElementById('section-link');
      sectionLink.href = `section.html?s=${project.status}`;
      sectionLink.textContent = `← ${SECTIONS[project.status]}`;
    }

    container.append(el('h1', 'page-title', project.title));

    const meta = el('div', 'project-meta');
    if (SECTIONS[project.status]) meta.append(el('span', 'badge', SECTIONS[project.status]));
    if (project.date) meta.append(el('span', null, project.date));
    for (const tag of project.tags || []) meta.append(el('span', 'tag', tag));
    container.append(meta);

    const links = el('div', 'project-links');
    for (const link of project.links || []) {
      if (!link.url) continue;
      const a = el('a', 'btn', link.label || link.url);
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener';
      links.append(a);
    }
    if (links.children.length) container.append(links);

    if (project.description) {
      const body = el('div', 'project-description');
      body.innerHTML = marked.parse(await fetchText(base + project.description));
      container.append(body);
    }

    if (project.images?.length) {
      const gallery = el('div', 'gallery');
      for (const src of project.images) {
        gallery.append(Object.assign(el('img'), { src: base + src, alt: '' }));
      }
      container.append(gallery);
    }
  } catch (err) {
    showError(container, 'Project not found.');
  }
}

const page = document.body.dataset.page;
if (page === 'home') initHome();
if (page === 'section') initSection();
if (page === 'project') initProject();
