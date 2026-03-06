/* ═══════════════════════════════════════════════════════════
   WebGL — Three.js hero noise field with mouse reactivity
   ═══════════════════════════════════════════════════════════ */

const WebGLScene = (() => {
  let scene, camera, renderer, mesh;
  let mouseX = 0.5, mouseY = 0.5;
  let targetMouseX = 0.5, targetMouseY = 0.5;
  let animationId = null;
  let isActive = false;

  /* ── Inline Shaders ──────────────────────────────────── */

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Simplex noise + smooth mouse-reactive field
  const fragmentShader = `
    precision highp float;

    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uResolution;

    varying vec2 vUv;

    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
             + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                   dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / uResolution.y;
      vec2 scaledUv = vec2(uv.x * aspect, uv.y);

      // Multiple noise octaves
      float n = 0.0;
      n += 0.5 * snoise(scaledUv * 2.0 + uTime * 0.05);
      n += 0.25 * snoise(scaledUv * 4.0 - uTime * 0.08);
      n += 0.125 * snoise(scaledUv * 8.0 + uTime * 0.03);

      // Mouse influence — subtle warping
      float dist = distance(uv, uMouse);
      float mouseInfluence = smoothstep(0.5, 0.0, dist) * 0.08;
      n += mouseInfluence * snoise(scaledUv * 6.0 + uTime * 0.1);

      // Map to extremely subtle grayscale range (0.88 — 0.96)
      float gray = 0.92 + n * 0.04;

      gl_FragColor = vec4(vec3(gray), 1.0);
    }
  `;

  /* ── Init ────────────────────────────────────────────── */

  function init() {
    // Skip on mobile or reduced motion
    if (isMobile() || prefersReducedMotion()) {
      applyFallback();
      return;
    }

    // Check for WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      applyFallback();
      return;
    }

    createScene();
    setupMouseTracking();
    animate();
    window.addEventListener('resize', onResize);
    isActive = true;
  }

  /* ── Scene Setup ─────────────────────────────────────── */

  function createScene() {
    scene = new THREE.Scene();

    // Orthographic camera fills viewport exactly
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      pointer-events: none;
    `;
    document.body.prepend(renderer.domElement);

    // Full-viewport plane
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Fade in the canvas
    renderer.domElement.style.opacity = '0';
    gsap.to(renderer.domElement, {
      opacity: 1,
      duration: 0.8,
      delay: 0.3,
      ease: 'power2.out',
    });
  }

  /* ── Mouse Tracking ──────────────────────────────────── */

  function setupMouseTracking() {
    document.addEventListener('mousemove', (e) => {
      targetMouseX = e.clientX / window.innerWidth;
      targetMouseY = 1.0 - (e.clientY / window.innerHeight); // Flip Y for GL
    });
  }

  /* ── Animation Loop ──────────────────────────────────── */

  function animate() {
    animationId = requestAnimationFrame(animate);

    if (!mesh) return;

    // Smooth mouse interpolation
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    mesh.material.uniforms.uTime.value = performance.now() * 0.001;
    mesh.material.uniforms.uMouse.value.set(mouseX, mouseY);

    renderer.render(scene, camera);
  }

  /* ── Resize ──────────────────────────────────────────── */

  function onResize() {
    if (!renderer || !mesh) return;

    renderer.setSize(window.innerWidth, window.innerHeight);
    mesh.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  }

  /* ── Fallback ────────────────────────────────────────── */

  function applyFallback() {
    // Apply subtle CSS gradient fallback
    const fallback = document.createElement('div');
    fallback.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      pointer-events: none;
      background: linear-gradient(
        135deg,
        #f5f5f5 0%,
        #fafafa 30%,
        #f0f0f0 60%,
        #fafafa 100%
      );
    `;
    document.body.prepend(fallback);
  }

  /* ── Helpers ─────────────────────────────────────────── */

  function isMobile() {
    return window.innerWidth < 768;
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function destroy() {
    if (animationId) cancelAnimationFrame(animationId);
    if (renderer) {
      renderer.dispose();
      renderer.domElement.remove();
    }
    window.removeEventListener('resize', onResize);
    isActive = false;
  }

  return { init, destroy };
})();
