import { expect, it } from 'vitest'
import { createCamera, drawDebugOverlay } from '../src'
import type { DebugCanvasContext } from '../src'

it('@claim:debug-envelope draws the view, safety envelope, targets, and labels without changing state', () => {
  const camera = createCamera({
    viewport: { width: 800, height: 450 },
    world: { x: 0, y: 0, width: 2000, height: 1000 },
    padding: 50,
  })
  camera.snap([{ id: 'p1', x: 400, y: 200, width: 40, height: 60 }])
  const before = camera.inspect()
  const rects: number[][] = []
  const labels: string[] = []
  const context = {
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    font: '',
    save() {},
    restore() {},
    beginPath() {},
    rect(...values: number[]) {
      rects.push(values)
    },
    stroke() {},
    fill() {},
    fillText(value: string) {
      labels.push(value)
    },
    setLineDash() {},
  } satisfies DebugCanvasContext

  drawDebugOverlay(context, before, {
    worldToScreen: point => ({ x: point.x * 2, y: point.y * 2 }),
  })

  expect(rects).toHaveLength(3)
  expect(labels).toEqual(['p1'])
  expect(camera.inspect()).toEqual(before)
})
