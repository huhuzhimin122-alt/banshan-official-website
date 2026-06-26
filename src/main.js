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

const App = {
  template: `
    <main class="site-shell">
      <section class="hero-sequence" id="hero">
        <div class="outside-reality" aria-hidden="true"></div>
        <video id="worldVideo" class="world-video-source" muted playsinline preload="auto" crossorigin="anonymous"></video>
        <canvas id="portalCanvas" class="portal-canvas"></canvas>
        <div class="portal-mask"></div>
        <div class="cinema-grade"></div>
        <div class="film-noise"></div>

        <header class="top-nav">
          <a class="brand" href="#hero"><strong>伴山</strong><span>BANSHAN</span></a>
          <nav><a href="#local">本地向导</a><a href="#voice">AI语音向导</a><a href="#discover">城市探索</a></nav>
        </header>

        <div class="hero-copy copy-a"><p class="eyebrow">BANSHAN WORLD</p><h1>穿过山门<br/>进入城市的另一面</h1><p>石门是前景入口，张家界云海是门后的三维世界。滚动时相机真正穿过山门，不再把视频塞成一个矩形。</p></div>
        <div class="hero-copy copy-b"><p class="eyebrow">CAMERA FLY THROUGH</p><h2>石壁从两侧掠过。</h2><p>门框作为遮挡物留在近景，远处山体、云海、天空在同一个 3D 场景里产生深度。</p></div>
        <div class="hero-copy copy-c"><p class="eyebrow">HIDDEN WORLD REVEAL</p><h2>云海世界完全展开。</h2><p>进入之后相机继续前进并轻微俯视，形成从入口到张家界峰林的完整揭示。</p></div>
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
  scene.fog = new THREE.FogExp2(0x151311, 0.026)

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1600)
  camera.position.set(-0.15, 0.12, 8.8)

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.06

  setupVideo(video)
  const world = createHiddenWorld(video)
  scene.add(world.group)

  const gateGroup = new THREE.Group()
  gateGroup.position.set(0.45, -0.18, 0)
  scene.add(gateGroup)
  const fallbackGate = createFallbackGate(gateGroup)
  loadStoneGateModel(gateGroup, fallbackGate)

  scene.add(createLightRig())
  const state = { p: 0, lastChapter: '' }
  const clock = new THREE.Clock()
  const lookTarget = new THREE.Vector3(0.05, 0.02, -12)

  gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.hero-sequence', start: 'top top', end: 'bottom bottom', scrub: 1.1 },
    onUpdate: () => applyHeroProgress(state.p)
  })

  function applyHeroProgress(p) {
    const approach = smoothstep(0.04, 0.42, p)
    const passing = smoothstep(0.34, 0.64, p)
    const reveal = smoothstep(0.58, 1, p)

    camera.position.z = lerp(8.8, -8.4, approach)
    camera.position.x = lerp(-0.15, 0.9, reveal)
    camera.position.y = lerp(0.12, 2.1, reveal)
    camera.fov = lerp(40, 50, reveal)
    camera.updateProjectionMatrix()

    lookTarget.set(lerp(0.05, 1.1, reveal), lerp(0.02, -1.1, reveal), lerp(-12, -28, reveal))

    gateGroup.position.x = lerp(0.45, 0.05, approach)
    gateGroup.position.z = lerp(0, 0.6, approach)
    gateGroup.scale.setScalar(lerp(1, 1.35, approach))
    gateGroup.rotation.y = THREE.MathUtils.degToRad(lerp(-1, -8, passing))
    gateGroup.traverse((node) => {
      if (node.material) {
        node.material.opacity = 1 - smoothstep(0.54, 0.74, p)
        node.material.needsUpdate = true
      }
    })

    world.group.position.z = lerp(-3, 2.2, approach)
    world.group.position.y = lerp(0, -0.35, reveal)
    world.group.rotation.x = THREE.MathUtils.degToRad(lerp(0, 3.2, reveal))
    world.mountains.children.forEach((m, i) => {
      m.position.z = m.userData.baseZ + lerp(0, 2.4 + i * 0.02, approach)
      m.position.x = m.userData.baseX + Math.sin(clock.getElapsedTime() * 0.12 + i) * 0.015
    })
    world.clouds.children.forEach((c, i) => {
      c.position.x = c.userData.baseX + Math.sin(clock.getElapsedTime() * 0.16 + i) * c.userData.drift
      c.position.z = c.userData.baseZ + lerp(0, 3.8, approach)
      c.material.opacity = c.userData.opacity * lerp(0.65, 1, reveal)
    })
    world.sun.material.opacity = lerp(0.42, 0.88, reveal)

    document.documentElement.style.setProperty('--hero-progress', p.toFixed(3))
    document.documentElement.style.setProperty('--outside-fade', (1 - smoothstep(0.44, 0.78, p)).toFixed(3))
    document.documentElement.style.setProperty('--portal-cx', `${lerp(56, 50, reveal).toFixed(2)}%`)
    document.documentElement.style.setProperty('--portal-size', `${lerp(13, 140, smoothstep(0.30, 0.86, p)).toFixed(2)}vmax`)

    syncVideo(video, p)
    updateChapters(p, chapterNumber, chapterName, state)
  }

  function animate() {
    const t = clock.getElapsedTime()
    world.sky.rotation.y = t * 0.006
    world.clouds.children.forEach((c, i) => {
      c.material.rotation = Math.sin(t * 0.08 + i) * 0.015
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

function createHiddenWorld(video) {
  const group = new THREE.Group()
  group.position.set(0, 0, -3)

  const videoTexture = new THREE.VideoTexture(video)
  videoTexture.colorSpace = THREE.SRGBColorSpace
  videoTexture.minFilter = THREE.LinearFilter
  videoTexture.magFilter = THREE.LinearFilter

  const skyMat = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.BackSide, transparent: true, opacity: 0.92 })
  const sky = new THREE.Mesh(new THREE.SphereGeometry(62, 64, 32), skyMat)
  sky.position.set(0, 7, -30)
  sky.scale.set(1.5, 0.85, 1)
  group.add(sky)

  const sunTexture = createRadialTexture(['rgba(255,255,255,1)', 'rgba(255,214,139,.85)', 'rgba(255,143,40,.25)', 'rgba(255,143,40,0)'])
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTexture, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }))
  sun.position.set(3.8, 7.6, -28)
  sun.scale.set(12, 12, 1)
  group.add(sun)

  const mountains = new THREE.Group()
  const mountainMats = [
    new THREE.MeshStandardMaterial({ color: 0x151b17, roughness: 1, metalness: 0 }),
    new THREE.MeshStandardMaterial({ color: 0x263028, roughness: 1, metalness: 0 }),
    new THREE.MeshStandardMaterial({ color: 0x3a382e, roughness: 1, metalness: 0 })
  ]
  const rows = [
    { z: -9, count: 9, spread: 12, height: [3.0, 5.8], scale: 1.0, mat: mountainMats[0] },
    { z: -15, count: 15, spread: 22, height: [3.4, 6.8], scale: 1.25, mat: mountainMats[1] },
    { z: -24, count: 28, spread: 44, height: [2.8, 7.6], scale: 1.7, mat: mountainMats[2] },
    { z: -35, count: 36, spread: 66, height: [2.2, 6.0], scale: 2.0, mat: mountainMats[2] }
  ]
  rows.forEach((row, rowIndex) => {
    for (let i = 0; i < row.count; i++) {
      const seed = Math.sin((i + 1) * 12.989 + rowIndex * 78.233) * 43758.5453
      const r = seed - Math.floor(seed)
      const x = -row.spread / 2 + (i / Math.max(1, row.count - 1)) * row.spread + (r - 0.5) * 1.8
      const h = lerp(row.height[0], row.height[1], r)
      const pillar = createPillar(h * row.scale, row.mat.clone(), r)
      pillar.position.set(x, -3.05 + h * row.scale * 0.48, row.z + (r - 0.5) * 2)
      pillar.userData.baseX = pillar.position.x
      pillar.userData.baseZ = pillar.position.z
      mountains.add(pillar)
    }
  })
  group.add(mountains)

  const clouds = new THREE.Group()
  const cloudTexture = createCloudTexture()
  for (let i = 0; i < 42; i++) {
    const r = pseudo(i)
    const mat = new THREE.SpriteMaterial({ map: cloudTexture, color: 0xffd6a4, transparent: true, opacity: 0.25 + r * 0.22, depthWrite: false, blending: THREE.AdditiveBlending })
    const s = new THREE.Sprite(mat)
    const z = lerp(-8, -34, pseudo(i + 4))
    const spread = Math.abs(z) * 0.95
    s.position.set(lerp(-spread, spread, pseudo(i + 8)), lerp(-2.0, -0.2, pseudo(i + 12)), z)
    const scale = lerp(5.5, 13, pseudo(i + 16))
    s.scale.set(scale * 1.8, scale * 0.42, 1)
    s.userData.baseX = s.position.x
    s.userData.baseZ = s.position.z
    s.userData.drift = lerp(0.08, 0.32, pseudo(i + 20))
    s.userData.opacity = mat.opacity
    clouds.add(s)
  }
  group.add(clouds)

  return { group, sky, mountains, clouds, sun }
}

function createPillar(height, material, seed) {
  const group = new THREE.Group()
  const radiusTop = 0.22 + seed * 0.2
  const radiusBottom = 0.42 + seed * 0.42
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 9, 14, false)
  roughenGeometry(geometry, seed)
  const body = new THREE.Mesh(geometry, material)
  group.add(body)

  const crownMat = new THREE.MeshStandardMaterial({ color: 0x142219, roughness: 1 })
  for (let i = 0; i < 5; i++) {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.12 + pseudo(i + seed * 10) * 0.12, 0.5, 6), crownMat)
    crown.position.set(Math.sin(i * 1.7) * radiusBottom * 0.65, height * 0.48 + 0.18, Math.cos(i * 1.7) * radiusBottom * 0.65)
    crown.rotation.x = (pseudo(i + 2) - 0.5) * 0.3
    group.add(crown)
  }
  return group
}

function roughenGeometry(geometry, seed) {
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const n = Math.sin(x * 7.2 + y * 1.3 + seed * 5.1) * 0.08 + Math.cos(z * 8.1 + y * 1.7) * 0.06
    pos.setXYZ(i, x + n, y, z + n * 0.8)
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()
}

function loadStoneGateModel(group, fallbackGate) {
  const draco = new DRACOLoader()
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)
  loader.load(MODEL_URL, (gltf) => {
    group.remove(fallbackGate)
    const model = gltf.scene
    normalizeModel(model, 4.95)
    model.position.set(0, -0.06, 0)
    model.traverse((node) => {
      if (!node.isMesh) return
      node.frustumCulled = false
      node.material = createRockMaterial(node.material)
    })
    group.add(model)
  }, undefined, () => {})
}

function createFallbackGate(group) {
  const portal = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: 0x3d3a31, roughness: 0.96, metalness: 0, transparent: true, opacity: 1 })
  const geo = new THREE.DodecahedronGeometry(0.34, 1)
  const points = []
  for (let i = 0; i < 38; i++) { const a = Math.PI - (i / 37) * Math.PI; points.push([Math.cos(a) * 1.45, Math.sin(a) * 1.3 + 0.75, 0]) }
  for (let i = 0; i < 28; i++) points.push([-1.45, 0.72 - i * 0.12, 0])
  for (let i = 0; i < 28; i++) points.push([1.45, 0.72 - i * 0.12, 0])
  points.forEach(([x, y, z], i) => {
    const mesh = new THREE.Mesh(geo, mat.clone())
    mesh.position.set(x + Math.sin(i * 13.17) * 0.08, y + Math.cos(i * 9.4) * 0.07, z + Math.sin(i * 5.9) * 0.12)
    const s = 0.78 + Math.abs(Math.sin(i * 4.7)) * 0.85
    mesh.scale.set(0.7 * s, 1.1 * s, 0.9 + s * 0.3)
    mesh.rotation.set(i * 0.23, i * 0.41, i * 0.17)
    portal.add(mesh)
  })
  portal.position.y = -0.2
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
  const mat = new THREE.MeshStandardMaterial({ color: 0x4c4535, roughness: 0.96, metalness: 0, transparent: true, opacity: 1 })
  if (source && source.map) mat.map = source.map
  if (source && source.normalMap) mat.normalMap = source.normalMap
  return mat
}

function createLightRig() {
  const rig = new THREE.Group()
  rig.add(new THREE.HemisphereLight(0xffe7c7, 0x090b0a, 0.85))
  const sun = new THREE.DirectionalLight(0xffb067, 5.2); sun.position.set(2.4, 4.2, -8); rig.add(sun)
  const rim = new THREE.DirectionalLight(0xff8e3d, 3.3); rim.position.set(-2.2, 1.4, 2.0); rig.add(rim)
  const fill = new THREE.DirectionalLight(0x6f86a1, 0.32); fill.position.set(3.2, 1.8, 5); rig.add(fill)
  return rig
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

function createCloudTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 160
  const ctx = canvas.getContext('2d')
  const grd = ctx.createRadialGradient(256, 80, 8, 256, 80, 250)
  grd.addColorStop(0, 'rgba(255,255,255,.9)')
  grd.addColorStop(0.35, 'rgba(255,220,170,.55)')
  grd.addColorStop(0.72, 'rgba(255,190,120,.12)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, 512, 160)
  return new THREE.CanvasTexture(canvas)
}

function createRadialTexture(colors) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
  colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 512)
  return new THREE.CanvasTexture(canvas)
}

function pseudo(n) { return Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1 }

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
