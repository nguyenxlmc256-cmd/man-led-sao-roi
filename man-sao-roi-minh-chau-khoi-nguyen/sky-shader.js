(function () {
  "use strict";

  const VERTEX_SRC = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SRC = `
    precision highp float;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_parallax;
    uniform float u_intensity;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    vec2 hash22(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx + p3.yz) * p3.zy);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);

      float a = hash12(i);
      float b = hash12(i + vec2(1.0, 0.0));
      float c = hash12(i + vec2(0.0, 1.0));
      float d = hash12(i + vec2(1.0, 1.0));

      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float sum = 0.0;
      float amp = 0.5;
      mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
      for (int i = 0; i < 6; i++) {
        sum += amp * noise(p);
        p = rot * p * 2.03 + vec2(11.3, 7.1);
        amp *= 0.5;
      }
      return sum;
    }

    // Crisp cellular star grain layer for unresolved Milky Way stardust
    float microStarLayer(vec2 coord, float density, float sizePx, float twinkleSpeed) {
      vec2 ip = floor(coord);
      vec2 fp = fract(coord);
      vec2 rnd = hash22(ip);

      float present = step(1.0 - density, rnd.x);
      vec2 starPos = 0.18 + 0.64 * rnd;
      float d = length(fp - starPos);

      float twinkle = 0.65 + 0.35 * sin(u_time * twinkleSpeed + rnd.y * 62.8318);
      float spark = smoothstep(sizePx, 0.0, d);
      spark = pow(spark, 2.1);

      return present * spark * twinkle * (0.4 + 0.6 * fract(rnd.x * 17.3));
    }

    void main() {
      vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
      p += u_parallax * 0.014;

      float t = u_time * 0.012;

      // Rotate coordinates to match sweeping diagonal Milky Way arc (~27 deg)
      float angle = -0.47;
      mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      vec2 gp = rot * p;

      // Gentle upward arch of the galactic plane
      float arch = 0.085 * sin(gp.x * 1.45 + 0.25) - 0.055 * gp.x * gp.x;
      float dy = gp.y - arch;

      // Galactic bands
      float coreBand = exp(-dy * dy * 28.0);
      float midBand = exp(-dy * dy * 10.5);
      float outerHalo = exp(-dy * dy * 3.8);

      // Secondary upper faint nebula ribbon (top-left accent)
      float dyUpper = dy - 0.33 + 0.04 * sin(gp.x * 2.1);
      float upperRibbon = exp(-dyUpper * dyUpper * 55.0) * smoothstep(0.65, -0.75, gp.x);

      // Domain-warped nebula clouds & dark cosmic dust rifts
      vec2 warp = vec2(
        fbm(gp * vec2(1.8, 3.2) + vec2(t * 0.4, 1.3)),
        fbm(gp * vec2(1.9, 3.4) + vec2(4.7, -t * 0.3))
      );

      float cloudStructure = fbm(gp * vec2(2.6, 5.2) + warp * 0.95 + vec2(t * 0.2, 0.0));
      float fineFilaments = fbm(gp * vec2(6.5, 13.0) + warp * 1.4 - vec2(t * 0.3, 0.0));

      // Velvety dark Great Rift absorption cutting through the core
      float riftNoise = fbm(gp * vec2(2.3, 6.8) + warp * 1.15 + vec2(2.4, 8.1));
      float riftMask = smoothstep(0.36, 0.64, riftNoise);
      float riftCoreWeight = exp(-dy * dy * 48.0);
      float dustTransmission = mix(1.0, 0.22 + 0.78 * (1.0 - riftMask), riftCoreWeight * 0.92);

      // Upper ribbon wispy modulation
      float upperMod = smoothstep(0.32, 0.78, fbm(gp * vec2(3.0, 6.0) + warp * 0.7));

      // Base deep obsidian-navy cosmos gradient
      vec3 skyColor = mix(
        vec3(0.009, 0.014, 0.034),
        vec3(0.022, 0.034, 0.072),
        outerHalo * 0.85 + 0.15 * clamp(0.5 - p.y, 0.0, 1.0)
      );

      // Subtle indigo outer Milky Way glow
      vec3 outerGlowColor = vec3(0.11, 0.16, 0.31);
      skyColor += outerGlowColor * midBand * (0.28 + 0.45 * cloudStructure) * u_intensity;

      // Secondary upper wispy indigo veil
      skyColor += vec3(0.14, 0.19, 0.34) * upperRibbon * upperMod * 0.45 * u_intensity;

      // Bright silver-blue galactic core clouds
      float coreClouds = coreBand * (0.45 + 0.55 * cloudStructure) * (0.65 + 0.35 * fineFilaments);
      vec3 coreColor = mix(vec3(0.30, 0.37, 0.54), vec3(0.72, 0.78, 0.90), pow(coreBand, 0.75));
      skyColor += coreColor * coreClouds * 0.62 * dustTransmission * u_intensity;

      // Crisp unresolved micro-stardust embedded inside Milky Way
      float bandDensity = clamp(coreBand * 1.15 + midBand * 0.35 + upperRibbon * 0.2, 0.0, 1.0) * dustTransmission;
      float dust1 = microStarLayer(gp * 260.0 + vec2(13.2, 7.4), 0.36 * bandDensity + 0.025, 0.30, 1.4);
      float dust2 = microStarLayer(gp * 460.0 + vec2(51.7, 29.1), 0.44 * bandDensity + 0.015, 0.26, 2.1);
      float dust3 = microStarLayer(gp * 145.0 + vec2(3.9, 91.5), 0.16 * bandDensity + 0.012, 0.24, 1.0);

      vec3 dustStarCol = mix(vec3(0.76, 0.84, 1.0), vec3(0.96, 0.97, 1.0), 0.55);
      skyColor += dustStarCol * (dust1 * 0.55 + dust2 * 0.42 + dust3 * 0.75) * u_intensity;

      // Subtle atmospheric tone curve to keep blacks deep and highlights silky
      skyColor = skyColor / (1.0 + skyColor * 0.32);
      skyColor = pow(max(skyColor, 0.0), vec3(0.95));

      gl_FragColor = vec4(skyColor, 1.0);
    }
  `;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("Cosmos shader compile warning:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  class CosmosRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.intensity = 1.0;
      this.parallax = { x: 0, y: 0 };
      this.targetParallax = { x: 0, y: 0 };
      this.startTime = performance.now();
      this.useWebGL = false;
      this.width = 1;
      this.height = 1;
      this.dpr = 1;

      this.init();
    }

    init() {
      const gl =
        this.canvas.getContext("webgl2", { antialias: false, powerPreference: "high-performance" }) ||
        this.canvas.getContext("webgl", { antialias: false, powerPreference: "high-performance" });

      if (gl) {
        const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
        const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
        if (vs && fs) {
          const program = gl.createProgram();
          gl.attachShader(program, vs);
          gl.attachShader(program, fs);
          gl.linkProgram(program);

          if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            this.gl = gl;
            this.program = program;
            this.useWebGL = true;

            const buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
              gl.STATIC_DRAW
            );

            const posLoc = gl.getAttribLocation(program, "a_pos");
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            this.uResolution = gl.getUniformLocation(program, "u_resolution");
            this.uTime = gl.getUniformLocation(program, "u_time");
            this.uParallax = gl.getUniformLocation(program, "u_parallax");
            this.uIntensity = gl.getUniformLocation(program, "u_intensity");
          }
        }
      }

      if (!this.useWebGL) {
        this.ctx2d = this.canvas.getContext("2d");
      }

      this.resize();
    }

    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.width = Math.max(1, Math.floor(window.innerWidth * this.dpr));
      this.height = Math.max(1, Math.floor(window.innerHeight * this.dpr));

      this.canvas.width = this.width;
      this.canvas.height = this.height;

      if (this.useWebGL) {
        this.gl.viewport(0, 0, this.width, this.height);
      } else {
        this.renderFallback2D();
      }
    }

    setParallax(nx, ny) {
      this.targetParallax.x = nx;
      this.targetParallax.y = ny;
    }

    setIntensity(value) {
      this.intensity = value;
      if (!this.useWebGL) {
        this.renderFallback2D();
      }
    }

    renderFallback2D() {
      const ctx = this.ctx2d;
      if (!ctx) return;
      const w = this.width;
      const h = this.height;

      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#03060f");
      bg.addColorStop(0.5, "#081024");
      bg.addColorStop(1, "#03060f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);
      ctx.rotate(-0.46);
      const bandGrad = ctx.createLinearGradient(0, -h * 0.28, 0, h * 0.28);
      bandGrad.addColorStop(0, "rgba(35, 52, 96, 0)");
      bandGrad.addColorStop(0.35, `rgba(74, 96, 146, ${0.22 * this.intensity})`);
      bandGrad.addColorStop(0.5, `rgba(176, 194, 228, ${0.34 * this.intensity})`);
      bandGrad.addColorStop(0.65, `rgba(74, 96, 146, ${0.22 * this.intensity})`);
      bandGrad.addColorStop(1, "rgba(35, 52, 96, 0)");
      ctx.fillStyle = bandGrad;
      ctx.fillRect(-w, -h * 0.3, w * 2, h * 0.6);
      ctx.restore();
    }

    render(now) {
      this.parallax.x += (this.targetParallax.x - this.parallax.x) * 0.04;
      this.parallax.y += (this.targetParallax.y - this.parallax.y) * 0.04;

      if (!this.useWebGL) return;

      const gl = this.gl;
      const elapsed = (now - this.startTime) * 0.001;

      gl.useProgram(this.program);
      gl.uniform2f(this.uResolution, this.width, this.height);
      gl.uniform1f(this.uTime, elapsed);
      gl.uniform2f(this.uParallax, this.parallax.x, this.parallax.y);
      gl.uniform1f(this.uIntensity, this.intensity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  window.CosmosRenderer = CosmosRenderer;
})();

