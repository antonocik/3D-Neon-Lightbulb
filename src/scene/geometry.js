/**
 * Pure colour and geometry helpers.
 *
 * Kept free of Three.js scene objects so they can be unit tested in Node
 * without a WebGL context.
 */

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/** Convert HSL (h in degrees, s and l in 0–1) to linear-ish RGB in 0–1. */
export function hslToRgb(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lightness - c / 2

  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]

  return { r: r + m, g: g + m, b: b + m }
}

/** Hex string for a hue, usable by CSS and Three.js. */
export function hslToHex(hue, saturation = 1, lightness = 0.6) {
  const { r, g, b } = hslToRgb(hue, saturation, lightness)
  const channel = (value) =>
    Math.round(clamp(value, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

/**
 * The three colours a neon scene is built from.
 *
 * `accent` sits opposite `core` on the colour wheel so the scene keeps
 * contrast as the hue slider moves.
 */
export function neonPalette(hue) {
  const base = ((hue % 360) + 360) % 360
  return {
    hue: base,
    core: hslToHex(base, 1, 0.68),
    glow: hslToHex(base, 1, 0.52),
    accent: hslToHex(base + 165, 1, 0.6),
    background: hslToHex(base, 0.55, 0.05),
  }
}

/**
 * Points along a tapered helix, in the bulb's local space.
 *
 * `taper` shrinks the radius towards both ends so the coil reads like a
 * real filament rather than a spring.
 */
export function helixPoints({
  turns = 9,
  radius = 0.34,
  height = 1.0,
  segments = 320,
  taper = 0.45,
} = {}) {
  const points = []
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    const angle = t * turns * Math.PI * 2
    const shape = Math.sin(Math.PI * t)
    const r = radius * (1 - taper + taper * shape)
    points.push([
      Math.cos(angle) * r,
      -height / 2 + t * height,
      Math.sin(angle) * r,
    ])
  }
  return points
}

/**
 * Cross-section of a classic incandescent bulb, for LatheGeometry.
 *
 * Returns `[x, y]` pairs from the neck up over the dome. The neck sits at
 * y = -1 and the top of the dome at y = +1.
 */
export function bulbProfile({ neck = 0.3, bulge = 0.58, dome = 1 } = {}) {
  return [
    [neck, -1.0],
    [neck + 0.04, -0.86],
    [neck + 0.14, -0.6],
    [bulge - 0.06, -0.3],
    [bulge, 0.0],
    [bulge - 0.02, 0.28],
    [bulge - 0.14, 0.55],
    [bulge - 0.34, 0.78],
    [bulge - 0.5, 0.94],
    [dome * 0.22, 1.04],
    [0, 1.06],
  ]
}

/** Smoothly interpolate between two hues along the shortest arc. */
export function lerpHue(from, to, t) {
  let delta = ((((to - from) % 360) + 540) % 360) - 180
  return (((from + delta * clamp(t, 0, 1)) % 360) + 360) % 360
}

/** Count the vertex positions a helix tube will need. */
export function helixVertexCount(segments) {
  return (segments + 1) * 2
}
