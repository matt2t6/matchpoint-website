/* nav.js - externalized handleActiveNav */
(function () {
  "use strict";
  function getSections() { return Array.from(document.querySelectorAll("section")); }
  function getNavLinks() { return Array.from(document.querySelectorAll(".nav-links a")); }
  function handleActiveNav() {
    const sections = getSections();
    const navLinks = getNavLinks();
    if (!sections.length || !navLinks.length) return;
    let current = sections[0].id || "home";
    const offset = 150;
    const scrollY = window.scrollY || window.pageYOffset;
    for (const section of sections) {
      const top = section.offsetTop;
      if (scrollY >= top - offset) current = section.id || current;
    }
    navLinks.forEach(link => {
      link.classList.remove("active","font-bold","text-cyan-400");
      const href = link.getAttribute("href");
      if (href === `#${current}`) link.classList.add("active","font-bold","text-cyan-400");
    });
  }
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleActiveNav();
        ticking = false;
      });
      ticking = true;
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    try {
      handleActiveNav();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", handleActiveNav);
    } catch (e) { console.error("nav.js error", e); }
  });
})();