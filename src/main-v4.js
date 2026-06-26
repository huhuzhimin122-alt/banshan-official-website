import { createApp, onMounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './styles-v4.css'

gsap.registerPlugin(ScrollTrigger)

const MODEL_URL = 'models/stonegate_web_light_draco.glb'
const VIDEO_URL = 'media/portal-world.mp4'

const App = {
  template: `
    <main class="site-shell">
      <section class="hero-sequence" id="hero">
        <canvas id="portalScene" class="portal-scene"></canvas>
        <div class="hero-gradient"></div>
        <div class="hero-noise"></div>

        <header class="top-nav">
          <a class="brand"><strong>伴山</strong><span>BANSHAN</span></a>
          <nav><a href="#local">本地向导</a><a href="#voice">AI语音向导</a><a href="#discover">城市探索</a></nav>
        </header>

        <div class="hero-copy hero-copy-1"><p>BANSHAN PORTAL</p><h1>穿过山门<br/>进入城市的另一面</h1><span>石门是入口，门后的张家界云海在 Three.js 场景里被真正揭示。</span></div>
        <div class="hero-copy hero-copy-2"><p>CAMERA FLY THROUGH</p><h2>镜头穿过门洞。</h2><span>滚轮驱动 Camera 前进，不再靠移动模型假装穿门。</span></div>
        <div class="hero-copy hero-copy-3"><p>HIDDEN WORLD</p><h2>进入云海世界。</h2><span>穿过石门后，相机继续前进并轻微俯看张家界风景。</span></div>

        <aside class="chapter"><i></i><b id="chapterNumber">01</b><em id="chapterName">GATEWAY</em></aside>
        <div class="scroll-hint"><i></i><span>SCROLL TO ENTER</span></div>
      </section>

      <section class="content-section layered-copy" id="discover">
        <div class="copy-stage">
          <p class="section-kicker">EXPERIENCE FIRST</p>
          <div class="copy-step"><h2>官网不是功能说明书，而是伴山的第一段体验。</h2><p>首屏先建立进入另一个世界的感受。</p></div>
          <div class="copy-step"><h2>先让用户产生探索欲，再承接业务功能。</h2><p>本地向导、AI 语音向导和城市探索成为下一步。</p></div>
          <div class="copy-step"><h2>每一次滚动，都像镜头继续向前。</h2><p>文字、卡片、图片和遮罩跟随滚动分层变化。</p></div>
        </div>
      </section>

      <section class="content-section parallax-feature">
        <div class="mask-image"></div>
        <div class="feature-copy"><p class="section-kicker">LOCAL GUIDE</p><h2>把目的地变成真实的人、路线和故事。</h2><p>伴山连接本地向导、城市体验者和抵达城市的人。</p></div>
      </section>

      <section class="drag-section" id="local">
        <div class="drag-head"><p class="section-kicker">DRAG TO NAVIGATE</p><h2>城市体验不是列表，而是一组可以横向探索的场景。</h2></div>
        <div class="drag-viewport" id="dragViewport"><div class="drag-track" id="dragTrack">
          <article><span>01</span><h3>山野疗愈</h3><p>清晨、云海、山路和本地向导。</p></article>
          <article><span>02</span><h3>城市漫游</h3><p>从街区、咖啡馆、老店和故事开始。</p></article>
          <article id="voice"><span>03</span><h3>AI语音向导</h3><p>实时对话，边走边听，边问边发现。</p></article>
          <article><span>04</span><h3>商务陪同</h3><p>陌生城市里的高效接待和路线协助。</p></article>
        </div></div>
      </section>
    </main>
  `,
  setup(){ onMounted(() => { initLenis(); initPortalHero(); initSections(); initDrag() }) }
}

createApp(App).mount('#app')

function initLenis(){
  const lenis = new Lenis({ lerp:.07, wheelMultiplier:.82, smoothWheel:true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

function initPortalHero(){
  const canvas = document.getElementById('portalScene')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.04
  renderer.autoClear = false

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 300)
  camera.position.set(0, 0.15, 8.2)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x050505)
  scene.fog = new THREE.FogExp2(0x0b0b0a, 0.016)

  const video = document.createElement('video')
  video.src = VIDEO_URL
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.crossOrigin = 'anonymous'
  video.playbackRate = 0.55
  video.addEventListener('loadedmetadata', () => { video.currentTime = 0.01; video.play().catch(()=>{}) }, { once:true })
  video.play().catch(()=>{})

  const videoTexture = new THREE.VideoTexture(video)
  videoTexture.colorSpace = THREE.SRGBColorSpace
  videoTexture.minFilter = THREE.LinearFilter
  videoTexture.magFilter = THREE.LinearFilter

  const portal = new THREE.Group()
  portal.position.set(0, -0.05, 0)
  scene.add(portal)

  const world = createHiddenWorld(videoTexture)
  world.position.set(0, -0.15, -9.4)
  scene.add(world)

  const gate = new THREE.Group()
  gate.position.set(0, -0.42, 0)
  portal.add(gate)
  const fallback = createFallbackGate(gate)
  loadGate(gate, fallback)

  const occluders = createSideOccluders()
  portal.add(occluders)

  const portalLight = createPortalLight(videoTexture)
  portal.add(portalLight)

  const mist = createPortalMist()
  scene.add(mist)

  const lights = createLights()
  scene.add(lights)

  const target = new THREE.Vector3(0, 0.08, -8)
  const state = { p:0, chapter:'' }
  const clock = new THREE.Clock()

  gsap.to(state, {
    p:1,
    ease:'none',
    scrollTrigger:{ trigger:'.hero-sequence', start:'top top', end:'bottom bottom', scrub:1.08 },
    onUpdate:() => applyProgress(state.p)
  })

  function applyProgress(p){
    const approach = smoothstep(0.02, 0.40, p)
    const enter = smoothstep(0.36, 0.62, p)
    const reveal = smoothstep(0.58, 1, p)

    camera.position.z = lerp(8.2, -7.2, p)
    camera.position.x = lerp(0, 1.25, reveal)
    camera.position.y = lerp(0.15, 2.4, reveal)
    target.x = lerp(0, 1.0, reveal)
    target.y = lerp(0.08, -0.85, reveal)
    target.z = lerp(-8, -24, reveal)
    camera.fov = lerp(38, 51, reveal)
    camera.updateProjectionMatrix()

    portal.position.z = lerp(0, 0.6, approach)
    portal.scale.setScalar(lerp(1.0, 1.18, approach))
    gate.traverse(n => { if(n.material){ n.material.opacity = 1 - smoothstep(0.54, 0.76, p); n.material.needsUpdate = true } })
    occluders.children.forEach((m, i) => {
      m.position.x = (i === 0 ? -1 : 1) * lerp(1.55, 4.5, enter)
      m.material.opacity = 0.96 * (1 - smoothstep(0.52, 0.72, p))
    })
    portalLight.material.opacity = lerp(0.28, 0.82, approach) * (1 - smoothstep(0.62, 0.82, p))

    world.position.z = lerp(-9.4, -4.2, approach)
    world.position.y = lerp(-0.15, -1.6, reveal)
    world.rotation.x = THREE.MathUtils.degToRad(lerp(0, 5.2, reveal))
    world.scale.setScalar(lerp(1.0, 1.28, reveal))

    mist.children.forEach((m, i) => {
      m.position.z = lerp(-1.2 - i * .4, 3.0 - i * .18, approach)
      m.material.opacity = m.userData.baseOpacity * (1 - smoothstep(0.60, 0.86, p))
    })

    if(video.duration){
      const t = clamp((0.04 + p * 0.72) * video.duration, 0.01, video.duration - 0.08)
      if(Math.abs(video.currentTime - t) > 0.13) video.currentTime = t
    }

    document.documentElement.style.setProperty('--hero-progress', p.toFixed(3))
    updateChapter(p, state)
  }

  function animate(){
    const t = clock.getElapsedTime()
    world.userData.clouds.children.forEach((c, i) => {
      c.position.x = c.userData.x + Math.sin(t * 0.16 + i) * c.userData.drift
    })
    portal.rotation.z = Math.sin(t * 0.24) * 0.0012
    camera.lookAt(target)
    renderer.clear()
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }
  animate()

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

function createHiddenWorld(videoTexture){
  const group = new THREE.Group()

  const videoMat = new THREE.MeshBasicMaterial({ map:videoTexture, side:THREE.DoubleSide, toneMapped:false })
  const videoPlane = new THREE.Mesh(new THREE.PlaneGeometry(34, 19.2), videoMat)
  videoPlane.position.set(0, 2.0, -24)
  group.add(videoPlane)

  const clouds = new THREE.Group()
  const cloudTex = makeCloudTexture()
  for(let i=0;i<34;i++){
    const mat = new THREE.SpriteMaterial({ map:cloudTex, color:0xffd4a0, transparent:true, opacity:0.12 + rand(i) * 0.18, depthWrite:false, blending:THREE.AdditiveBlending })
    const s = new THREE.Sprite(mat)
    const z = lerp(-5, -22, rand(i+2))
    const spread = Math.abs(z) * 0.78
    s.position.set(lerp(-spread, spread, rand(i+4)), lerp(-1.4, 0.25, rand(i+6)), z)
    const size = lerp(3.8, 8.8, rand(i+8))
    s.scale.set(size * 2.0, size * 0.35, 1)
    s.userData.x = s.position.x
    s.userData.drift = lerp(0.05, 0.22, rand(i+10))
    clouds.add(s)
  }
  group.add(clouds)
  group.userData.clouds = clouds

  const depth = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 24),
    new THREE.MeshBasicMaterial({ color:0xffb25c, transparent:true, opacity:0.06, depthWrite:false, blending:THREE.AdditiveBlending })
  )
  depth.position.set(0, 2.0, -18)
  group.add(depth)
  return group
}

function createPortalLight(videoTexture){
  const mat = new THREE.MeshBasicMaterial({ map:videoTexture, transparent:true, opacity:.38, depthWrite:false, toneMapped:false })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 3.15), mat)
  mesh.position.set(0.05, 0.25, -0.45)
  return mesh
}

