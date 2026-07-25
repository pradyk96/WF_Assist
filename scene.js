(() => {
  "use strict";

  const canvas = document.querySelector("#worldCanvas");
  const stage = document.querySelector("#sceneStage");
  if (!canvas || !stage) return;

  const context = canvas.getContext("2d", { alpha: true });
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let width = 0;
  let height = 0;
  let particles = [];
  let frame = 0;

  function random(min, max) { return Math.random() * (max - min) + min; }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.min(145, Math.max(62, Math.floor((width * height) / 15000)));
    particles = Array.from({ length: count }, () => ({
      x: random(-width * .65, width * .65),
      y: random(-height * .46, height * .46),
      z: random(90, 980),
      speed: random(.18, .85),
      size: random(.35, 1.6),
      hue: Math.random() > .77 ? 267 : Math.random() > .38 ? 174 : 201,
      phase: random(0, Math.PI * 2),
    }));
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    pointer.x += (pointer.targetX - pointer.x) * .045;
    pointer.y += (pointer.targetY - pointer.y) * .045;

    const centerX = width * .5 + pointer.x * 22;
    const centerY = height * .43 + pointer.y * 17;
    const nearby = [];

    for (const particle of particles) {
      particle.z -= particle.speed * (prefersReducedMotion.matches ? .15 : 1.35);
      if (particle.z < 35) {
        particle.z = 980;
        particle.x = random(-width * .65, width * .65);
        particle.y = random(-height * .46, height * .46);
      }

      const perspective = 285 / particle.z;
      const x = centerX + particle.x * perspective;
      const y = centerY + particle.y * perspective + Math.sin(time * .0006 + particle.phase) * 5 * perspective;
      const alpha = Math.min(.82, Math.max(.04, (1 - particle.z / 1100) * .75));
      const radius = Math.max(.25, particle.size * perspective * 3.5);
      if (x < -10 || x > width + 10 || y < -10 || y > height + 10) continue;

      context.beginPath();
      context.fillStyle = `hsla(${particle.hue}, 94%, 80%, ${alpha})`;
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
      if (particle.z < 530) nearby.push({ x, y, alpha, z: particle.z });
    }

    // Very light connective lines make the field feel like an active creative network.
    context.lineWidth = .55;
    for (let a = 0; a < nearby.length; a += 1) {
      for (let b = a + 1; b < nearby.length; b += 1) {
        const dx = nearby[a].x - nearby[b].x;
        const dy = nearby[a].y - nearby[b].y;
        const distance = Math.hypot(dx, dy);
        if (distance > 94) continue;
        const alpha = (1 - distance / 94) * Math.min(nearby[a].alpha, nearby[b].alpha) * .36;
        context.beginPath();
        context.strokeStyle = `rgba(104, 237, 219, ${alpha})`;
        context.moveTo(nearby[a].x, nearby[a].y);
        context.lineTo(nearby[b].x, nearby[b].y);
        context.stroke();
      }
    }

    frame = requestAnimationFrame(draw);
  }

  function setStageTilt(event) {
    const box = stage.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
    stage.style.setProperty("--tilt-x", `${(x * 7).toFixed(2)}deg`);
    stage.style.setProperty("--tilt-y", `${(-y * 5).toFixed(2)}deg`);
    pointer.targetX = x;
    pointer.targetY = y;
  }

  stage.addEventListener("pointermove", setStageTilt);
  stage.addEventListener("pointerleave", () => {
    stage.style.setProperty("--tilt-x", "0deg");
    stage.style.setProperty("--tilt-y", "0deg");
    pointer.targetX = 0;
    pointer.targetY = 0;
  });
  window.addEventListener("pointermove", (event) => {
    pointer.targetX = (event.clientX / width - .5) * .22;
    pointer.targetY = (event.clientY / height - .5) * .22;
  }, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (!document.hidden && !frame) {
      frame = requestAnimationFrame(draw);
    }
  });

  resize();
  if (!prefersReducedMotion.matches) frame = requestAnimationFrame(draw);
})();
