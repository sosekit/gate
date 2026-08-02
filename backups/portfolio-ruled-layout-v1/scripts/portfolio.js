const projectList = document.querySelector("[data-project-list]");
const projects = window.FOOLS_GATE_CONTENT?.projects || [];

if (projectList) {
  projects.forEach((project, index) => {
    const article = document.createElement("article");
    const media = document.createElement("figure");
    const copy = document.createElement("div");
    const title = document.createElement("h2");
    const description = document.createElement("p");
    const meta = document.createElement("span");

    article.className = "project";
    media.className = "placeholder-media";
    copy.className = "project-copy";
    meta.className = "project-meta";

    if (project.image) {
      const image = document.createElement("img");
      image.className = "project-image";
      image.src = project.image;
      image.alt = project.imageAlt;
      media.appendChild(image);
    } else {
      media.textContent = `project image ${String(index + 1).padStart(2, "0")}`;
    }

    title.textContent = project.title;
    description.textContent = project.description;
    meta.textContent = project.meta;
    copy.append(title, description, meta);
    article.append(media, copy);
    projectList.appendChild(article);
  });
}
