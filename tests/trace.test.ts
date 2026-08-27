import { describe, expect, it } from 'vitest'
import { runTrace } from '../src'
import type { CameraTrace } from '../src'

const replay: CameraTrace = {
  config: {
    viewport: { width: 1280, height: 720 },
    world: { x: 0, y: 0, width: 4096, height: 2048 },
    padding: 96,
    minZoom: 0.4,
    maxZoom: 1.5,
    damping: 10,
  },
  samples: [
    {
      at: 0,
      targets: [
        { id: 'p1', x: 1100, y: 800, width: 48, height: 64 },
        { id: 'p2', x: 1600, y: 800, width: 48, height: 64 },
      ],
    },
    {
      at: 1000,
      targets: [
        { id: 'p1', x: 1200, y: 820, width: 48, height: 64 },
        { id: 'p2', x: 1700, y: 820, width: 48, height: 64 },
      ],
    },
  ],
  assertions: { targetsVisible: true, maxZoomDelta: 0.08 },
}

describe('runTrace', () => {
  it('replays a safe trace and covers the documented usage', () => {
    const report = runTrace(replay)
    expect(report.ok).toBe(true)
    expect(report.frames).toHaveLength(61)
    expect(report.failures).toEqual([])
  })

  it('returns byte-for-byte stable results for the same fixed step', () => {
    expect(runTrace(replay, { fixedStepMs: 20 })).toEqual(runTrace(replay, { fixedStepMs: 20 }))
  })

  it('catches a deliberate off-screen regression with target and timestamp', () => {
    const report = runTrace({
      ...replay,
      config: { ...replay.config, minZoom: 1, maxZoom: 1 },
      samples: [
        {
          at: 0,
          targets: [
            { id: 'left', x: 0, y: 200, width: 50, height: 50 },
            { id: 'right', x: 3000, y: 200, width: 50, height: 50 },
          ],
        },
        {
          at: 100,
          targets: [
            { id: 'left', x: 0, y: 200, width: 50, height: 50 },
            { id: 'right', x: 3000, y: 200, width: 50, height: 50 },
          ],
        },
      ],
      assertions: { targetsVisible: true },
    })
    expect(report.ok).toBe(false)
    expect(report.failures[0]).toMatchObject({ code: 'target-outside-safe-area', targetId: 'left', at: 0 })
  })

  it('rejects ambiguous trace identities and timestamps', () => {
    expect(() => runTrace({ ...replay, samples: [] })).toThrow('at least one sample')
    expect(() =>
      runTrace({
        ...replay,
        samples: [
          { at: 0, targets: [{ id: 'same', x: 0, y: 0, width: 1, height: 1 }] },
          {
            at: 0,
            targets: [{ id: 'same', x: 1, y: 1, width: 1, height: 1 }],
          },
        ],
      }),
    ).toThrow('strictly increasing')
  })
})
