function setActiveLink() {
  const currentPath = window.location.pathname;
  document.querySelectorAll(".nav-menu-link").forEach((link) => {
    const linkPath = link.getAttribute("href");

    if (
      (currentPath === "/" && linkPath === "index.html") ||
      currentPath.endsWith(linkPath)
    ) {
      link.classList.add("active-link");
    } else {
      link.classList.remove("active-link");
    }
  });
}

setActiveLink();
