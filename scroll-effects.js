(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const splitLines = document.querySelectorAll("[data-split]");

  // Turn each large display line into individually animated letters without changing
  // its accessible name. Non-breaking spaces preserve intentional typography spacing.
  splitLines.forEach((line) => {
    const text = line.textContent.trim();
    line.setAttribute("aria-label", text);
    line.textContent = "";
    [...text].forEach((character, index) => {
      const letter = document.createElement("span");
      letter.className = "letter";
      letter.style.setProperty("--char-index", index);
      letter.setAttribute("aria-hidden", "true");
      letter.textContent = character === " " ? "\u00a0" : character;
      line.append(letter);
    });
  });

  const revealTargets = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: .16, rootMargin: "0px 0px -6%" });
    revealTargets.forEach((element) => revealObserver.observe(element));
  }

  const parallaxTargets = [...document.querySelectorAll("[data-parallax]")];
  const manifesto = document.querySelector(".kinetic-manifesto");
  let ticking = false;

  function updateScrollMotion() {
    ticking = false;
    if (reduceMotion) return;
    const viewportMidpoint = window.innerHeight * .5;
    parallaxTargets.forEach((element) => {
      const bounds = element.getBoundingClientRect();
      const distance = (bounds.top + bounds.height * .5 - viewportMidpoint) / window.innerHeight;
      const strength = Number(element.dataset.parallax || 0);
      element.style.setProperty("--scroll-lift", `${(distance * strength * 300).toFixed(1)}px`);
      element.style.setProperty("--scroll-rotate", `${(distance * strength * -16).toFixed(2)}deg`);
    });
    if (manifesto) {
      const bounds = manifesto.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, (bounds.top + bounds.height * .5 - viewportMidpoint) / window.innerHeight));
      manifesto.style.setProperty("--manifesto-drift", `${(progress * -55).toFixed(1)}px`);
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScrollMotion);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateScrollMotion();
})();