function createSideOccluders(){
  const g = new THREE.Group()
  const mat = new THREE.MeshBasicMaterial({ color:0x050505, transparent:true, opacity:.96, depthWrite:false })
  const left = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 8), mat.clone())
  const right = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 8), mat.clone())
  left.position.set(-1.55, 0, -0.5)
  right.position.set(1.55, 0, -0.5)
  g.add(left, right)
  return g
}

function loadGate(group, fallback){
  const draco = new DRACOLoader()
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)
  loader.load(MODEL_URL, gltf => {
    group.remove(fallback)
    const model = gltf.scene
    normalize(model, 5.45)
    model.position.set(0, 0, 0)
    model.traverse(n => { if(n.isMesh){ n.frustumCulled = false; n.material = rockMaterial(n.material) } })
    group.add(model)
  })
}

function createFallbackGate(group){
  const g = new THREE.Group()
  const mat = rockMaterial()
  ;[[.72,3.6,.85,-1.25,0,0],[.72,3.6,.85,1.25,0,0],[3.1,.66,.85,0,1.55,0]].forEach(a => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(a[0],a[1],a[2],8,18,4), mat.clone())
    m.position.set(a[3],a[4],a[5])
    g.add(m)
  })
  group.add(g)
  return g
}

function createPortalMist(){
  const group = new THREE.Group()
  const tex = makeCloudTexture()
  for(let i=0;i<10;i++){
    const mat = new THREE.SpriteMaterial({ map:tex, color:0xffb56b, transparent:true, opacity:0.055 + i * .005, depthWrite:false, blending:THREE.AdditiveBlending })
    const s = new THREE.Sprite(mat)
    s.position.set(lerp(-1.4,1.4,rand(i)), lerp(-1.15,.35,rand(i+2)), -1.2 - i * .4)
    s.scale.set(lerp(2.4,4.6,rand(i+3)), lerp(.5,1.0,rand(i+5)), 1)
    s.userData.baseOpacity = mat.opacity
    group.add(s)
  }
  return group
}

