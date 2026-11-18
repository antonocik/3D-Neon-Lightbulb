# 💡 3D Neon Lightbulb

An interactive neon lightbulb rendered in the browser with Three.js. Physical glass, an emissive filament coil, and real bloom post-processing — with live controls for colour, power and glow.

<p align="center">
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-r187-000000?style=flat-square&logo=threedotjs&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white">
  <img alt="Tests" src="https://img.shields.io/badge/tests-20%20passed-3fb950?style=flat-square">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square">
</p>

## What you get

- **Physical glass bulb** — `MeshPhysicalMaterial` with transmission, thickness, IOR 1.45 and clearcoat, lit by a PMREM environment map so the glass actually refracts and reflects.
- **Neon filament** — a tapered helix swept into a `TubeGeometry`, driven by an emissive material that pulses.
- **Real bloom** — `UnrealBloomPass` via `EffectComposer`, so the glow bleeds rather than being faked with a sprite.
- **Live controls** — hue, power and bloom sliders, six colour presets, auto-rotate toggle and camera reset.
- **Orbit controls** — drag to rotate, scroll to zoom, with damping.

## Quick start

```bash
git clone https://github.com/antonocik/3D-Neon-Lightbulb.git
cd 3D-Neon-Lightbulb
npm install
npm run dev
```

Open <http://localhost:5173>. Drag to orbit.

```bash
npm run build     # production bundle in dist/
npm run preview   # serve the build locally
npm test          # run the unit tests
```

Requires a browser with WebGL 2. If WebGL is unavailable the HUD reports it instead of failing silently.

## Controls

| Control | Effect |
|---|---|
| **Neon colour** | Rotates the hue. The accent light and background follow, so the scene keeps contrast. |
| **Power** | Dims the filament, key light and floor halo together — the bulb reads as switched off at 0%. |
| **Bloom** | Strength of the glow pass. Push it up for a hazy neon look, down for a crisp bulb. |
| **Auto-rotate** | Slowly spins the filament and socket. |
| **Reset view** | Returns the camera to its starting position. |
| **Presets** | Six one-click colour pairs. |

## Architecture

```
src/
  main.js              wires the DOM controls to the scene API
  styles.css           HUD chrome
  scene/
    scene.js           Three.js scene: geometry, materials, lights, post-processing
    geometry.js        pure helpers — colour maths, helix, bulb profile
tests/
  geometry.test.js     20 unit tests
```

`scene.js` owns every WebGL resource it creates and exposes a small imperative API (`setHue`, `setPower`, `setBloom`, `setAutoRotate`, `resetCamera`, `dispose`). The UI layer never touches a Three.js object, and `dispose()` releases all geometries, materials, the render target and the resize observer.

`geometry.js` has no Three.js imports, which is why it can be tested in plain Node.

### How the bulb is built

**The glass** is a `LatheGeometry` revolved from `bulbProfile()` — an 11-point cross-section from the neck up over the dome. Edit that array to reshape the bulb; no mesh authoring needed.

**The filament** is `helixPoints()` — a tapered helix, so the coil is narrow at both ends and fat in the middle, like a real filament rather than a spring:

```
r(t) = radius · (1 − taper + taper · sin(πt))
```

Those points become a `CatmullRomCurve3`, which is swept into a tube.

**The colour scheme** comes from `neonPalette(hue)`. The accent sits 165° around the wheel from the core, so whichever hue you pick, the key light and the rim light stay complementary. `lerpHue` exists for smooth hue animation along the shortest arc — for example 350° → 10° moves through 0°, not the long way round.

## Testing

```bash
npm test
```

```
 ✓ tests/geometry.test.js (20 tests) 11ms

 Test Files  1 passed (1)
      Tests  20 passed (20)
```

The suite covers HSL→RGB→hex conversion (including hue wrapping past 360° and negative hues), palette construction and accent placement, helix taper and bounds, bulb profile shape and monotonicity, hue interpolation across the 360° boundary, and clamping. The render loop itself needs a GPU, so it is exercised by running the app rather than by unit tests.

## Performance notes

- Pixel ratio is capped at 2, so a 4K display does not render at 3× cost.
- The scene is rebuilt only on resize; the animation loop only mutates uniforms.
- The production bundle is ~150 kB gzipped, almost entirely Three.js.

## Tech stack

| Layer | Choice |
|---|---|
| 3D | Three.js (r187) |
| Build | Vite 6 |
| Tests | Vitest |
| Post-processing | `UnrealBloomPass`, `OutputPass` |
| Environment lighting | `RoomEnvironment` + `PMREMGenerator` |

## License

MIT — see [LICENSE](LICENSE).
