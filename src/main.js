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
        <div class="world-layer">
          <video id="worldVideo" class="world-video" muted playsinline preload="auto" poster="/media/hidden-world-poster.jpg">
            <source src="/media/hidden-world.mp4" type="video/mp4" />
          </video>
          <div class="world-fallback" aria-hidden="true">
            <span class="sun-core"></span>
            <span class="cloud cloud-a"></span>
            <span class="cloud cloud-b"></span>
            <span class="cloud cloud-c"></span>
            <span class="peak peak-a"></span>
            <span class="peak peak-b"></span>
            <span class="peak peak-c"></span>
            <span class="peak peak-d"></span>
          </div>
        </div>

        <canvas id="stonegate-canvas" class="stonegate-canvas"></canvas>

        <div class="film-grade"></div>
        <div class="film-noise"></div>
        <div class="golden-bloom"></div>

        <header class="top-nav">
          <a class="brand" href="#hero"><strong>伴山</strong><span>BANSHAN</span></a>
          <nav>
            <a href="#local">本地向导</a>
            <a href="#voice">AI语音向导</a>
            <a href="#discover">城市探索</a>
          </nav>
        </header>

        <aside class="chapter-indicator">
          <span class="chapter-line"></span>
          <b id="chapterNumber">01</b>
          <em id="chapterName">GATEWAY</em>
        </aside>

        <div class="hero-copy copy-a">
          <p class="eyebrow">BANSHAN WORLD</p>
          <h1>从一座山门<br/>进入城市的另一面</h1>
          <p>不是把信息堆在首页，而是让用户先进入一个世界，再理解伴山的本地向导、城市探索和 AI 语音向导。</p>
        </div>

        <div class="hero-copy copy-b">
          <p class="eyebrow">THROUGH THE GATE</p>
          <h2>穿过入口，世界才开始出现。</h2>
          <p>石门只作为前景框景，后方张家界云海是完整空间；滚动时不是放大图片，而是相机穿过门洞。</p>
        </div>

        <div class="hero-copy copy-c">
          <p class="eyebrow">HIDDEN WORLD</p>
          <h2>云海之上，留下想象空间。</h2>
          <p>最终镜头平移并逐渐向下俯瞰，让张家界峰林和云海成为伴山官网的第一记忆点。</p>
        </div>

        <div class="floating-card card-local">
          <span>LOCAL GUIDE</span>
          <strong>本地向导</strong>
          <p>真实当地人带路</p>
        </div>
        <div class="floating-card card-ai">
          <span>AI VOICE</span>
          <strong>AI语音向导</strong>
          <p>实时陪伴讲解</p>
        </div>

        <div class="scroll-hint"><i></i><span>SCROLL TO ENTER</span></div>
      </section>

      <section class="content-section intro" id="discover">
        <p class="section-kicker">EXPERIENCE FIRST</p>
        <h2>官网不是功能说明书，而是伴山的第一段体验。</h2>
        <p>首屏用石门和张家界云海建立“进入另一个世界”的品牌记忆；后续模块再承接本地向导、城市体验、AI 语音向导和 App 下载。</p>
      </section>

      <section class="content-section service-grid" id="local">
        <article><span>01</span><h3>本地向导</h3><p>把目的地变成真实的人、路线和故事。</p></article>
        <article id="voice"><span>02</span><h3>AI语音向导</h3><p>进入城市后实时对话、讲解、规划和提醒。</p></article>
        <article><span>03</span><h3>城市探索</h3><p>隐藏地点、文化体验、自然疗愈和本地生活。</p></article>
      </section>
    </main>
  `,
  setup() {
    onMounted(() => {
      initSmoothScroll()
      initHeroSystem()
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

function initContentReveal() {
  gsap.utils.toArray('.content-section').forEach((section) => {
    gsap.from(section.children, {
      y: 50,
      opacity: 0,
      filter: 'blur(18px)',
      duration: 1.2,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 72%' }
    })
  })
}

function initHeroSystem() {
  const canvas = document.getElementById('stonegate-canvas')
  const video = document.getElementById('worldVideo')
  const chapterNumber = document.getElementById('chapterNumber')
  const chapterName = document.getElementById('chapterName')

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 1200)
  camera.position.set(0, 0.16, 7.8)

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08

  const gateGroup = new THREE.Group()
  gateGroup.position.set(0, -0.18, -0.35)
  scene.add(gateGroup)

  createProceduralGate(gateGroup)
  loadStoneGate(gateGroup)

  const mistGroup = createMistPlanes()
  scene.add(mistGroup)

  const lightRig = createLightRig()
  scene.add(lightRig)

  const target = new THREE.Vector3(0, 0.05, -7)
  const clock = new THREE.Clock()
  const state = { p: 0, lastChapter: '' }

  setupVideo(video)

  gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero-sequence',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.35
    },
    onUpdate: () => applyProgress(state.p)
  })

  function applyProgress(p) {
    const eased = smoothstep(0, 1, p)
    const enter = smoothstep(0.06, 0.48, p)
    const exit = smoothstep(0.52, 0.88, p)
    const reveal = smoothstep(0.64, 1, p)

    camera.position.x = lerp(0, 0.22, reveal) + Math.sin(p * Math.PI * 1.5) * 0.025
    camera.position.y = lerp(0.16, 0.44, reveal)
    camera.position.z = lerp(7.8, 2.15, enter)
    camera.fov = lerp(36, 42, reveal)
    camera.rotation.x = THREE.MathUtils.degToRad(lerp(0, -14, reveal))
    camera.updateProjectionMatrix()

    gateGroup.scale.setScalar(lerp(1.0, 2.55, enter))
    gateGroup.position.z = lerp(-0.35, 1.35, enter)
    gateGroup.position.y = lerp(-0.18, -0.08, enter)
    gateGroup.rotation.y = THREE.MathUtils.degToRad(lerp(0, -1.8, p))

    gateGroup.traverse((item) => {
      if (item.material) {
        item.material.opacity = 1 - smoothstep(0.68, 0.84, p)
        item.material.needsUpdate = true
      }
    })

    mistGroup.position.z = lerp(-2.8, 0.7, enter)
    mistGroup.position.y = lerp(-1.25, -0.7, reveal)
    mistGroup.children.forEach((plane, index) => {
      plane.material.opacity = (0.05 + index * 0.012) * (1 - smoothstep(0.82, 1, p))
    })

    const worldScale = lerp(1.08, 1.0, p)
    const worldLift = lerp(0, -5, reveal)
    document.documentElement.style.setProperty('--hero-progress', p.toFixed(3))
    document.documentElement.style.setProperty('--world-scale', worldScale.toFixed(3))
    document.documentElement.style.setProperty('--world-y', `${worldLift.toFixed(2)}vh`)
    document.documentElement.style.setProperty('--world-tilt', `${lerp(0, 8, reveal).toFixed(2)}deg`)

    syncVideo(video, p)
    updateChapters(p, chapterNumber, chapterName, state)
  }

  function animate() {
    const t = clock.getElapsedTime()
    gateGroup.position.x = Math.sin(t * 0.55) * 0.012
    lightRig.children.forEach((light, index) => {
      light.intensity += Math.sin(t * 0.7 + index) * 0.002
    })
    mistGroup.children.forEach((plane, index) => {
      plane.position.x = Math.sin(t * 0.18 + index) * 0.22
      plane.position.y += Math.sin(t * 0.16 + index) * 0.0005
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
  video.pause()
  video.addEventListener('loadedmetadata', () => {
    video.currentTime = 0.01
  }, { once: true })
}

function syncVideo(video, progress) {
  if (!video.duration || Number.isNaN(video.duration)) return
  const targetTime = clamp(progress * video.duration * 0.92, 0.01, Math.max(0.02, video.duration - 0.08))
  if (Math.abs(video.currentTime - targetTime) > 0.07) video.currentTime = targetTime
}

function updateChapters(p, number, name, state) {
  let next = '01|GATEWAY'
  if (p > 0.36) next = '02|PASS THROUGH'
  if (p > 0.66) next = '03|REVEAL'
  if (state.lastChapter === next) return
  state.lastChapter = next
  const [n, label] = next.split('|')
  gsap.to([number, name], {
    y: -8,
    opacity: 0,
    duration: 0.18,
    onComplete: () => {
      number.textContent = n
      name.textContent = label
      gsap.fromTo([number, name], { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, stagger: 0.04 })
    }
  })
}

function createLightRig() {
  const rig = new THREE.Group()
  rig.add(new THREE.HemisphereLight(0xffedd8, 0x0e1815, 1.15))
  const sun = new THREE.DirectionalLight(0xffb66a, 5.2)
  sun.position.set(0.12, 2.6, -4.8)
  rig.add(sun)
  const warmEdgeLeft = new THREE.DirectionalLight(0xff8d42, 2.2)
  warmEdgeLeft.position.set(-2.2, 1.1, -2.6)
  rig.add(warmEdgeLeft)
  const coolFill = new THREE.DirectionalLight(0x7c9cc4, 0.55)
  coolFill.position.set(2.5, 1.6, 3.6)
  rig.add(coolFill)
  return rig
}

function loadStoneGate(gateGroup) {
  const loader = new GLTFLoader()
  loader.load('/models/stonegate.glb', (gltf) => {
    gateGroup.clear()
    const model = gltf.scene
    normalizeModel(model, 4.75)
    model.position.set(0, -0.24, 0)
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
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  model.position.sub(center)
  const maxAxis = Math.max(size.x, size.y, size.z)
  model.scale.setScalar(targetSize / maxAxis)
}

function createRockMaterial(source) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x5d5747,
    roughness: 0.98,
    metalness: 0,
    transparent: true,
    opacity: 1
  })
  if (source && source.map) mat.map = source.map
  return mat
}

function createProceduralGate(group) {
  const material = createRockMaterial()
  const parts = [
    { size: [1.28, 4.85, 1.08], pos: [-1.58, -0.15, 0] },
    { size: [1.28, 4.85, 1.08], pos: [1.58, -0.15, 0] },
    { size: [3.86, 1.08, 1.08], pos: [0, 2.06, 0] }
  ]
  parts.forEach((part) => {
    const geometry = new THREE.BoxGeometry(...part.size, 22, 34, 10)
    roughen(geometry)
    const mesh = new THREE.Mesh(geometry, material.clone())
    mesh.position.set(...part.pos)
    group.add(mesh)
  })
}

function roughen(geometry) {
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const ridge = Math.sin(x * 10.4 + y * 4.8) * 0.075 + Math.sin(y * 12.2 + z * 5.4) * 0.055
    pos.setXYZ(i, x + ridge * 0.7, y + ridge * 0.18, z + ridge)
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()
}

function createMistPlanes() {
  const group = new THREE.Group()
  for (let i = 0; i < 10; i++) {
    const geo = new THREE.PlaneGeometry(6.8 + i * 0.35, 1.15 + i * 0.11)
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffc58a,
      transparent: true,
      opacity: 0.06 + i * 0.012,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(0, -1.46 + i * 0.08, -3.2 - i * 0.1)
    mesh.rotation.z = (i % 2 ? 1 : -1) * 0.025
    group.add(mesh)
  }
  return group
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return x * x * (3 - 2 * x)
}
