// Loads the project list from projects/projects.json, then each project's project.json.
async function loadProjects() {
  const list = await fetch('projects/projects.json').then(r => r.json());
  const container = document.getElementById('projects');

  for (const slug of list.projects) {
    const project = await fetch(`projects/${slug}/project.json`).then(r => r.json());
    const article = document.createElement('article');
    article.innerHTML = `<h2>${project.title}</h2><p>${project.summary}</p>`;
    container.appendChild(article);
  }
}

loadProjects();