function createLights(){
  const g = new THREE.Group()
  g.add(new THREE.HemisphereLight(0xffe9cb, 0x050505, .72))
  const key = new THREE.DirectionalLight(0xffb873, 6.2); key.position.set(1.6,3.4,-4.4); g.add(key)
  const rim = new THREE.DirectionalLight(0xff8e3e, 4.4); rim.position.set(-2.6,1.6,2.6); g.add(rim)
  return g
}

function rockMaterial(source){
  const mat = new THREE.MeshStandardMaterial({ color:0x6a5337, roughness:.92, metalness:0, transparent:true, opacity:1 })
  if(source?.map) mat.map = source.map
  if(source?.normalMap) mat.normalMap = source.normalMap
  return mat
}

function normalize(model, target){
  const box = new THREE.Box3().setFromObject(model), size = new THREE.Vector3(), center = new THREE.Vector3()
  box.getSize(size); box.getCenter(center)
  model.position.sub(center)
  model.scale.setScalar(target / Math.max(size.x, size.y, size.z))
}

function makeCloudTexture(){
  const c = document.createElement('canvas')
  c.width = 512; c.height = 180
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(256,90,6,256,90,260)
  g.addColorStop(0,'rgba(255,255,255,.9)')
  g.addColorStop(.35,'rgba(255,220,170,.45)')
  g.addColorStop(.78,'rgba(255,180,100,.08)')
  g.addColorStop(1,'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0,0,512,180)
  return new THREE.CanvasTexture(c)
}

function updateChapter(p, state){
  let next = '01|GATEWAY'
  if(p > .36) next = '02|ENTER'
  if(p > .66) next = '03|WORLD'
  if(state.chapter === next) return
  state.chapter = next
  const [n, l] = next.split('|')
  document.getElementById('chapterNumber').textContent = n
  document.getElementById('chapterName').textContent = l
}

function initSections(){
  const steps = gsap.utils.toArray('.copy-step')
  gsap.set(steps.slice(1), { opacity:0, y:34, filter:'blur(18px)' })
  const tl = gsap.timeline({ scrollTrigger:{ trigger:'.layered-copy', start:'top top', end:'+=220%', scrub:1, pin:true } })
  steps.forEach((s, i) => { if(!i) return; tl.to(steps[i-1], { opacity:0, y:-34, filter:'blur(18px)' }, i-.15).to(s, { opacity:1, y:0, filter:'blur(0px)' }, i) })
}

function initDrag(){
  const v = document.getElementById('dragViewport'), t = document.getElementById('dragTrack')
  if(!v || !t) return
  let down=false, start=0, base=0, x=0, target=0, max=0
  const measure = () => max = Math.max(0, t.scrollWidth - v.clientWidth)
  const tick = () => { x += (target - x) * .12; t.style.transform = `translate3d(${x}px,0,0)`; requestAnimationFrame(tick) }
  measure(); tick(); addEventListener('resize', measure)
  v.onpointerdown = e => { down=true; start=e.clientX; base=target; v.setPointerCapture(e.pointerId) }
  v.onpointermove = e => { if(down) target = clamp(base + e.clientX - start, -max, 0) }
  v.onpointerup = () => down=false
}

function rand(n){ return Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1 }
function lerp(a,b,t){ return a + (b-a)*t }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)) }
function smoothstep(a,b,v){ const x = clamp((v-a)/(b-a),0,1); return x*x*(3-2*x) }
