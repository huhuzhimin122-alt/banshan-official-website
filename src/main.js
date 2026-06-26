import { createApp, onMounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './styles.css'

gsap.registerPlugin(ScrollTrigger)

const App = {
  template: `
    <main class="site-shell">
      <section class="hero-sequence" id="hero">
        <div class="outside-world" aria-hidden="true"></div>
        <div class="world-layer">
          <video id="worldVideo" class="world-video" muted playsinline preload="auto" poster="media/hidden-world-poster.jpg">
            <source src="media/hidden-world.mp4" type="video/mp4" />
          </video>
          <div class="world-fallback" aria-hidden="true">
            <span class="sun-core"></span><span class="cloud cloud-a"></span><span class="cloud cloud-b"></span><span class="cloud cloud-c"></span>
            <span class="peak peak-a"></span><span class="peak peak-b"></span><span class="peak peak-c"></span><span class="peak peak-d"></span>
          </div>
        </div>
        <canvas id="stonegate-canvas" class="stonegate-canvas"></canvas>
        <div class="portal-glow"></div>
        <div class="film-grade"></div><div class="film-noise"></div>

        <header class="top-nav">
          <a class="brand" href="#hero"><strong>伴山</strong><span>BANSHAN</span></a>
          <nav><a href="#local">本地向导</a><a href="#voice">AI语音向导</a><a href="#discover">城市探索</a></nav>
        </header>
        <aside class="chapter-indicator"><span class="chapter-line"></span><b id="chapterNumber">01</b><em id="chapterName">GATEWAY</em></aside>

        <div class="hero-copy copy-a"><p class="eyebrow">BANSHAN WORLD</p><h1>穿过山门<br/>看见城市的另一面</h1><p>伴山不是普通旅游官网。首屏应该先建立“进入一个世界”的感受，再承接本地向导、城市探索和 AI 语音向导。</p></div>
        <div class="hero-copy copy-b"><p class="eyebrow">THROUGH THE GATE</p><h2>门内是新世界，门外是现实入口。</h2><p>石门只做前景框景；真正的张家界云海只出现在门洞之后，滚动时相机穿过门，而不是把一张图贴在中间。</p></div>
        <div class="hero-copy copy-c"><p class="eyebrow">HIDDEN WORLD</p><h2>进入之后，镜头再慢慢打开。</h2><p>穿过石门后，画面由入口变成云海峰林世界，形成官网的第一记忆点。</p></div>
        <div class="scroll-hint"><i></i><span>SCROLL TO ENTER</span></div>
      </section>

      <section class="content-section intro layered-copy" id="discover">
        <div class="copy-stage">
          <p class="section-kicker">EXPERIENCE FIRST</p>
          <div class="copy-step"><h2>官网不是功能说明书，而是伴山的第一段体验。</h2><p>首屏用石门和张家界云海建立“进入另一个世界”的品牌记忆。</p></div>
          <div class="copy-step"><h2>先让用户产生探索欲，再承接业务功能。</h2><p>本地向导、AI 语音向导和城市探索，不再像普通产品卡片，而是成为这段旅程里的下一步。</p></div>
          <div class="copy-step"><h2>每一次滚动，都应该像镜头继续向前。</h2><p>文字、卡片、图片和遮罩都跟随滚动分层变化，形成沉浸式叙事节奏。</p></div>
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
      initHeroSystem()
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

function initHeroSystem() {
  const canvas = document.getElementById('stonegate-canvas')
  const video = document.getElementById('worldVideo')
  const chapterNumber = document.getElementById('chapterNumber')
  const chapterName = document.getElementById('chapterName')

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 1200)
  camera.position.set(0, 0.1, 7.4)

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.06

  const gateGroup = new THREE.Group()
  gateGroup.position.set(0.42, -0.1, -0.2)
  scene.add(gateGroup)
  createProceduralGate(gateGroup)
  loadStoneGate(gateGroup)

  const mistGroup = createMistPlanes()
  scene.add(mistGroup)
  scene.add(createLightRig())

  setupVideo(video)

  const target = new THREE.Vector3(0.1, 0.02, -6)
  const clock = new THREE.Clock()
  const state = { p: 0, lastChapter: '' }

  gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.hero-sequence', start: 'top top', end: 'bottom bottom', scrub: 1.25 },
    onUpdate: () => applyProgress(state.p)
  })

  function applyProgress(p) {
    const approach = smoothstep(0.06, 0.48, p)
    const pass = smoothstep(0.42, 0.72, p)
    const reveal = smoothstep(0.62, 1, p)

    camera.position.x = lerp(0, 0.16, reveal)
    camera.position.y = lerp(0.1, 0.32, reveal)
    camera.position.z = lerp(7.4, 2.15, approach)
    camera.fov = lerp(38, 43, reveal)
    camera.rotation.x = THREE.MathUtils.degToRad(lerp(0, -12, reveal))
    camera.updateProjectionMatrix()

    gateGroup.position.x = lerp(0.42, 0.18, approach)
    gateGroup.position.z = lerp(-0.2, 1.2, approach)
    gateGroup.scale.setScalar(lerp(1, 2.22, approach))
    gateGroup.traverse((item) => {
      if (item.material) {
        item.material.opacity = 1 - smoothstep(0.68, 0.86, p)
        item.material.needsUpdate = true
      }
    })

    const portalExpand = smoothstep(0.45, 0.86, p)
    document.documentElement.style.setProperty('--hero-progress', p.toFixed(3))
    document.documentElement.style.setProperty('--portal-left', `${lerp(43, 0, portalExpand).toFixed(2)}%`)
    document.documentElement.style.setProperty('--portal-right', `${lerp(39, 0, portalExpand).toFixed(2)}%`)
    document.documentElement.style.setProperty('--portal-top', `${lerp(20, 0, portalExpand).toFixed(2)}%`)
    document.documentElement.style.setProperty('--portal-bottom', `${lerp(18, 0, portalExpand).toFixed(2)}%`)
    document.documentElement.style.setProperty('--world-scale', lerp(1.18, 1.04, p).toFixed(3))
    document.documentElement.style.setProperty('--world-y', `${lerp(0, -4.5, reveal).toFixed(2)}vh`)
    document.documentElement.style.setProperty('--world-tilt', `${lerp(0, 7, reveal).toFixed(2)}deg`)
    document.documentElement.style.setProperty('--outside-fade', (1 - pass).toFixed(3))

    syncVideo(video, p)
    updateChapters(p, chapterNumber, chapterName, state)
  }

  function animate() {
    const t = clock.getElapsedTime()
    gateGroup.position.y += Math.sin(t * 0.65) * 0.0008
    mistGroup.children.forEach((plane, index) => {
      plane.position.x = Math.sin(t * 0.2 + index) * 0.18
    })
    camera.lookAt(target)
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

function setupVideo(video) {
  if (!video) return
  video.pause()
  video.addEventListener('loadedmetadata', () => { video.currentTime = 0.01 }, { once: true })
}

function syncVideo(video, progress) {
  if (!video || !video.duration || Number.isNaN(video.duration)) return
  const targetTime = clamp(progress * video.duration * 0.92, 0.01, Math.max(0.02, video.duration - 0.08))
  if (Math.abs(video.currentTime - targetTime) > 0.07) video.currentTime = targetTime
}

function updateChapters(p, number, name, state) {
  let next = '01|GATEWAY'
  if (p > 0.36) next = '02|PASS THROUGH'
  if (p > 0.66) next = '03|REVEAL'
  if (!number || !name || state.lastChapter === next) return
  state.lastChapter = next
  const [n, label] = next.split('|')
  gsap.to([number, name], { y: -8, opacity: 0, duration: 0.16, onComplete: () => {
    number.textContent = n; name.textContent = label
    gsap.fromTo([number, name], { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.04 })
  } })
}

function createLightRig() {
  const rig = new THREE.Group()
  rig.add(new THREE.HemisphereLight(0xffedd8, 0x0e1815, 1.2))
  const sun = new THREE.DirectionalLight(0xffb66a, 4.8); sun.position.set(0.4, 2.5, -4.8); rig.add(sun)
  const edge = new THREE.DirectionalLight(0xff8d42, 2.6); edge.position.set(-2.4, 1.2, -2.4); rig.add(edge)
  const fill = new THREE.DirectionalLight(0x7c9cc4, 0.45); fill.position.set(2.5, 1.6, 3.6); rig.add(fill)
  return rig
}

function loadStoneGate(gateGroup) {
  const loader = new GLTFLoader()
  loader.load('models/stonegate.glb', (gltf) => {
    gateGroup.clear()
    const model = gltf.scene
    normalizeModel(model, 4.25)
    model.position.set(0, -0.2, 0)
    model.traverse((node) => {
      if (!node.isMesh) return
      node.frustumCulled = false
      node.material = createRockMaterial(node.material)
    })
    gateGroup.add(model)
  }, undefined, () => {})
}

function normalizeModel(model, targetSize) {
  const box = new THREE.Box3().setFromObject(model)
  const size = new THREE.Vector3(); const center = new THREE.Vector3()
  box.getSize(size); box.getCenter(center)
  model.position.sub(center)
  model.scale.setScalar(targetSize / Math.max(size.x, size.y, size.z))
}

function createRockMaterial(source) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x504c40, roughness: 0.98, metalness: 0, transparent: true, opacity: 1 })
  if (source && source.map) mat.map = source.map
  return mat
}

function createProceduralGate(group) {
  const material = createRockMaterial()
  const parts = [
    { size: [0.9, 4.8, 1.0], pos: [-1.35, -0.1, 0] },
    { size: [0.9, 4.8, 1.0], pos: [1.35, -0.1, 0] },
    { size: [3.6, 0.85, 1.0], pos: [0, 2.05, 0] }
  ]
  parts.forEach((part) => {
    const geometry = new THREE.BoxGeometry(...part.size, 18, 36, 10)
    roughen(geometry)
    const mesh = new THREE.Mesh(geometry, material.clone())
    mesh.position.set(...part.pos)
    group.add(mesh)
  })
}

function roughen(geometry) {
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i)
    const ridge = Math.sin(x * 9.5 + y * 4.8) * 0.075 + Math.sin(y * 11.2 + z * 5.4) * 0.05
    pos.setXYZ(i, x + ridge * 0.55, y + ridge * 0.16, z + ridge)
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()
}

function createMistPlanes() {
  const group = new THREE.Group()
  for (let i = 0; i < 8; i++) {
    const geo = new THREE.PlaneGeometry(5.2 + i * 0.35, 0.9 + i * 0.1)
    const mat = new THREE.MeshBasicMaterial({ color: 0xffc58a, transparent: true, opacity: 0.045 + i * 0.008, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(0, -1.34 + i * 0.08, -3.1 - i * 0.1)
    group.add(mesh)
  }
  return group
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
  steps.forEach((step, index) => {
    if (index === 0) return
    tl.to(steps[index - 1], { opacity: 0, y: -34, filter: 'blur(18px)', duration: 0.45 }, index - 0.15)
    tl.to(step, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55 }, index)
  })
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
