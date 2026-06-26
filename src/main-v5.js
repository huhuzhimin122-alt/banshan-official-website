import { createApp, onMounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './styles-v5.css'

gsap.registerPlugin(ScrollTrigger)

const MODEL_URL = 'models/stonegate_web_light_draco.glb'
const VIDEO_URL = 'media/portal-world.mp4'

const App = {
  template: `
    <main class="site-shell">
      <section class="hero-sequence" id="hero">
        <canvas id="heroScene" class="hero-scene"></canvas>
        <div class="hero-grade"></div>
        <div class="hero-noise"></div>

        <header class="top-nav">
          <a class="brand"><strong>伴山</strong><span>BANSHAN</span></a>
          <nav><a href="#local">本地向导</a><a href="#voice">AI语音向导</a><a href="#discover">城市探索</a></nav>
        </header>

        <div class="hero-copy copy-1"><p>BANSHAN PORTAL</p><h1>穿过山门<br/>进入城市的另一面</h1><span>石门是前景入口，张家界影像世界始终在同一个 Three.js 场景里。</span></div>
        <div class="hero-copy copy-2"><p>CAMERA FLY THROUGH</p><h2>镜头穿过门洞。</h2><span>滚轮驱动相机向前，不再出现矩形视频框。</span></div>
        <div class="hero-copy copy-3"><p>HIDDEN WORLD</p><h2>云海世界展开。</h2><span>穿过石门后，相机继续推进并轻微俯看风景。</span></div>

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
  setup(){ onMounted(() => { initLenis(); initHero(); initSections(); initDrag() }) }
}

createApp(App).mount('#app')

function initLenis(){
  const lenis = new Lenis({ lerp:.07, wheelMultiplier:.82, smoothWheel:true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

function initHero(){
  const canvas = document.getElementById('heroScene')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x050505)

  const camera = new THREE.PerspectiveCamera(39, window.innerWidth / window.innerHeight, 0.1, 500)
  camera.position.set(0, 0.22, 8.5)

  const video = createVideo()
  const videoTexture = new THREE.VideoTexture(video)
  videoTexture.colorSpace = THREE.SRGBColorSpace
  videoTexture.minFilter = THREE.LinearFilter
  videoTexture.magFilter = THREE.LinearFilter

  const world = createSeamlessWorld(videoTexture)
  scene.add(world)

  const gateRig = new THREE.Group()
  gateRig.position.set(0, -0.30, 0)
  scene.add(gateRig)
  const fallback = createFallbackGate(gateRig)
  loadGate(gateRig, fallback)

  const mist = createSoftMist()
  scene.add(mist)
  scene.add(createLights())

  const state = { p:0, chapter:'' }
  const target = new THREE.Vector3(0, 0.05, -10)
  const clock = new THREE.Clock()

  gsap.to(state, {
    p:1,
    ease:'none',
    scrollTrigger:{ trigger:'.hero-sequence', start:'top top', end:'bottom bottom', scrub:1.05 },
    onUpdate:() => apply(state.p)
  })

  function apply(p){
    const pass = smoothstep(0.20, 0.54, p)
    const reveal = smoothstep(0.52, 1, p)

    camera.position.z = lerp(8.5, -18.0, p)
    camera.position.x = lerp(0, 1.7, reveal)
    camera.position.y = lerp(0.22, 3.1, reveal)
    target.x = lerp(0, 1.35, reveal)
    target.y = lerp(0.05, -1.45, reveal)
    target.z = lerp(-10, -48, reveal)
    camera.fov = lerp(39, 53, reveal)
    camera.updateProjectionMatrix()

    gateRig.scale.setScalar(lerp(1.22, 1.58, pass))
    gateRig.position.x = lerp(0, -0.78, pass)
    gateRig.position.z = 0
    gateRig.rotation.y = THREE.MathUtils.degToRad(lerp(0, -13, pass))
    gateRig.traverse(n => {
      if(n.material){
        n.material.opacity = 1 - smoothstep(0.48, 0.70, p)
        n.material.needsUpdate = true
      }
    })

    world.position.z = lerp(-34, -26, reveal)
    world.position.y = lerp(1.15, -1.55, reveal)
    world.rotation.x = THREE.MathUtils.degToRad(lerp(0, 4.5, reveal))
    world.scale.setScalar(lerp(1.0, 1.16, reveal))

    mist.children.forEach((m, i) => {
      m.position.z = lerp(-2.0 - i * .35, 6.2 - i * .15, pass)
      m.material.opacity = m.userData.baseOpacity * (1 - smoothstep(0.50, 0.76, p))
    })

    if(video.duration){
      const t = clamp((0.03 + p * 0.68) * video.duration, 0.01, video.duration - 0.08)
      if(Math.abs(video.currentTime - t) > 0.14) video.currentTime = t
    }

    document.documentElement.style.setProperty('--hero-progress', p.toFixed(3))
    updateChapter(p, state)
  }

  function animate(){
    const t = clock.getElapsedTime()
    world.userData.clouds.children.forEach((s, i) => {
      s.position.x = s.userData.x + Math.sin(t * 0.14 + i) * s.userData.drift
    })
    gateRig.rotation.z = Math.sin(t * .22) * .0012
    camera.lookAt(target)
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

function createVideo(){
  const video = document.createElement('video')
  video.src = VIDEO_URL
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.crossOrigin = 'anonymous'
  video.playbackRate = .58
  video.addEventListener('loadedmetadata', () => { video.currentTime = .01; video.play().catch(()=>{}) }, { once:true })
  video.play().catch(()=>{})
  return video
}

function createSeamlessWorld(videoTexture){
  const group = new THREE.Group()
  group.position.set(0, 1.15, -34)

  const mat = new THREE.MeshBasicMaterial({ map:videoTexture, side:THREE.DoubleSide, toneMapped:false })
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(96, 54), mat)
  plane.position.set(0, 0, -36)
  group.add(plane)

  const sideL = new THREE.Mesh(new THREE.PlaneGeometry(30, 54), mat.clone())
  sideL.position.set(-48, 0, -34)
  sideL.rotation.y = THREE.MathUtils.degToRad(10)
  group.add(sideL)

  const sideR = new THREE.Mesh(new THREE.PlaneGeometry(30, 54), mat.clone())
  sideR.position.set(48, 0, -34)
  sideR.rotation.y = THREE.MathUtils.degToRad(-10)
  group.add(sideR)

  const clouds = new THREE.Group()
  const cloudTex = makeCloudTexture()
  for(let i=0;i<42;i++){
    const smat = new THREE.SpriteMaterial({ map:cloudTex, color:0xffd6ad, transparent:true, opacity:0.055 + rand(i) * 0.105, depthWrite:false, blending:THREE.AdditiveBlending })
    const s = new THREE.Sprite(smat)
    const z = lerp(-8, -44, rand(i+2))
    const spread = Math.abs(z) * 0.95
    s.position.set(lerp(-spread, spread, rand(i+4)), lerp(-5.2, -1.2, rand(i+6)), z)
    const size = lerp(5.0, 13.5, rand(i+8))
    s.scale.set(size * 2.1, size * .34, 1)
    s.userData.x = s.position.x
    s.userData.drift = lerp(.05, .32, rand(i+11))
    clouds.add(s)
  }
  group.add(clouds)
  group.userData.clouds = clouds

  return group
}

function loadGate(group, fallback){
  const draco = new DRACOLoader()
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)
  loader.load(MODEL_URL, gltf => {
    group.remove(fallback)
    const model = gltf.scene
    normalize(model, 6.15)
    model.position.set(0, 0, 0)
    model.traverse(n => { if(n.isMesh){ n.frustumCulled = false; n.material = rockMaterial(n.material) } })
    group.add(model)
  })
}

function createFallbackGate(group){
  const g = new THREE.Group(), mat = rockMaterial()
  ;[[.72,3.6,.85,-1.25,0,0],[.72,3.6,.85,1.25,0,0],[3.1,.66,.85,0,1.55,0]].forEach(a => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(a[0],a[1],a[2]), mat.clone())
    m.position.set(a[3],a[4],a[5]); g.add(m)
  })
  group.add(g)
  return g
}

function createSoftMist(){
  const group = new THREE.Group()
  const tex = makeCloudTexture()
  for(let i=0;i<12;i++){
    const mat = new THREE.SpriteMaterial({ map:tex, color:0xffbb7a, transparent:true, opacity:.035 + i*.004, depthWrite:false, blending:THREE.AdditiveBlending })
    const s = new THREE.Sprite(mat)
    s.position.set(lerp(-1.7,1.7,rand(i)), lerp(-1.45,.10,rand(i+2)), -2 - i*.35)
    s.scale.set(lerp(2.6,5.2,rand(i+3)), lerp(.45,1.1,rand(i+5)), 1)
    s.userData.baseOpacity = mat.opacity
    group.add(s)
  }
  return group
}

function createLights(){
  const g = new THREE.Group()
  g.add(new THREE.HemisphereLight(0xffe5c0, 0x050505, .92))
  const key = new THREE.DirectionalLight(0xffb36c, 7.4); key.position.set(1.4, 3.6, -5.2); g.add(key)
  const rim = new THREE.DirectionalLight(0xff8f42, 5.2); rim.position.set(-2.7, 1.7, 3.2); g.add(rim)
  const fill = new THREE.DirectionalLight(0x8fb6d8, .45); fill.position.set(2.2, 1.5, 3.0); g.add(fill)
  return g
}

function rockMaterial(source){
  const mat = new THREE.MeshStandardMaterial({ color:0x76583a, roughness:.90, metalness:0, transparent:true, opacity:1 })
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
  const g = ctx.createRadialGradient(256,90,8,256,90,260)
  g.addColorStop(0,'rgba(255,255,255,.90)')
  g.addColorStop(.34,'rgba(255,222,178,.38)')
  g.addColorStop(.78,'rgba(255,180,105,.06)')
  g.addColorStop(1,'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0,0,512,180)
  return new THREE.CanvasTexture(c)
}

function updateChapter(p, state){
  let next = '01|GATEWAY'
  if(p > .32) next = '02|ENTER'
  if(p > .62) next = '03|WORLD'
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
