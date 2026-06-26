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
    <main class="page-shell">
      <section class="hero" id="hero">
        <video class="hero-video" autoplay muted loop playsinline poster="/media/hidden-world-poster.jpg">
          <source src="/media/hidden-world.mp4" type="video/mp4" />
        </video>
        <div class="fallback-world" aria-hidden="true"></div>
        <canvas id="stonegate-canvas" class="stonegate-canvas"></canvas>
        <div class="hero-noise"></div>
        <div class="hero-grade"></div>
        <header class="nav">
          <a class="brand" href="#hero"><strong>伴山</strong><span>BANSHAN</span></a>
          <nav>
            <a href="#guides">本地向导</a>
            <a href="#ai">AI语音向导</a>
            <a href="#city">城市探索</a>
          </nav>
        </header>
        <div class="hero-copy">
          <p class="eyebrow">ENTER LOCAL WONDER</p>
          <h1>像当地人一样<br/>重新进入一座城市</h1>
          <p>伴山把本地向导、隐藏路线与 AI 语音向导连接在一起，让每一次抵达都变成一场真正的探索。</p>
        </div>
        <div class="scroll-hint"><span></span>SCROLL</div>
      </section>

      <section class="section intro" id="city">
        <p class="section-kicker">CITY EXPERIENCE</p>
        <h2>不是普通旅游入口，而是一段进入城市的视觉仪式。</h2>
        <p>用户先被带入一个世界，再理解伴山提供的本地向导、城市探索、AI 语音陪伴和真实体验。</p>
      </section>

      <section class="section cards" id="guides">
        <article><span>01</span><h3>本地向导</h3><p>用当地人的视角打开城市，不是模板行程。</p></article>
        <article><span>02</span><h3>城市探索</h3><p>从隐藏景点、街区、人文故事里找到真实体验。</p></article>
        <article id="ai"><span>03</span><h3>AI语音向导</h3><p>实时语音陪伴，辅助规划路线、讲解场景、推荐体验。</p></article>
      </section>
    </main>
  `,
  setup() {
    onMounted(() => {
      initSmoothScroll()
      initStoneGate()
      initContentMotion()
    })
  }
}

createApp(App).mount('#app')

function initSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9 })
  function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)
  lenis.on('scroll', ScrollTrigger.update)
}

function initContentMotion() {
  gsap.from('.hero-copy > *', {
    y: 28,
    opacity: 0,
    duration: 1.25,
    stagger: 0.12,
    ease: 'power3.out'
  })

  gsap.utils.toArray('.section').forEach((section) => {
    gsap.from(section.children, {
      y: 42,
      opacity: 0,
      duration: 1,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 72%' }
    })
  })
}

function initStoneGate() {
  const canvas = document.getElementById('stonegate-canvas')
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, 0.3, 7.2)

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08

  const ambient = new THREE.HemisphereLight(0xffead0, 0x22332a, 1.35)
  scene.add(ambient)

  const sunRim = new THREE.DirectionalLight(0xffb15e, 4.4)
  sunRim.position.set(0.2, 2.4, -4.6)
  scene.add(sunRim)

  const sideFill = new THREE.DirectionalLight(0x9ab8ff, 0.55)
  sideFill.position.set(-3, 1.8, 3)
  scene.add(sideFill)

  const gateGroup = new THREE.Group()
  scene.add(gateGroup)

  createFallbackGate(gateGroup)
  loadStoneGateModel(gateGroup)

  const fogPlanes = createFogPlanes()
  scene.add(fogPlanes)

  const state = { p: 0 }
  gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.1
    },
    onUpdate: () => applyHeroProgress(state.p)
  })

  function applyHeroProgress(p) {
    camera.position.z = 7.2 - p * 4.8
    camera.position.y = 0.3 + p * 0.25
    camera.rotation.x = THREE.MathUtils.degToRad(-p * 5)
    gateGroup.position.z = -0.8 + p * 1.8
    gateGroup.scale.setScalar(1 + p * 1.25)
    gateGroup.traverse((item) => {
      if (item.material) item.material.opacity = p > 0.76 ? Math.max(0, 1 - (p - 0.76) / 0.18) : 1
    })
    fogPlanes.position.z = -2 + p * 2.6
    fogPlanes.children.forEach((plane, i) => {
      plane.material.opacity = 0.16 + Math.sin(p * 3 + i) * 0.035
    })
    document.documentElement.style.setProperty('--hero-progress', p.toFixed(3))
  }

  function animate(time) {
    fogPlanes.children.forEach((plane, i) => {
      plane.position.x = Math.sin(time * 0.00018 + i) * 0.22
      plane.position.y = Math.cos(time * 0.00013 + i) * 0.08
    })
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

function loadStoneGateModel(gateGroup) {
  const loader = new GLTFLoader()
  loader.load('/models/stonegate.glb', (gltf) => {
    gateGroup.clear()
    const model = gltf.scene
    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    model.position.sub(center)
    const maxAxis = Math.max(size.x, size.y, size.z)
    model.scale.setScalar(4.2 / maxAxis)
    model.position.y = -0.35
    model.rotation.y = 0
    model.traverse((item) => {
      if (item.isMesh) {
        item.castShadow = false
        item.receiveShadow = false
        item.material = enhanceRockMaterial(item.material)
      }
    })
    gateGroup.add(model)
  }, undefined, () => {})
}

function enhanceRockMaterial(source) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x5b5648,
    roughness: 0.94,
    metalness: 0.0,
    transparent: true,
    opacity: 1
  })
  if (source && source.map) material.map = source.map
  return material
}

function createFallbackGate(group) {
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x5b5648,
    roughness: 0.96,
    metalness: 0,
    transparent: true,
    opacity: 1
  })
  const left = new THREE.Mesh(new THREE.BoxGeometry(1.75, 5.4, 1.05, 16, 32, 8), rockMaterial)
  const right = left.clone()
  const top = new THREE.Mesh(new THREE.BoxGeometry(4.15, 1.1, 1.05, 24, 8, 8), rockMaterial)
  left.position.set(-1.75, 0, -0.6)
  right.position.set(1.75, 0, -0.6)
  top.position.set(0, 2.22, -0.6)
  ;[left, right, top].forEach((mesh) => {
    distortGeometry(mesh.geometry)
    group.add(mesh)
  })
}

function distortGeometry(geometry) {
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const n = Math.sin(x * 7.1 + y * 3.2) * 0.08 + Math.sin(y * 8.7 + z * 4.1) * 0.055
    pos.setXYZ(i, x + n, y + n * 0.45, z + n)
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()
}

function createFogPlanes() {
  const group = new THREE.Group()
  for (let i = 0; i < 8; i++) {
    const geo = new THREE.PlaneGeometry(6.2 + i * 0.4, 1.2 + i * 0.12)
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffd7a0,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(0, -1.8 + i * 0.11, -3.2 - i * 0.08)
    group.add(mesh)
  }
  return group
}
