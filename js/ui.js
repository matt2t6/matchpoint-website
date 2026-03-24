export function toggleCoachPanel() {
        const panel = document.getElementById("coach-panel");
        if (panel) panel.classList.toggle("minimized");
      }

export function toggleSloganDropdown() {
        const dropdown = document.getElementById("slogan-dropdown");
        const icon = document.querySelector(".expand-btn i");
        const expandBtn = document.querySelector('.expand-btn');
        if (!dropdown || !icon) return;
        dropdown.classList.toggle("expanded");
        if (dropdown.classList.contains("expanded")) {
          icon.classList.remove("fa-chevron-down");
          icon.classList.add("fa-chevron-up");
          icon.style.transform = "rotate(180deg)";
          if (expandBtn) expandBtn.setAttribute('aria-expanded', 'true');
        } else {
          icon.classList.remove("fa-chevron-up");
          icon.classList.add("fa-chevron-down");
          icon.style.transform = "rotate(0deg)";
          if (expandBtn) expandBtn.setAttribute('aria-expanded', 'false');
        }
      }

export function showCueExplanation() {
        document.getElementById("cue-modal").style.display = "block";
      }

export function closeCueModal() {
        document.getElementById("cue-modal").style.display = "none";
      }

export function setupScrollEffects(reducedMotion) {
        if (reducedMotion) {
          document.querySelectorAll(".fade-in, .scroll-reveal").forEach((el) => el.classList.add("visible"));
          return;
        }
        // Enhanced progress bar
        window.addEventListener("scroll", () => {
          const scrolled =
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
          document.getElementById("scroll-progress-bar").style.width = scrolled + "%";
        });

        // Enhanced fade-in animations with stagger
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry, index) => {
              if (entry.isIntersecting) {
                setTimeout(() => {
                  entry.target.classList.add("visible");
                }, index * 100);
              }
            });
          },
          {
            threshold: 0.1,
            rootMargin: "-50px",
          }
        );

        document.querySelectorAll(".fade-in, .scroll-reveal").forEach((el) => {
          observer.observe(el);
        });
      }

export function setupParallaxEffects(reducedMotion) {
        if (reducedMotion) return;
        window.addEventListener("scroll", () => {
          const scrollY = window.scrollY;

          // Parallax effect for background elements
          const parallaxElements = document.querySelectorAll(".section");
          parallaxElements.forEach((el, index) => {
            const speed = 0.5 + index * 0.1;
            el.style.transform = `translateY(${scrollY * speed * 0.1}px)`;
          });
        });
      }
