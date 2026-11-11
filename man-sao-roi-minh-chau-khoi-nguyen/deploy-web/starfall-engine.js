(function () {
  "use strict";

  // ─── Configuration presets ────────────────────────────────────────
  const PRESETS = {
    balanced: { starRate: 0.45, fallingRate: 0.032, meteorInterval: 4200, meteorChance: 0.35 },
    shower:   { starRate: 0.8,  fallingRate: 0.072, meteorInterval: 2400, meteorChance: 0.55 },
    meteors:  { starRate: 0.25, fallingRate: 0.018, meteorInterval: 2800, meteorChance: 0.7  },
    dreamy:   { starRate: 0.18, fallingRate: 0.012, meteorInterval: 7500, meteorChance: 0.2  },
  };

  // ─── Utility helpers ──────────────────────────────────────────────
  const rand  = (lo, hi) => lo + Math.random() * (hi - lo);
  const randI = (lo, hi) => Math.floor(rand(lo, hi + 1));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ─── Fixed star layer (high DPI procedural) ───────────────────────
  class FixedStarField {
    constructor(count) {
      this.stars = [];
      for (let i = 0; i < count; i++) {
        this.stars.push({
          x: Math.random(),
          y: Math.random(),
          r: rand(0.35, 1.6),
          baseAlpha: rand(0.25, 0.92),
          twinkleSpeed: rand(0.4, 2.8),
          twinklePhase: rand(0, Math.PI * 2),
          hue: rand(200, 240),       // blue-white palette
          sat: rand(5, 35),
          brightness: rand(85, 100),
          // A few stars get diffraction spikes
          hasCross: Math.random() < 0.04,
          crossLen: rand(3, 8),
        });
      }
    }

    draw(ctx, w, h, now) {
      const t = now * 0.001;
      for (const s of this.stars) {
        const twinkle = 0.55 + 0.45 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        const alpha = s.baseAlpha * twinkle;
        if (alpha < 0.03) continue;

        const px = s.x * w;
        const py = s.y * h;
        const r  = s.r;

        // Crisp star dot
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `hsl(${s.hue}, ${s.sat}%, ${s.brightness}%)`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();

        // Soft glow halo for brighter stars
        if (alpha > 0.5 && r > 0.8) {
          ctx.globalAlpha = alpha * 0.18;
          ctx.beginPath();
          ctx.arc(px, py, r * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Diffraction cross on select stars
        if (s.hasCross && alpha > 0.4) {
          const cl = s.crossLen * twinkle;
          ctx.globalAlpha = alpha * 0.35;
          ctx.strokeStyle = `hsla(${s.hue}, ${s.sat}%, 95%, 1)`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(px - cl, py); ctx.lineTo(px + cl, py);
          ctx.moveTo(px, py - cl); ctx.lineTo(px, py + cl);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  // ─── Falling / Drifting Star particle ─────────────────────────────
  class FallingStar {
    constructor(w, h, speedMul) {
      this.reset(w, h, speedMul, true);
    }

    reset(w, h, speedMul, initial) {
      this.x = rand(0, w);
      this.y = initial ? rand(-h * 0.1, h) : rand(-h * 0.12, -4);
      this.r = rand(0.5, 1.45);
      this.vx = rand(-0.08, 0.08) * speedMul;
      this.vy = rand(0.18, 0.65) * speedMul;
      this.alpha = rand(0.35, 0.88);
      this.fadeIn = 0;
      this.fadeInSpeed = rand(0.008, 0.02);
      this.hue = rand(210, 240);
      this.life = 1;
    }

    update(w, h) {
      this.x += this.vx;
      this.y += this.vy;
      this.fadeIn = Math.min(1, this.fadeIn + this.fadeInSpeed);

      if (this.y > h + 10 || this.x < -20 || this.x > w + 20) {
        this.life = 0;
      }
    }

    draw(ctx) {
      if (this.life <= 0) return;
      const a = this.alpha * this.fadeIn;
      if (a < 0.02) return;

      ctx.globalAlpha = a;
      ctx.fillStyle = `hsl(${this.hue}, 22%, 94%)`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow
      ctx.globalAlpha = a * 0.12;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ─── Meteor / Shooting Star ───────────────────────────────────────
  class Meteor {
    constructor(w, h, speedMul, fromClick) {
      // Origin point
      if (fromClick) {
        // Spawn from a more natural upper region when triggered manually
        this.x = rand(w * 0.1, w * 0.9);
        this.y = rand(-h * 0.05, h * 0.12);
      } else {
        this.x = rand(-w * 0.1, w * 1.1);
        this.y = rand(-h * 0.08, h * 0.05);
      }

      // Direction: roughly downward with varying horizontal sweep
      const angle = rand(0.52, 1.15); // ~30°–66° from horizontal
      const speed = rand(5.5, 12.5) * speedMul;
      this.vx = Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1);
      this.vy = Math.sin(angle) * speed;

      this.tailLen = rand(120, 340);
      this.thickness = rand(1.0, 2.4);
      this.life = 1;
      this.decay = rand(0.006, 0.014);
      this.hue = rand(205, 245);

      // Trail history for ultra-smooth rendering
      this.trail = [];
      this.maxTrail = Math.ceil(this.tailLen / speed) + 6;

      // Sparkle particles spawned along the trail
      this.sparkles = [];
    }

    update(w, h) {
      this.life -= this.decay;
      if (this.life <= 0) return;

      this.x += this.vx;
      this.y += this.vy;

      this.trail.push({ x: this.x, y: this.y, a: this.life });
      if (this.trail.length > this.maxTrail) this.trail.shift();

      // Spawn sparkle debris
      if (Math.random() < 0.55) {
        this.sparkles.push({
          x: this.x + rand(-3, 3),
          y: this.y + rand(-3, 3),
          vx: this.vx * rand(-0.08, 0.12) + rand(-0.6, 0.6),
          vy: this.vy * rand(-0.04, 0.14) + rand(-0.3, 0.4),
          r: rand(0.4, 1.1),
          a: rand(0.5, 1),
          decay: rand(0.012, 0.035),
        });
      }

      // Update sparkles
      for (const sp of this.sparkles) {
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.02; // micro gravity
        sp.a -= sp.decay;
      }
      this.sparkles = this.sparkles.filter(sp => sp.a > 0.01);
    }

    draw(ctx) {
      if (this.trail.length < 2) return;

      // Head glow flare
      const head = this.trail[this.trail.length - 1];
      const headAlpha = clamp(this.life, 0, 1);

      if (headAlpha > 0.05) {
        // Bright central core
        const coreGrad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 6 * this.thickness);
        coreGrad.addColorStop(0, `hsla(${this.hue}, 30%, 98%, ${headAlpha * 0.95})`);
        coreGrad.addColorStop(0.3, `hsla(${this.hue}, 40%, 88%, ${headAlpha * 0.5})`);
        coreGrad.addColorStop(1, `hsla(${this.hue}, 50%, 72%, 0)`);
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 6 * this.thickness, 0, Math.PI * 2);
        ctx.fill();

        // Wide bloom
        ctx.globalAlpha = headAlpha * 0.14;
        const bloom = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 28);
        bloom.addColorStop(0, `hsla(${this.hue}, 35%, 92%, 1)`);
        bloom.addColorStop(1, `hsla(${this.hue}, 45%, 70%, 0)`);
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Trail: draw from tail → head with thickness taper
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const len = this.trail.length;
      for (let i = 1; i < len; i++) {
        const prev = this.trail[i - 1];
        const cur  = this.trail[i];
        const progress = i / len;  // 0 = tail, 1 = head
        const taper = progress * progress;  // quadratic taper

        const a = clamp(cur.a * taper, 0, 1);
        if (a < 0.01) continue;

        ctx.strokeStyle = `hsla(${this.hue}, ${25 + 20 * progress}%, ${82 + 16 * progress}%, ${a * 0.88})`;
        ctx.lineWidth = this.thickness * (0.15 + 0.85 * taper);
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(cur.x, cur.y);
        ctx.stroke();
      }

      // Sparkle debris
      for (const sp of this.sparkles) {
        ctx.globalAlpha = sp.a * 0.82;
        ctx.fillStyle = `hsla(${this.hue}, 28%, 92%, 1)`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    get alive() {
      return this.life > 0 || this.sparkles.length > 0;
    }
  }

  // ─── Main Starfall Engine ─────────────────────────────────────────
  class StarfallEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.dpr = 1;
      this.width = 1;
      this.height = 1;

      this.mode = "balanced";
      this.densityMul = 1;
      this.speedMul = 1;

      this.fixedStars = new FixedStarField(520);
      this.fallingStars = [];
      this.meteors = [];

      this.lastMeteorTime = 0;
      this.burstQueue = 0;

      this.resize();
    }

    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.width  = Math.max(1, Math.floor(window.innerWidth * this.dpr));
      this.height = Math.max(1, Math.floor(window.innerHeight * this.dpr));
      this.canvas.width  = this.width;
      this.canvas.height = this.height;
    }

    setMode(mode) {
      if (PRESETS[mode]) this.mode = mode;
    }

    triggerBurst(count) {
      this.burstQueue += count || 8;
    }

    update(now) {
      const w = this.width;
      const h = this.height;
      const preset = PRESETS[this.mode];
      const sm = this.speedMul;
      const dm = this.densityMul;

      // Spawn falling stars
      const fallChance = preset.fallingRate * dm;
      if (Math.random() < fallChance) {
        this.fallingStars.push(new FallingStar(w, h, sm));
      }

      // Natural periodic meteors
      if (now - this.lastMeteorTime > preset.meteorInterval / dm) {
        if (Math.random() < preset.meteorChance) {
          this.meteors.push(new Meteor(w, h, sm, false));
        }
        this.lastMeteorTime = now;
      }

      // Burst queue (from user interaction)
      while (this.burstQueue > 0) {
        this.meteors.push(new Meteor(w, h, sm * rand(0.8, 1.3), true));
        this.burstQueue--;
      }

      // Update particles
      for (const f of this.fallingStars) f.update(w, h);
      this.fallingStars = this.fallingStars.filter(f => f.life > 0);

      for (const m of this.meteors) m.update(w, h);
      this.meteors = this.meteors.filter(m => m.alive);
    }

    draw(now) {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      ctx.clearRect(0, 0, w, h);

      // Fixed star field
      this.fixedStars.draw(ctx, w, h, now);

      // Falling / drifting stars
      for (const f of this.fallingStars) f.draw(ctx);

      // Meteors
      for (const m of this.meteors) m.draw(ctx);
    }
  }

  window.StarfallEngine = StarfallEngine;
})();

