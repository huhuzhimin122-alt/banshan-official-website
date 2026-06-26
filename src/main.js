import { createApp, onMounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './styles.css'

gsap.registerPlugin(ScrollTrigger)

const MODEL_URL = 'models/stonegate_web_light_draco.glb'
const WORLD_VIDEO_URL = 'media/portal-world.mp4'
const WORLD_POSTER_URL = 'media/portal-world-poster.jpg'

const App = {
  template: `
    <main class="site-shell">
      <section class="hero-sequence" id="hero">
        <div class="outside-reality" aria-hidden="true"></div>
        <video id="worldVideo" class="world-video-source" muted playsinline preload="auto" crossorigin="anonymous"></video>
        <canvas id="portalCanvas" class="portal-canvas"></canvas>
        <div class="portal-light"></div>
        <div class="cinema-grade"></div>
        <div class="film-noise"></div>

        <header class="top-nav">
          <a class="brand" href="#hero"><strong>伴山</strong><span>BANSHAN</span></a>
          <nav><a href="#local">本地向导</a><a href="#voice">AI语音向导</a><a href="#discover">城市探索</a></nav>
        </header>

        <div class="hero-copy copy-a"><p class="eyebrow">BANSHAN WORLD</p><h1>穿过山门<br/>进入城市的另一面</h1><p>门外是现实入口，门内才是张家界云海世界。滚动时相机穿过山门，视频作为 WebGL 世界纹理参与交互，不是直接铺一个视频。</p></div>
        <div class="hero-copy copy-b"><p class="eyebrow">CAMERA FLY THROUGH</p><h2>门内的世界开始扩大。</h2><p>石门模型保持在前景，门洞里的风景作为空间平面被滚动放大、拉近、俯视。</p></div>
        <div class="hero-copy copy-c"><p class="eyebrow">HIDDEN WORLD REVEAL</p><h2>云海变成完整场景。</h2><p>穿过之后，石门从镜头两侧退场，张家界云海世界扩展到全屏。</p></div>
        <aside class="chapter-indicator"><span></span><b id="chapterNumber">01</b><em id="chapterName">PORTAL</em></aside>
        <div class="scroll-hint"><i></i><span>SCROLL TO ENTER</span></div>
      </section>

      <section class="content-section intro layered-copy" id="discover">
        <div class="copy-stage">
          <p class="section-kicker">EXPERIENCE FIRST</p>
          <div class="copy-step"><h2>官网不是功能说明书，而是伴山的第一段体验。</h2><p>首屏用石门和张家界云海建立“进入另一个世界”的品牌记忆。</p></div>
          <div class="copy-step"><h2>先让用户产生探索欲，再承接业务功能。</h2><p>本地向导、AI 语音向导和城市探索，成为这段旅程里的下一步。</p></div>
          <div class="copy-step"><h2>每一次滚动，都应该像镜头继续向前。</h2><p>文字、卡片、图片和遮罩都跟随滚动分层变化。</p></div>
        </div>
      </section>

      <section class="content-section parallax-feature">
        <div class="mask-image image-a"></div>
        <div class="feature-copy"><p class="section-kicker">LOCAL GUIDE</p><h2>把目的地变成真实的人、路线和故事。</h2><p>伴山连接本地向导、城市体验者和抵达城市的人，提供比攻略更真实的体验入口。</p></div>
      </section>

      <section class="drag-section" id="local">
        <div class="drag-head"><p class="section-kicker">DRAG TO NAVIGATE</p><h2>城市体验不是列表，而是一组可以横向探索的场景。</h2></div>
        <div class="drag-viewport" id="dragViewport"><div class="drag-track" id="dragTrack">
          <article class="experience-card"><span>01</span><h3>山野疗愈</h3><p>清晨、云海、山路和本地向导。</p></article>
          <article class="experience-card"><span>02</span><h3>城市漫游</h3><p>从街区、咖啡馆、老店和故事开始。</p></article>
          <article class="experience-card" id="voice"><span>03</span><h3>AI语音向导</h3><p>实时对话，边走边听，边问边发现。</p></article>
          <article class="experience-card"><span>04</span><h3>商务陪同</h3><p>陌生城市里的高效接待和路线协助。</p></article>
          <article class="experience-card"><span>05</span><h3>亲子探索</h3><p>更轻松地认识自然、历史和城市生活。</p></article>
        </div></div>
        <div class="drag-progress"><span id="dragProgress"></span></div>
      </section>
    </main>
  `,
  setup() {
    onMounted(() => {
      initSmoothScroll()
      initPortalHero()
      initLayeredCopy()
      initDragCards()
      initParallaxMasks()
      initContentReveal()
    })
  }
}

createApp(App).mount('#app')

function initSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.85, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
}

