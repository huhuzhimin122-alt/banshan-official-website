import { createApp, onMounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './styles-v3.css'

gsap.registerPlugin(ScrollTrigger)

const App = {
  template: `
    <main class="site-shell">
      <section class="hero-sequence" id="hero">
        <video id="heroVideo" class="hero-video" src="media/portal-world.mp4" muted playsinline loop preload="auto" crossorigin="anonymous"></video>
        <div class="hero-shade"></div>
        <canvas id="heroCanvas" class="hero-canvas"></canvas>
        <div class="hero-glow"><i></i><i></i><i></i></div>
        <div class="cinema-grade"></div>
        <div class="film-noise"></div>

        <header class="top-nav">
          <a class="brand"><strong>伴山</strong><span>BANSHAN</span></a>
          <nav><a href="#local">本地向导</a><a href="#voice">AI语音向导</a><a href="#discover">城市探索</a></nav>
        </header>

        <div class="hero-copy copy-a"><p>BANSHAN WORLD</p><h1>穿过山门<br/>进入城市的另一面</h1><span>山门是入口，张家界云海是完整背景世界。</span></div>
        <div class="hero-copy copy-b"><p>CAMERA FLY THROUGH</p><h2>门框从两侧掠过。</h2><span>镜头平移向前，不是把视频塞进门洞。</span></div>
        <div class="hero-copy copy-c"><p>HIDDEN WORLD</p><h2>云海世界展开。</h2><span>穿门后石门退出画面，风景占满首屏。</span></div>

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
  setup(){ onMounted(() => { smooth(); hero(); sections(); drag() }) }
}

createApp(App).mount('#app')

function smooth(){
  const lenis = new Lenis({ lerp: .07, wheelMultiplier: .82, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

function hero(){
  const video = document.getElementById('heroVideo')
  video.playbackRate = .55
  video.addEventListener('loadedmetadata', () => { video.currentTime = .01; video.play().catch(()=>{}) }, { once:true })
  video.play().catch(()=>{})

  const canvas = document.getElementById('heroCanvas')
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, .1, 700)
  camera.position.set(0, .05, 8.6)

  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setSize(innerWidth, innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.22

  const gate = new THREE.Group()
  gate.position.set(.05, -.32, .25)
  scene.add(gate)
  const fallback = fallbackGate(gate)
  loadGate(gate, fallback)

  const hemi = new THREE.HemisphereLight(0xffe5c2, 0x080807, .86)
  const sun = new THREE.DirectionalLight(0xffbd75, 7.2); sun.position.set(1.2, 3.8, -4.8)
  const rim = new THREE.DirectionalLight(0xff8e3d, 4.4); rim.position.set(-2.6, 1.4, 2.6)
  scene.add(hemi, sun, rim)
  const mist = gateMist(); scene.add(mist)

  const state = { p:0, chapter:'' }
  gsap.to(state, { p:1, ease:'none', scrollTrigger:{ trigger:'.hero-sequence', start:'top top', end:'bottom bottom', scrub:1.05 }, onUpdate:() => apply(state.p) })

  function apply(p){
    const approach = smoothstep(.03, .40, p)
    const pass = smoothstep(.30, .62, p)
    const reveal = smoothstep(.56, 1, p)

    camera.position.z = lerp(8.6, 2.15, approach)
    camera.position.x = lerp(0, .16, reveal)
    camera.position.y = lerp(.05, .54, reveal)
    camera.fov = lerp(34, 45, reveal)
    camera.updateProjectionMatrix()

    gate.position.z = lerp(.25, 5.65, approach)
    gate.position.x = lerp(.05, -.86, pass)
    gate.position.y = lerp(-.32, -.18, approach)
    gate.scale.setScalar(lerp(1.55, 6.25, approach))
    gate.rotation.y = THREE.MathUtils.degToRad(lerp(0, -18, pass))
    gate.traverse(n => { if(n.material){ n.material.opacity = 1 - smoothstep(.56, .78, p); n.material.needsUpdate = true } })

    mist.children.forEach((m, i) => {
      m.position.z = lerp(-1.4 - i * .1, 2.7 - i * .05, approach)
      m.scale.setScalar(lerp(1, 2.4, approach))
      m.material.opacity = (.035 + i * .008) * (1 - smoothstep(.64, .90, p))
    })

    if(video.duration){
      const t = clamp(progressToVideo(p) * video.duration, .01, video.duration - .08)
      if(Math.abs(video.currentTime - t) > .12) video.currentTime = t
    }

    css('--hero-progress', p.toFixed(3))
    css('--video-scale', (lerp(1.02, 1.20, approach) - reveal * .05).toFixed(3))
    css('--video-y', `${lerp(0, -4.5, reveal).toFixed(2)}vh`)
    css('--video-x', `${lerp(0, -1.2, reveal).toFixed(2)}vw`)
    css('--outside-dark', (1 - smoothstep(.22, .72, p)).toFixed(3))
    css('--gate-glow', (1 - smoothstep(.56, .86, p)).toFixed(3))
    chapter(p, state)
  }

  function animate(){
    gate.rotation.z += Math.sin(performance.now() * .00025) * .00003
    camera.lookAt(.05, 0, -5.8)
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }
  animate()
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight) })
}

function loadGate(group, fallback){
  const draco = new DRACOLoader(); draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
  const loader = new GLTFLoader(); loader.setDRACOLoader(draco)
  loader.load('models/stonegate_web_light_draco.glb', gltf => {
    group.remove(fallback)
    const model = gltf.scene
    normalize(model, 5.85)
    model.position.set(0, -.03, 0)
    model.traverse(n => { if(n.isMesh){ n.frustumCulled = false; n.material = rock(n.material) } })
    group.add(model)
  })
}
function fallbackGate(group){
  const g = new THREE.Group(), mat = rock()
  ;[[.75,3.2,.7,-1.35,0,0],[.75,3.2,.7,1.35,0,0],[3.2,.65,.7,0,1.45,0]].forEach(a=>{ const geo = new THREE.BoxGeometry(a[0],a[1],a[2],8,18,4); const m = new THREE.Mesh(geo, mat.clone()); m.position.set(a[3],a[4],a[5]); g.add(m) })
  group.add(g); return g
}
function gateMist(){
  const g = new THREE.Group()
  for(let i=0;i<7;i++){ const mat = new THREE.MeshBasicMaterial({color:0xffc77d, transparent:true, opacity:.035+i*.008, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide}); const m = new THREE.Mesh(new THREE.PlaneGeometry(5.6+i*.62,.34+i*.05), mat); m.position.set(.1,-1.08+i*.10,-1.4-i*.1); m.rotation.z=(i%2?1:-1)*.055; g.add(m) }
  return g
}
function normalize(model, target){ const box = new THREE.Box3().setFromObject(model), size = new THREE.Vector3(), center = new THREE.Vector3(); box.getSize(size); box.getCenter(center); model.position.sub(center); model.scale.setScalar(target / Math.max(size.x,size.y,size.z)) }
function rock(source){ const mat = new THREE.MeshStandardMaterial({ color:0x6f5b3d, roughness:.9, metalness:0, transparent:true, opacity:1 }); if(source?.map) mat.map = source.map; if(source?.normalMap) mat.normalMap = source.normalMap; return mat }
function chapter(p, state){ let next='01|GATEWAY'; if(p>.36) next='02|ENTER'; if(p>.66) next='03|WORLD'; if(state.chapter===next) return; state.chapter=next; const [n,l]=next.split('|'); document.getElementById('chapterNumber').textContent=n; document.getElementById('chapterName').textContent=l }
function sections(){ gsap.utils.toArray('.copy-step').slice(1).forEach(e=>gsap.set(e,{opacity:0,y:34,filter:'blur(18px)'})); const steps=gsap.utils.toArray('.copy-step'); const tl=gsap.timeline({scrollTrigger:{trigger:'.layered-copy',start:'top top',end:'+=220%',scrub:1,pin:true}}); steps.forEach((s,i)=>{ if(!i)return; tl.to(steps[i-1],{opacity:0,y:-34,filter:'blur(18px)'},i-.15).to(s,{opacity:1,y:0,filter:'blur(0px)'},i) }) }
function drag(){ const v=document.getElementById('dragViewport'), t=document.getElementById('dragTrack'); if(!v||!t)return; let down=false,start=0,base=0,x=0,target=0,max=0; const measure=()=>max=Math.max(0,t.scrollWidth-v.clientWidth); const tick=()=>{x+=(target-x)*.12;t.style.transform=`translate3d(${x}px,0,0)`;requestAnimationFrame(tick)}; measure(); tick(); addEventListener('resize',measure); v.onpointerdown=e=>{down=true;start=e.clientX;base=target;v.setPointerCapture(e.pointerId)}; v.onpointermove=e=>{if(down)target=clamp(base+e.clientX-start,-max,0)}; v.onpointerup=()=>down=false; }
function progressToVideo(p){ return .06 + p * .62 }
function css(k,v){ document.documentElement.style.setProperty(k,v) }
function lerp(a,b,t){return a+(b-a)*t} function clamp(v,min,max){return Math.max(min,Math.min(max,v))} function smoothstep(a,b,v){const x=clamp((v-a)/(b-a),0,1); return x*x*(3-2*x)}
