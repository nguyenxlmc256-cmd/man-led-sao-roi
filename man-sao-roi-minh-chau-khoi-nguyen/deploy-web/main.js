(function () {
  "use strict";

  // ─── Bootstrap renderers ──────────────────────────────────────────
  const cosmosCanvas   = document.getElementById("cosmos-canvas");
  const starfallCanvas = document.getElementById("starfall-canvas");

  const cosmos   = new CosmosRenderer(cosmosCanvas);
  const starfall = new StarfallEngine(starfallCanvas);

  // ─── DOM references ───────────────────────────────────────────────
  const body          = document.body;
  const panel         = document.getElementById("control-panel");
  const hudControls   = document.getElementById("hud-controls");

  const btnWish       = document.getElementById("btn-wish");
  const btnFullscreen = document.getElementById("btn-fullscreen");
  const btnToggle     = document.getElementById("btn-toggle-panel");
  const btnClose      = document.getElementById("btn-close-panel");
  const btnReplay     = document.getElementById("btn-replay");
  const btnBurst      = document.getElementById("btn-burst");
  const btnReset      = document.getElementById("btn-reset");

  const inputHeader   = document.getElementById("input-header");
  const inputName1    = document.getElementById("input-name-1");
  const inputName2    = document.getElementById("input-name-2");
  const inputDate     = document.getElementById("input-date");
  const inputQuote    = document.getElementById("input-quote");
  const selectFont    = document.getElementById("select-font");
  const selectMode    = document.getElementById("select-mode");

  const rangeDensity  = document.getElementById("range-density");
  const rangeSpeed    = document.getElementById("range-speed");
  const rangeNebula   = document.getElementById("range-nebula");
  const valDensity    = document.getElementById("val-density");
  const valSpeed      = document.getElementById("val-speed");
  const valNebula     = document.getElementById("val-nebula");

  const displayHeader = document.getElementById("display-header");
  const displayName1  = document.getElementById("display-name-1");
  const displayName2  = document.getElementById("display-name-2");
  const displayDate   = document.getElementById("display-date");
  const displayQuote  = document.getElementById("display-quote");

  // ─── HUD idle auto-hide logic ─────────────────────────────────────
  let hudTimer = null;
  let hudHidden = false;

  function showHud() {
    body.classList.remove("hud-idle");
    clearTimeout(hudTimer);
    hudTimer = setTimeout(() => {
      if (!panel.classList.contains("open")) {
        body.classList.add("hud-idle");
      }
    }, 3800);
  }

  document.addEventListener("mousemove", showHud);
  document.addEventListener("touchstart", showHud, { passive: true });
  showHud();

  // ─── Panel toggle ─────────────────────────────────────────────────
  function togglePanel(force) {
    const open = force !== undefined ? force : !panel.classList.contains("open");
    panel.classList.toggle("open", open);
    if (open) {
      body.classList.remove("hud-idle");
      clearTimeout(hudTimer);
    } else {
      showHud();
    }
  }

  btnToggle.addEventListener("click", () => togglePanel());
  btnClose.addEventListener("click", () => togglePanel(false));

  // ─── Live text binding ────────────────────────────────────────────
  function bindText(input, display) {
    input.addEventListener("input", () => {
      display.textContent = input.value;
    });
  }

  bindText(inputHeader, displayHeader);
  bindText(inputName1,  displayName1);
  bindText(inputName2,  displayName2);
  bindText(inputDate,   displayDate);
  bindText(inputQuote,  displayQuote);

  // ─── Font selector ────────────────────────────────────────────────
  selectFont.addEventListener("change", () => {
    body.setAttribute("data-font", selectFont.value);
  });
  body.setAttribute("data-font", selectFont.value);

  // ─── Effect mode selector ─────────────────────────────────────────
  selectMode.addEventListener("change", () => {
    starfall.setMode(selectMode.value);
  });

  // ─── Range sliders ────────────────────────────────────────────────
  function bindRange(slider, output, apply) {
    const handler = () => {
      const v = parseInt(slider.value, 10);
      output.textContent = v + "%";
      apply(v / 100);
    };
    slider.addEventListener("input", handler);
    handler();
  }

  bindRange(rangeDensity, valDensity, v => { starfall.densityMul = v; });
  bindRange(rangeSpeed,   valSpeed,   v => { starfall.speedMul   = v; });
  bindRange(rangeNebula,  valNebula,  v => { cosmos.setIntensity(v);  });

  // ─── Action buttons ───────────────────────────────────────────────
  btnWish.addEventListener("click", () => starfall.triggerBurst(6));
  btnBurst.addEventListener("click", () => starfall.triggerBurst(12));

  btnReplay.addEventListener("click", () => {
    body.classList.remove("animate-entrance");
    void body.offsetWidth; // force reflow
    body.classList.add("animate-entrance");
  });

  btnReset.addEventListener("click", () => {
    inputHeader.value = "LỄ THÀNH HÔN";  displayHeader.textContent = inputHeader.value;
    inputName1.value  = "Minh Châu";      displayName1.textContent  = inputName1.value;
    inputName2.value  = "Khôi Nguyên";    displayName2.textContent  = inputName2.value;
    inputDate.value   = "14 . 11 . 2026"; displayDate.textContent   = inputDate.value;
    inputQuote.value  = "Từ khoảnh khắc này, mình có nhau."; displayQuote.textContent = inputQuote.value;
    selectFont.value  = "pinyon"; body.setAttribute("data-font", "pinyon");
    selectMode.value  = "balanced"; starfall.setMode("balanced");
    rangeDensity.value = 100; valDensity.textContent = "100%"; starfall.densityMul = 1;
    rangeSpeed.value   = 100; valSpeed.textContent   = "100%"; starfall.speedMul   = 1;
    rangeNebula.value  = 100; valNebula.textContent  = "100%"; cosmos.setIntensity(1);
  });

  // ─── Fullscreen ───────────────────────────────────────────────────
  btnFullscreen.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // ─── Click / touch to spawn shooting stars ────────────────────────
  starfallCanvas.style.pointerEvents = "auto";
  starfallCanvas.addEventListener("click", (e) => {
    // Don't trigger if clicking on panel
    if (panel.contains(e.target) || hudControls.contains(e.target)) return;
    starfall.triggerBurst(4 + Math.floor(Math.random() * 5));
  });

  // ─── Keyboard shortcuts ───────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    // Don't intercept when typing in inputs
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

    switch (e.key.toLowerCase()) {
      case " ":
        e.preventDefault();
        starfall.triggerBurst(10);
        break;
      case "f":
        btnFullscreen.click();
        break;
      case "c":
        togglePanel();
        break;
      case "h":
        hudHidden = !hudHidden;
        body.classList.toggle("hud-hidden", hudHidden);
        break;
      case "r":
        btnReplay.click();
        break;
    }
  });

  // ─── Mouse parallax ───────────────────────────────────────────────
  document.addEventListener("mousemove", (e) => {
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    cosmos.setParallax(nx, ny);
  });

  // ─── Resize handling ──────────────────────────────────────────────
  let resizeRaf = null;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      cosmos.resize();
      starfall.resize();
    });
  });

  // ─── URL Query Params for Remote LED Screen Control ───────────────
  (function applyQueryParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("header")) {
      inputHeader.value = params.get("header");
      displayHeader.textContent = inputHeader.value;
    }
    if (params.has("name1")) {
      inputName1.value = params.get("name1");
      displayName1.textContent = inputName1.value;
    }
    if (params.has("name2")) {
      inputName2.value = params.get("name2");
      displayName2.textContent = inputName2.value;
    }
    if (params.has("date")) {
      inputDate.value = params.get("date");
      displayDate.textContent = inputDate.value;
    }
    if (params.has("quote")) {
      inputQuote.value = params.get("quote");
      displayQuote.textContent = inputQuote.value;
    }
    if (params.has("font")) {
      const f = params.get("font");
      if ([...selectFont.options].some(o => o.value === f)) {
        selectFont.value = f;
        body.setAttribute("data-font", f);
      }
    }
    if (params.has("mode")) {
      const m = params.get("mode");
      if ([...selectMode.options].some(o => o.value === m)) {
        selectMode.value = m;
        starfall.setMode(m);
      }
    }
    if (params.has("density")) {
      const d = Math.min(220, Math.max(30, parseInt(params.get("density"), 10) || 100));
      rangeDensity.value = d;
      valDensity.textContent = d + "%";
      starfall.densityMul = d / 100;
    }
    if (params.has("speed")) {
      const s = Math.min(180, Math.max(40, parseInt(params.get("speed"), 10) || 100));
      rangeSpeed.value = s;
      valSpeed.textContent = s + "%";
      starfall.speedMul = s / 100;
    }
    if (params.get("hud") === "0") {
      hudHidden = true;
      body.classList.add("hud-hidden");
    }
  })();

  // ─── Main animation loop ──────────────────────────────────────────
  function loop(now) {
    cosmos.render(now);
    starfall.update(now);
    starfall.draw(now);
    requestAnimationFrame(loop);
  }

  // ─── Kick off ─────────────────────────────────────────────────────
  requestAnimationFrame((now) => {
    body.classList.add("animate-entrance");
    loop(now);
  });

})();