function initPortalHero() {
  const canvas = document.getElementById('portalCanvas')
  const video = document.getElementById('worldVideo')
  const chapterNumber = document.getElementById('chapterNumber')
  const chapterName = document.getElementById('chapterName')

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 1200)
  camera.position.set(0, 0.08, 7.4)

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08

  const worldPlane = createInteractiveWorldPlane(video)
  worldPlane.position.set(0.7, 0.16, -3.2)
  scene.add(worldPlane)

  const portalGroup = new THREE.Group()
  portalGroup.position.set(0.75, -0.06, 0)
  scene.add(portalGroup)

  const fallbackPortal = createFallbackPortal(portalGroup)
  loadStoneGateModel(portalGroup, fallbackPortal)
  scene.add(createLightRig())
  const atmosphere = createAtmosphere()
  scene.add(atmosphere)

  setupVideo(video)

  const state = { p: 0, lastChapter: '' }
  const lookTarget = new THREE.Vector3(0.18, 0.05, -7)
  const clock = new THREE.Clock()

  gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.hero-sequence', start: 'top top', end: 'bottom bottom', scrub: 1.15 },
    onUpdate: () => applyHeroProgress(state.p)
  })

  function applyHeroProgress(p) {
    const approach = smoothstep(0.04, 0.38, p)
    const pass = smoothstep(0.34, 0.66, p)
    const reveal = smoothstep(0.56, 1, p)
    const worldExpand = smoothstep(0.26, 0.84, p)

    camera.position.z = lerp(7.4, 1.22, approach)
    camera.position.y = lerp(0.08, 0.46, reveal)
    camera.position.x = lerp(0, 0.22, reveal)
    camera.fov = lerp(38, 46, reveal)
    camera.rotation.x = THREE.MathUtils.degToRad(lerp(0, -14, reveal))
    camera.updateProjectionMatrix()

    portalGroup.position.z = lerp(0, 3.05, approach)
    portalGroup.position.x = lerp(0.75, 0.2, approach)
    portalGroup.scale.setScalar(lerp(1, 2.72, approach))
    portalGroup.rotation.y = THREE.MathUtils.degToRad(lerp(-1.2, -7.5, pass))
    portalGroup.traverse((node) => {
      if (node.material) {
        node.material.opacity = 1 - smoothstep(0.60, 0.80, p)
        node.material.needsUpdate = true
      }
    })

    worldPlane.position.z = lerp(-3.2, -2.05, approach)
    worldPlane.position.x = lerp(0.72, 0.08, worldExpand)
    worldPlane.position.y = lerp(0.14, 0.36, reveal)
    worldPlane.scale.set(lerp(0.72, 7.2, worldExpand), lerp(1.08, 4.2, worldExpand), 1)
    worldPlane.rotation.x = THREE.MathUtils.degToRad(lerp(0, -7, reveal))
    worldPlane.material.opacity = lerp(0.72, 1, worldExpand)
    worldPlane.material.uniforms.uProgress.value = p
    worldPlane.material.uniforms.uTime.value = clock.getElapsedTime()

    atmosphere.children.forEach((m, i) => {
      m.material.opacity = (0.05 + i * 0.012) * (1 - smoothstep(0.82, 1, p))
      m.position.z = lerp(-2.8, 0.6, approach) - i * 0.08
    })

    document.documentElement.style.setProperty('--hero-progress', p.toFixed(3))
    document.documentElement.style.setProperty('--outside-fade', (1 - smoothstep(0.48, 0.72, p)).toFixed(3))
    document.documentElement.style.setProperty('--portal-cx', `${lerp(58, 50, reveal).toFixed(2)}%`)

    syncVideo(video, p)
    updateChapters(p, chapterNumber, chapterName, state)
  }

  function animate() {
    const t = clock.getElapsedTime()
    worldPlane.material.uniforms.uTime.value = t
    portalGroup.rotation.z = Math.sin(t * 0.35) * 0.002
    atmosphere.children.forEach((m, i) => {
      m.position.x = Math.sin(t * 0.18 + i) * 0.2
      m.position.y += Math.sin(t * 0.25 + i) * 0.0007
    })
    camera.lookAt(lookTarget)
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

function createInteractiveWorldPlane(video) {
  const texture = new THREE.VideoTexture(video)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter

  const poster = new THREE.TextureLoader().load(WORLD_POSTER_URL)
  poster.colorSpace = THREE.SRGBColorSpace

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uVideo: { value: texture },
      uPoster: { value: poster },
      uProgress: { value: 0 },
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float uProgress;
      uniform float uTime;
      void main(){
        vUv = uv;
        vec3 p = position;
        float wave = sin((uv.x * 7.0 + uTime * 0.45)) * 0.025 + sin((uv.y * 5.0 - uTime * 0.28)) * 0.018;
        p.z += wave * smoothstep(0.08, 1.0, uProgress);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uVideo;
      uniform sampler2D uPoster;
      uniform float uProgress;
      uniform float uTime;
      void main(){
        vec2 uv = vUv;
        uv.x += sin(uv.y * 9.0 + uTime * 0.22) * 0.006 * smoothstep(0.1, 1.0, uProgress);
        vec4 videoColor = texture2D(uVideo, uv);
        vec4 posterColor = texture2D(uPoster, uv);
        vec4 color = mix(posterColor, videoColor, smoothstep(0.04, 0.2, uProgress));
        float vignette = smoothstep(0.9, 0.22, distance(vUv, vec2(0.5)));
        float glow = smoothstep(0.3, 0.0, distance(vUv, vec2(0.54, 0.42))) * 0.22;
        color.rgb = color.rgb * (0.72 + vignette * 0.48) + vec3(1.0, 0.55, 0.18) * glow;
        gl_FragColor = vec4(color.rgb, color.a);
      }
    `
  })

  return new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.0, 40, 40), material)
}

function loadStoneGateModel(group, fallbackPortal) {
  const draco = new DRACOLoader()
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)
  loader.load(MODEL_URL, (gltf) => {
    group.remove(fallbackPortal)
    const model = gltf.scene
    normalizeModel(model, 4.65)
    model.position.set(0, -0.18, 0)
    model.traverse((node) => {
      if (!node.isMesh) return
      node.frustumCulled = false
      node.material = createRockMaterial(node.material)
    })
    group.add(model)
  }, undefined, () => {})
}

function createFallbackPortal(group) {
  const portal = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: 0x3d3a31, roughness: 0.96, metalness: 0, transparent: true, opacity: 1 })
  const geo = new THREE.DodecahedronGeometry(0.32, 1)
  const points = []
  for (let i = 0; i < 38; i++) { const a = Math.PI - (i / 37) * Math.PI; points.push([Math.cos(a) * 1.55, Math.sin(a) * 1.35 + 0.78, 0]) }
  for (let i = 0; i < 28; i++) points.push([-1.55, 0.75 - i * 0.12, 0])
  for (let i = 0; i < 28; i++) points.push([1.55, 0.75 - i * 0.12, 0])
  points.forEach(([x, y, z], i) => {
    const mesh = new THREE.Mesh(geo, mat.clone())
    const noise = Math.sin(i * 13.17) * 0.14
    mesh.position.set(x + noise * 0.35, y + Math.cos(i * 9.4) * 0.08, z + Math.sin(i * 5.9) * 0.16)
    const s = 0.82 + Math.abs(Math.sin(i * 4.7)) * 0.95
    mesh.scale.set(0.72 * s, 1.15 * s, 0.9 + s * 0.35)
    mesh.rotation.set(i * 0.23, i * 0.41, i * 0.17)
    portal.add(mesh)
  })
  portal.position.y = -0.28
  group.add(portal)
  return portal
}

function normalizeModel(model, targetSize) {
  const box = new THREE.Box3().setFromObject(model)
  const size = new THREE.Vector3(); const center = new THREE.Vector3()
  box.getSize(size); box.getCenter(center)
  model.position.sub(center)
  model.scale.setScalar(targetSize / Math.max(size.x, size.y, size.z))
}

function createRockMaterial(source) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x4b4639, roughness: 0.98, metalness: 0, transparent: true, opacity: 1 })
  if (source && source.map) mat.map = source.map
  return mat
}

function createLightRig() {
  const rig = new THREE.Group()
  rig.add(new THREE.HemisphereLight(0xffe7c7, 0x080c0a, 0.88))
  const back = new THREE.DirectionalLight(0xffb36b, 5.8); back.position.set(0.6, 2.6, -4.8); rig.add(back)
  const rim = new THREE.DirectionalLight(0xff8e3d, 3.6); rim.position.set(-2.2, 1.2, -1.8); rig.add(rim)
  const fill = new THREE.DirectionalLight(0x6c86a6, 0.35); fill.position.set(3, 1.6, 4); rig.add(fill)
  return rig
}

function createAtmosphere() {
  const group = new THREE.Group()
  for (let i = 0; i < 9; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffc27a, transparent: true, opacity: 0.05 + i * 0.012, depthWrite: false, blending: THREE.AdditiveBlending })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.8 + i * 0.36, 0.48 + i * 0.08), mat)
    mesh.position.set(0.55 + Math.sin(i) * 1.1, -1.15 + i * 0.13, -2.7 - i * 0.09)
    mesh.rotation.z = (i % 2 ? 1 : -1) * 0.11
    group.add(mesh)
  }
  return group
}

function setupVideo(video) {
  if (!video) return
  video.src = WORLD_VIDEO_URL
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.pause()
  video.addEventListener('loadedmetadata', () => { video.currentTime = 0.01 }, { once: true })
}

function syncVideo(video, progress) {
  if (!video || !video.duration || Number.isNaN(video.duration)) return
  const targetTime = clamp(progress * video.duration * 0.92, 0.01, Math.max(0.02, video.duration - 0.08))
  if (Math.abs(video.currentTime - targetTime) > 0.07) video.currentTime = targetTime
}

function updateChapters(p, number, name, state) {
  let next = '01|PORTAL'
  if (p > 0.36) next = '02|ENTER'
  if (p > 0.66) next = '03|REVEAL'
  if (!number || !name || state.lastChapter === next) return
  state.lastChapter = next
  const [n, label] = next.split('|')
  gsap.to([number, name], { y: -8, opacity: 0, duration: 0.16, onComplete: () => { number.textContent = n; name.textContent = label; gsap.fromTo([number, name], { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.04 }) } })
}

function initContentReveal() {
  gsap.utils.toArray('.content-section:not(.layered-copy), .drag-head').forEach((section) => {
    gsap.from(section.children, { y: 50, opacity: 0, filter: 'blur(18px)', duration: 1.2, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 72%' } })
  })
}

function initLayeredCopy() {
  const steps = gsap.utils.toArray('.copy-step')
  if (!steps.length) return
  gsap.set(steps.slice(1), { opacity: 0, y: 34, filter: 'blur(18px)' })
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.layered-copy', start: 'top top', end: '+=220%', scrub: 1, pin: true } })
  steps.forEach((step, index) => { if (index === 0) return; tl.to(steps[index - 1], { opacity: 0, y: -34, filter: 'blur(18px)', duration: 0.45 }, index - 0.15); tl.to(step, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55 }, index) })
}

function initDragCards() {
  const viewport = document.getElementById('dragViewport'); const track = document.getElementById('dragTrack'); const progress = document.getElementById('dragProgress')
  if (!viewport || !track) return
  let isDown = false, startX = 0, current = 0, target = 0, startTarget = 0, max = 0
  const measure = () => { max = Math.max(0, track.scrollWidth - viewport.clientWidth) }
  const setTarget = (value) => { target = clamp(value, -max, 0) }
  const update = () => { current += (target - current) * 0.12; track.style.transform = `translate3d(${current}px,0,0)`; if (progress) progress.style.width = `${max ? Math.abs(current / max) * 100 : 0}%`; requestAnimationFrame(update) }
  measure(); update(); window.addEventListener('resize', measure)
  viewport.addEventListener('pointerdown', (event) => { isDown = true; startX = event.clientX; startTarget = target; viewport.setPointerCapture(event.pointerId); viewport.classList.add('is-dragging') })
  viewport.addEventListener('pointermove', (event) => { if (isDown) setTarget(startTarget + event.clientX - startX) })
  viewport.addEventListener('pointerup', () => { isDown = false; viewport.classList.remove('is-dragging') })
  viewport.addEventListener('pointercancel', () => { isDown = false; viewport.classList.remove('is-dragging') })
  viewport.addEventListener('wheel', (event) => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) return; event.preventDefault(); setTarget(target - event.deltaX) }, { passive: false })
}

function initParallaxMasks() {
  gsap.utils.toArray('.parallax-feature').forEach((section) => {
    const image = section.querySelector('.mask-image'); const copy = section.querySelector('.feature-copy')
    gsap.fromTo(image, { clipPath: 'inset(18% 18% round 34px)', scale: 1.12, y: 80 }, { clipPath: 'inset(0% 0% round 34px)', scale: 1, y: -40, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1 } })
    gsap.from(copy.children, { y: 42, opacity: 0, filter: 'blur(16px)', duration: 1, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 62%' } })
  })
}

function lerp(a, b, t) { return a + (b - a) * t }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }
function smoothstep(edge0, edge1, value) { const x = clamp((value - edge0) / (edge1 - edge0), 0, 1); return x * x * (3 - 2 * x) }
