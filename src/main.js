import { createScene } from './scene/scene.js'
import { hslToHex, neonPalette } from './scene/geometry.js'

const viewport = document.getElementById('viewport')
const hueInput = document.getElementById('hue')
const hueValue = document.getElementById('hue-value')
const powerInput = document.getElementById('power')
const powerValue = document.getElementById('power-value')
const bloomInput = document.getElementById('bloom')
const bloomValue = document.getElementById('bloom-value')
const rotateInput = document.getElementById('rotate')
const resetButton = document.getElementById('reset')
const swatches = document.getElementById('swatches')
const status = document.getElementById('status')

function updateAccent(hue) {
  const { core, accent } = neonPalette(hue)
  document.documentElement.style.setProperty('--accent', core)
  hueValue.textContent = `${hue}°`
  hueInput.style.setProperty('--accent', core)
  status.style.color = accent
}

let scene
try {
  scene = createScene(viewport, { hue: Number(hueInput.value) })
} catch (error) {
  status.textContent = `WebGL unavailable — ${error.message}`
  console.error(error)
}

if (scene) {
  updateAccent(Number(hueInput.value))

  hueInput.addEventListener('input', () => {
    const hue = Number(hueInput.value)
    scene.setHue(hue)
    updateAccent(hue)
  })

  powerInput.addEventListener('input', () => {
    const power = Number(powerInput.value) / 100
    powerValue.textContent = `${powerInput.value}%`
    scene.setPower(power)
  })

  bloomInput.addEventListener('input', () => {
    const strength = Number(bloomInput.value) / 100
    bloomValue.textContent = strength.toFixed(2)
    scene.setBloom(strength)
  })

  rotateInput.addEventListener('change', () => scene.setAutoRotate(rotateInput.checked))
  resetButton.addEventListener('click', () => scene.resetCamera())

  const PRESETS = [190, 275, 320, 12, 96, 155]
  for (const hue of PRESETS) {
    const button = document.createElement('button')
    button.type = 'button'
    button.title = `Neon ${hue}°`
    button.style.background = `linear-gradient(135deg, ${hslToHex(hue, 1, 0.68)}, ${hslToHex(
      hue + 165,
      1,
      0.6,
    )})`
    button.addEventListener('click', () => {
      hueInput.value = String(hue)
      scene.setHue(hue)
      updateAccent(hue)
    })
    swatches.appendChild(button)
  }

  window.addEventListener('beforeunload', () => scene.dispose())
  status.textContent = 'WebGL ready — drag to orbit'
}
