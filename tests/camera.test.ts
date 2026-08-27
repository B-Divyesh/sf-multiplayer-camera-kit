import { describe, expect, it } from 'vitest'
import { CameraInputError, createCamera, frameTargets } from '../src'
import type { CameraConfig, Rect } from '../src'

const config: CameraConfig = {
  viewport: { width: 1000, height: 500 },
  world: { x: 0, y: 0, width: 2000, height: 1000 },
  padding: 100,
  minZoom: 0.25,
  maxZoom: 2,
  damping: 8,
}

describe('frameTargets', () => {
  it('fits multiple targets inside the padded viewport', () => {
    const pose = frameTargets(
      [
        { id: 'one', x: 500, y: 200, width: 100, height: 100 },
        { id: 'two', x: 900, y: 200, width: 100, height: 100 },
      ],
      config,
    )
    expect(pose.zoom).toBeCloseTo(1.6)
    expect(pose.centerX).toBeCloseTo(750)
    expect(pose.centerY).toBeCloseTo(250)
  })

  it('centers an undersized world and returns a stable empty pose', () => {
    const pose = frameTargets([], {
      viewport: { width: 800, height: 600 },
      world: { x: 20, y: 40, width: 200, height: 100 },
      maxZoom: 1,
    })
    expect(pose.centerX).toBe(120)
    expect(pose.centerY).toBe(90)
  })

  it('clamps the visible rectangle to world bounds', () => {
    const pose = frameTargets([{ x: 0, y: 0, width: 20, height: 20 }], config)
    expect(pose.x).toBe(0)
    expect(pose.y).toBe(0)
  })
})

describe('createCamera', () => {
  const first: Rect[] = [{ id: 'p1', x: 300, y: 300, width: 32, height: 48 }]
  const second: Rect[] = [{ id: 'p1', x: 1200, y: 600, width: 32, height: 48 }]

  it('snaps on first acquisition and damps independently of frame slicing', () => {
    const once = createCamera(config)
    const twice = createCamera(config)
    once.update(first, 0)
    twice.update(first, 0)

    const oneFrame = once.update(second, 1 / 30)
    twice.update(second, 1 / 60)
    const twoFrames = twice.update(second, 1 / 60)

    expect(twoFrames.centerX).toBeCloseTo(oneFrame.centerX, 10)
    expect(twoFrames.centerY).toBeCloseTo(oneFrame.centerY, 10)
    expect(twoFrames.zoom).toBeCloseTo(oneFrame.zoom, 10)
  })

  it('holds the last pose when the target list becomes empty', () => {
    const camera = createCamera(config)
    const acquired = camera.update(first, 1 / 60)
    expect(camera.update([], 1)).toEqual(acquired)
    expect(camera.inspect().targets).toHaveLength(0)
  })

  it('reports when configured zoom limits make safety impossible', () => {
    const camera = createCamera({
      viewport: { width: 800, height: 450 },
      world: { x: 0, y: 0, width: 2400, height: 1200 },
      padding: 50,
      minZoom: 0.5,
      maxZoom: 1,
    })
    camera.snap([
      { id: 'left', x: 0, y: 200, width: 50, height: 50 },
      { id: 'right', x: 1950, y: 200, width: 50, height: 50 },
    ])
    expect(camera.inspect()).toMatchObject({ allTargetsVisible: false, limitingAxis: 'minZoom' })
  })

  it('reframes after a viewport resize', () => {
    const camera = createCamera(config)
    camera.snap(first)
    camera.resize({ width: 500, height: 500 })
    expect(camera.inspect().config.viewport).toEqual({ width: 500, height: 500 })
    expect(camera.pose.visibleWidth).toBeCloseTo(250)
  })

  it.each([
    [{ ...config, minZoom: 3 }, 'zoom limits'],
    [{ ...config, viewport: { width: 0, height: 500 } }, 'viewport'],
    [{ ...config, padding: 250 }, 'padding'],
  ])('rejects invalid config %#', (badConfig, message) => {
    expect(() => createCamera(badConfig as CameraConfig)).toThrowError(new RegExp(message))
  })

  it('rejects invalid targets and time deltas before state is corrupted', () => {
    const camera = createCamera(config)
    expect(() => camera.update([{ x: Number.NaN, y: 0, width: 1, height: 1 }], 0)).toThrow(CameraInputError)
    expect(() => camera.update(first, -1)).toThrow('deltaSeconds cannot be negative')
  })
})
