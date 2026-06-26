import { createApp, onMounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './styles-v6.css'

gsap.registerPlugin(ScrollTrigger)

const MODEL_URL = 'models/stonegate_web_light_draco.glb'
const VIDEO_URL = 'media/portal-world.mp4'

const App = {
  template: `
    <main class="site-shell">
      <section class="hero-sequence" id="hero">
        <canvas id="heroCanvas" class="hero-canvas"></canvas>
        <header class="top-nav">
          <a class="brand"><strong>伴山</strong><span>BANSHAN</span></a>
          <nav><a href="#local">本地向导</a><a href="#voice">AI语音向导</a><a href="#discover">城市探索</a></nav>
        </header>
        <div class="hero-copy copy-a"><p>BANSHAN PORTAL</p><h1>穿过山门<br/>进入城市的另一面</h1><span>视频只锁在门洞里，不再漏到石门外面。</span></div>
        <div class="hero-copy copy-b"><p>CAMERA FLY THROUGH</p><h2>镜头穿过门洞。</h2><span>滚动驱动相机前进，石门从两侧掠过。</span></div>
        <div class="hero-copy copy-c"><p>HIDDEN WORLD</p><h2>进入云海世界。</h2><span>穿过之后，门洞世界再扩展为完整画面。</span></div>
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
  setup(){ onMounted(() => { initSmoothScroll(); initHero(); initSections(); initDrag() }) }
}

createApp(App).mount('#app')

function initSmoothScroll(){
  const lenis = new Lenis({ lerp:.075, wheelMultiplier:.82, smoothWheel:true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

function initHero(){
  const canvas = document.getElementById('heroCanvas')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.92

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x050505)

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 200)
  camera.position.set(0, 0.12, 7.8)

  const video = document.createElement('video')
  video.src = VIDEO_URL
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.crossOrigin = 'anonymous'
  video.playbackRate = .55
  video.addEventListener('loadedmetadata', () => { video.currentTime = .01; video.play().catch(()=>{}) }, { once:true })
  video.play().catch(()=>{})

  const videoTexture = new THREE.VideoTexture(video)
  videoTexture.colorSpace = THREE.SRGBColorSpace
  videoTexture.minFilter = THREE.LinearFilter
  videoTexture.magFilter = THREE.LinearFilter

  const portalMat = createPortalMaterial(videoTexture)
  const portalPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 4.75), portalMat)
  portalPlane.position.set(0.02, 0.02, -0.92)
  scene.add(portalPlane)

  const gate = new THREE.Group()
  gate.position.set(0, -0.38, 0)
  scene.add(gate)
  loadGate(gate)

  scene.add(createSimpleLights())

  const state = { p:0, chapter:'' }
  const target = new THREE.Vector3(0, 0, -4)

  gsap.to(state, {
    p:1,
    ease:'none',
    scrollTrigger:{ trigger:'.hero-sequence', start:'top top', end:'bottom bottom', scrub:1.05 },
    onUpdate:() => apply(state.p)
  })

  function apply(p){
    const pass = smoothstep(.20, .56, p)
    const reveal = smoothstep(.66, 1, p)

    camera.position.z = lerp(7.8, -8.8, p)
    camera.position.x = lerp(0, .85, reveal)
    camera.position.y = lerp(.12, 2.25, reveal)
    target.x = lerp(0, .55, reveal)
    target.y = lerp(0, -1.05, reveal)
    target.z = lerp(-4, -20, reveal)
    camera.fov = lerp(38, 51, reveal)
    camera.updateProjectionMatrix()

    gate.scale.setScalar(lerp(1.08, 1.46, pass))
    gate.position.x = lerp(0, -0.75, pass)
    gate.rotation.y = THREE.MathUtils.degToRad(lerp(0, -12, pass))
    gate.traverse(n => {
      if(n.material){
        n.material.opacity = 1 - smoothstep(.54, .76, p)
        n.material.needsUpdate = true
      }
    })

    portalPlane.position.z = lerp(-0.92, -18, reveal)
    portalPlane.position.y = lerp(0.02, -1.15, reveal)
    portalPlane.scale.setScalar(lerp(1, 8.0, reveal))
    portalMat.uniforms.uReveal.value = reveal
    portalMat.uniforms.uDark.value = lerp(.64, 1.0, reveal)

    if(video.duration){
      const t = clamp((.035 + p * .70) * video.duration, .01, video.duration - .08)
      if(Math.abs(video.currentTime - t) > .14) video.currentTime = t
    }

    document.documentElement.style.setProperty('--hero-progress', p.toFixed(3))
    updateChapter(p, state)
  }

  function animate(){
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

function createPortalMaterial(texture){
  return new THREE.ShaderMaterial({
    transparent:true,
    depthWrite:false,
    side:THREE.DoubleSide,
    uniforms:{ uMap:{ value:texture }, uReveal:{ value:0 }, uDark:{ value:.64 } },
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`
      uniform sampler2D uMap;
      uniform float uReveal;
      uniform float uDark;
      varying vec2 vUv;
      float archMask(vec2 p){
        float rect = 1.0 - smoothstep(0.0,0.018,max(abs(p.x)-0.30, abs(p.y+0.08)-0.36));
        float arch = 1.0 - smoothstep(0.0,0.018,length((p-vec2(0.0,0.24))/vec2(0.30,0.24))-1.0);
        float m = max(rect, arch);
        float feather = smoothstep(0.0,0.26,0.5-abs(p.x)) * smoothstep(0.0,0.22,0.50-abs(p.y));
        return m * feather;
      }
      void main(){
        vec2 p = vUv - vec2(0.5);
        vec4 color = texture2D(uMap, vUv);
        color.rgb *= uDark;
        float m = mix(archMask(p), 1.0, smoothstep(0.15,1.0,uReveal));
        gl_FragColor = vec4(color.rgb, m);
      }
    `
  })
}

function loadGate(group){
  const draco = new DRACOLoader()
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)
  loader.load(MODEL_URL, gltf => {
    const model = gltf.scene
    normalize(model, 6.05)
    model.position.set(0, 0, 0)
    model.traverse(n => { if(n.isMesh){ n.frustumCulled = false; n.material = rockMaterial(n.material) } })
    group.add(model)
  })
}

function createSimpleLights(){
  const g = new THREE.Group()
  g.add(new THREE.HemisphereLight(0xffdfbe, 0x050505, .75))
  const key = new THREE.DirectionalLight(0xffb16b, 4.2)
  key.position.set(1.8, 3.5, 2.2)
  g.add(key)
  const fill = new THREE.DirectionalLight(0x8598a4, .35)
  fill.position.set(-2.0, 1.4, 3.0)
  g.add(fill)
  return g
}

function rockMaterial(source){
  const mat = new THREE.MeshStandardMaterial({ color:0x6f5339, roughness:.92, metalness:0, transparent:true, opacity:1 })
  if(source?.map) mat.map = source.map
  if(source?.normalMap) mat.normalMap = source.normalMap
  return mat
}

function normalize(model, target){
  const box = new THREE.Box3().setFromObject(model)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  model.position.sub(center)
  model.scale.setScalar(target / Math.max(size.x, size.y, size.z))
}

function updateChapter(p, state){
  let next = '01|GATEWAY'
  if(p > .34) next = '02|ENTER'
  if(p > .64) next = '03|WORLD'
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
  steps.forEach((s, i) => {
    if(!i) return
    tl.to(steps[i-1], { opacity:0, y:-34, filter:'blur(18px)' }, i-.15).to(s, { opacity:1, y:0, filter:'blur(0px)' }, i)
  })
}

function initDrag(){
  const v = document.getElementById('dragViewport')
  const t = document.getElementById('dragTrack')
  if(!v || !t) return
  let down=false, start=0, base=0, x=0, target=0, max=0
  const measure = () => max = Math.max(0, t.scrollWidth - v.clientWidth)
  const tick = () => { x += (target - x) * .12; t.style.transform = `translate3d(${x}px,0,0)`; requestAnimationFrame(tick) }
  measure(); tick(); addEventListener('resize', measure)
  v.onpointerdown = e => { down=true; start=e.clientX; base=target; v.setPointerCapture(e.pointerId) }
  v.onpointermove = e => { if(down) target = clamp(base + e.clientX - start, -max, 0) }
  v.onpointerup = () => down=false
}

function lerp(a,b,t){ return a + (b-a)*t }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)) }
function smoothstep(a,b,v){ const x = clamp((v-a)/(b-a),0,1); return x*x*(3-2*x) }
