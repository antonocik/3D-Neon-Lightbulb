import { describe, expect, it } from 'vitest'
import {
  bulbProfile,
  clamp,
  helixPoints,
  helixVertexCount,
  hslToHex,
  hslToRgb,
  lerpHue,
  neonPalette,
} from '../src/scene/geometry.js'

describe('clamp', () => {
  it('bounds values on both sides', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})

describe('hslToRgb', () => {
  it('maps the primary hues correctly', () => {
    expect(hslToRgb(0, 1, 0.5)).toEqual({ r: 1, g: 0, b: 0 })
    const green = hslToRgb(120, 1, 0.5)
    expect(green.g).toBeCloseTo(1, 5)
    expect(green.r).toBeCloseTo(0, 5)
    const blue = hslToRgb(240, 1, 0.5)
    expect(blue.b).toBeCloseTo(1, 5)
  })

  it('produces grey when saturation is zero', () => {
    const grey = hslToRgb(200, 0, 0.5)
    expect(grey.r).toBeCloseTo(grey.g, 6)
    expect(grey.g).toBeCloseTo(grey.b, 6)
  })

  it('wraps hues beyond 360 and below 0', () => {
    expect(hslToRgb(360, 1, 0.5)).toEqual(hslToRgb(0, 1, 0.5))
    expect(hslToRgb(-120, 1, 0.5)).toEqual(hslToRgb(240, 1, 0.5))
  })
})

describe('hslToHex', () => {
  it('returns a six digit hex string', () => {
    expect(hslToHex(0, 1, 0.5)).toBe('#ff0000')
    expect(hslToHex(120, 1, 0.5)).toBe('#00ff00')
    expect(hslToHex(240, 1, 0.5)).toBe('#0000ff')
  })

  it('always pads to six digits', () => {
    const hex = hslToHex(90, 0.2, 0.05)
    expect(hex).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('neonPalette', () => {
  it('returns four usable colours', () => {
    const palette = neonPalette(190)
    for (const key of ['core', 'glow', 'accent', 'background']) {
      expect(palette[key]).toMatch(/^#[0-9a-f]{6}$/)
    }
    expect(palette.hue).toBe(190)
  })

  it('places the accent roughly opposite the core hue', () => {
    const palette = neonPalette(0)
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(palette.accent.slice(i, i + 2), 16))
    // accent at hue 165 is a teal, so green and blue must dominate red
    expect(g).toBeGreaterThan(r)
    expect(b).toBeGreaterThan(r)
  })

  it('normalises negative and over-rotated hues', () => {
    expect(neonPalette(-10).hue).toBe(350)
    expect(neonPalette(370).hue).toBe(10)
  })
})

describe('helixPoints', () => {
  it('returns one more point than segments', () => {
    expect(helixPoints({ segments: 64 })).toHaveLength(65)
  })

  it('tapers towards the ends', () => {
    const points = helixPoints({ turns: 4, radius: 0.4, height: 1, segments: 200 })
    const radiusAt = (point) => Math.hypot(point[0], point[2])
    const middle = radiusAt(points[100])
    expect(middle).toBeGreaterThan(radiusAt(points[0]))
    expect(middle).toBeGreaterThan(radiusAt(points[200]))
  })

  it('spans the requested height from bottom to top', () => {
    const points = helixPoints({ height: 2, segments: 100 })
    expect(points[0][1]).toBeCloseTo(-1, 6)
    expect(points[100][1]).toBeCloseTo(1, 6)
  })

  it('stays within the requested radius', () => {
    const points = helixPoints({ radius: 0.5, taper: 0.4 })
    for (const [x, , z] of points) {
      expect(Math.hypot(x, z)).toBeLessThanOrEqual(0.5 + 1e-9)
    }
  })
})

describe('bulbProfile', () => {
  it('starts at the neck and ends on the axis', () => {
    const profile = bulbProfile()
    expect(profile[0][0]).toBeCloseTo(0.3, 6)
    expect(profile[0][1]).toBe(-1)
    expect(profile[profile.length - 1][0]).toBe(0)
  })

  it('is widest around the middle', () => {
    const profile = bulbProfile()
    const widest = Math.max(...profile.map(([x]) => x))
    expect(widest).toBeCloseTo(0.58, 6)
  })

  it('rises monotonically in y', () => {
    const profile = bulbProfile()
    for (let i = 1; i < profile.length; i += 1) {
      expect(profile[i][1]).toBeGreaterThan(profile[i - 1][1])
    }
  })
})

describe('lerpHue', () => {
  it('moves forwards and backwards along the shortest arc', () => {
    expect(lerpHue(0, 90, 0.5)).toBeCloseTo(45, 6)
    expect(lerpHue(0, 270, 0.5)).toBeCloseTo(315, 6)
  })

  it('clamps progress outside 0–1', () => {
    expect(lerpHue(10, 20, -1)).toBe(10)
    expect(lerpHue(10, 20, 5)).toBe(20)
  })

  it('crosses the 360 boundary cleanly', () => {
    expect(lerpHue(350, 10, 0.5)).toBeCloseTo(0, 6)
  })
})

describe('helixVertexCount', () => {
  it('counts two rails of vertices', () => {
    expect(helixVertexCount(320)).toBe(642)
  })
})
