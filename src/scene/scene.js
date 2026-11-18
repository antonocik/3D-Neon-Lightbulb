/**
 * Three.js neon lightbulb scene.
 *
 * `createScene` owns every WebGL resource it allocates and returns a small
 * imperative API, so the UI layer never touches Three.js objects directly.
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

import { bulbProfile, helixPoints, neonPalette } from './geometry.js'

const DEFAULTS = {
  hue: 190,
  power: 1,
  bloom: 0.28,
  autoRotate: true,
}

export function createScene(container, userOptions = {}) {
  const options = { ...DEFAULTS, ...userOptions }

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.78
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    38,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  )
  camera.position.set(0, 0.5, 5.4)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 3
  controls.maxDistance = 9
  controls.enablePan = false
  controls.target.set(0, 0, 0)

  let palette = neonPalette(options.hue)

  // ── Materials ──────────────────────────────────────────────────────────
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.06,
    transmission: 1,
    thickness: 0.22,
    ior: 1.45,
    transparent: true,
    opacity: 1,
    clearcoat: 0.4,
    clearcoatRoughness: 0.06,
    side: THREE.DoubleSide,
    envMapIntensity: 1.4,
  })

  const filamentMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.core),
    emissive: new THREE.Color(palette.core),
    emissiveIntensity: 1.6,
    roughness: 0.35,
    metalness: 0.1,
  })

  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x9aa4b2,
    metalness: 1,
    roughness: 0.28,
  })

  const ceramicMaterial = new THREE.MeshStandardMaterial({
    color: 0x14161c,
    metalness: 0.1,
    roughness: 0.85,
  })

  // ── Bulb glass ─────────────────────────────────────────────────────────
  const profile = bulbProfile().map(([x, y]) => new THREE.Vector2(x, y))
  const glassGeometry = new THREE.LatheGeometry(profile, 96)
  const glass = new THREE.Mesh(glassGeometry, glassMaterial)
  glass.position.y = 0.15
  scene.add(glass)

  // ── Filament ───────────────────────────────────────────────────────────
  const filamentGroup = new THREE.Group()
  filamentGroup.position.y = 0.15

  const curve = new THREE.CatmullRomCurve3(
    helixPoints().map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  )
  const filamentGeometry = new THREE.TubeGeometry(curve, 420, 0.014, 10, false)
  const filament = new THREE.Mesh(filamentGeometry, filamentMaterial)
  filamentGroup.add(filament)

  const stemGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 12)
  const stem = new THREE.Mesh(stemGeometry, metalMaterial)
  stem.position.y = -0.72
  filamentGroup.add(stem)

  const stemBulbGeometry = new THREE.SphereGeometry(0.05, 16, 12)
  const stemBulb = new THREE.Mesh(stemBulbGeometry, metalMaterial)
  stemBulb.position.y = -0.5
  filamentGroup.add(stemBulb)

  scene.add(filamentGroup)

  // ── Base and socket ────────────────────────────────────────────────────
  const baseGroup = new THREE.Group()
  baseGroup.position.y = -0.95

  const collarGeometry = new THREE.CylinderGeometry(0.31, 0.33, 0.16, 48)
  const collar = new THREE.Mesh(collarGeometry, ceramicMaterial)
  collar.position.y = 0.06
  baseGroup.add(collar)

  const threads = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.34, 48, 1, true),
    metalMaterial,
  )
  threads.position.y = -0.2
  baseGroup.add(threads)

  for (let i = 0; i < 5; i += 1) {
    const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.014, 8, 48), metalMaterial)
    ridge.rotation.x = Math.PI / 2
    ridge.position.y = -0.08 - i * 0.06
    baseGroup.add(ridge)
  }

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16), ceramicMaterial)
  tip.position.y = -0.44
  tip.scale.set(1, 0.7, 1)
  baseGroup.add(tip)

  scene.add(baseGroup)

  // ── Lighting ───────────────────────────────────────────────────────────
  const keyLight = new THREE.PointLight(new THREE.Color(palette.core), 0.9, 5, 2)
  keyLight.position.set(0, 0.15, 0)
  scene.add(keyLight)

  const accentLight = new THREE.PointLight(new THREE.Color(palette.accent), 2.4, 16, 2)
  accentLight.position.set(-2.4, 1.6, 1.8)
  scene.add(accentLight)

  const rimLight = new THREE.PointLight(new THREE.Color(palette.accent), 1.6, 18, 2)
  rimLight.position.set(2.6, -0.6, -2.2)
  scene.add(rimLight)

  scene.add(new THREE.AmbientLight(0xffffff, 0.04))

  const pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = environment.texture
  scene.environmentIntensity = 0.12

  // ── Floor ──────────────────────────────────────────────────────────────
  const floorGeometry = new THREE.CircleGeometry(9, 64)
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x05070c,
    metalness: 0.9,
    roughness: 0.35,
  })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.42
  scene.add(floor)

  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 64),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(palette.glow),
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  halo.rotation.x = -Math.PI / 2
  halo.position.y = -1.41
  scene.add(halo)

  // ── Post processing ────────────────────────────────────────────────────
  const composer = new EffectComposer(renderer)
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  composer.setSize(container.clientWidth, container.clientHeight)
  composer.addPass(new RenderPass(scene, camera))

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    options.bloom,
    0.7,
    0.9,
  )
  composer.addPass(bloomPass)
  composer.addPass(new OutputPass())

  // ── Animation ──────────────────────────────────────────────────────────
  const clock = new THREE.Clock()
  let frame = 0
  let disposed = false

  function render() {
    if (disposed) return
    frame = requestAnimationFrame(render)

    const elapsed = clock.getElapsedTime()
    const power = options.power

    if (options.autoRotate) {
      filamentGroup.rotation.y += 0.004
      baseGroup.rotation.y = filamentGroup.rotation.y
      halo.rotation.z -= 0.0015
    }

    const flicker = 1 + Math.sin(elapsed * 7.3) * 0.012 + Math.sin(elapsed * 19.1) * 0.006
    const intensity = power * flicker

    filamentMaterial.emissiveIntensity = 1.6 * intensity
    keyLight.intensity = 0.9 * intensity
    accentLight.intensity = 2.4 * (0.5 + power * 0.5)
    halo.material.opacity = 0.04 + 0.09 * power
    halo.scale.setScalar(0.85 + 0.2 * power + Math.sin(elapsed * 1.7) * 0.02)

    controls.update()
    composer.render()
  }

  render()

  function onResize() {
    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) return
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    composer.setSize(width, height)
  }

  const resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(container)

  // ── Public API ─────────────────────────────────────────────────────────
  function applyPalette() {
    filamentMaterial.color.set(palette.core)
    filamentMaterial.emissive.set(palette.core)
    keyLight.color.set(palette.core)
    accentLight.color.set(palette.accent)
    rimLight.color.set(palette.accent)
    halo.material.color.set(palette.glow)
    scene.background = new THREE.Color(palette.background)
    scene.fog = new THREE.Fog(palette.background, 6, 15)
  }

  applyPalette()

  return {
    setHue(hue) {
      options.hue = hue
      palette = neonPalette(hue)
      applyPalette()
    },
    setPower(power) {
      options.power = Math.max(0, Math.min(1, power))
    },
    setBloom(strength) {
      options.bloom = strength
      bloomPass.strength = strength
    },
    setAutoRotate(enabled) {
      options.autoRotate = enabled
    },
    resetCamera() {
      camera.position.set(0, 0.5, 5.4)
      controls.target.set(0, 0, 0)
      controls.update()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      controls.dispose()
      composer.dispose()
      renderer.dispose()

      glassGeometry.dispose()
      filamentGeometry.dispose()
      stemGeometry.dispose()
      stemBulbGeometry.dispose()
      collarGeometry.dispose()
      floorGeometry.dispose()
      halo.geometry.dispose()
      halo.material.dispose()

      for (const material of [
        glassMaterial,
        filamentMaterial,
        metalMaterial,
        ceramicMaterial,
        floorMaterial,
      ]) {
        material.dispose()
      }

      environment.dispose()
      pmrem.dispose()
      renderer.domElement.remove()
    },
  }
}
