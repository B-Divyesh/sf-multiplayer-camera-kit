import { createCamera } from './camera'
import { CameraInputError } from './errors'
import { assertFinite, rectContains, validateRect } from './math'
import type {
  CameraTrace,
  IdentifiedRect,
  TraceFailure,
  TraceFrame,
  TraceReport,
  TraceRunOptions,
  TraceSample,
} from './types'

function validateSamples(samples: readonly TraceSample[]): TraceSample[] {
  if (samples.length === 0) throw new CameraInputError('trace.samples must contain at least one sample')
  let previous = -Infinity
  return samples.map((sample, sampleIndex) => {
    assertFinite(sample.at, `samples[${sampleIndex}].at`)
    if (sample.at < 0 || sample.at <= previous) {
      throw new CameraInputError('trace sample timestamps must be non-negative and strictly increasing')
    }
    previous = sample.at
    const ids = new Set<string>()
    const targets = sample.targets.map((target, targetIndex) => {
      if (!target.id) throw new CameraInputError(`samples[${sampleIndex}].targets[${targetIndex}].id is required`)
      if (ids.has(target.id)) throw new CameraInputError(`duplicate target id "${target.id}" at ${sample.at}ms`)
      ids.add(target.id)
      return validateRect(target, `samples[${sampleIndex}].targets[${targetIndex}]`) as IdentifiedRect
    })
    return { at: sample.at, targets }
  })
}

function interpolateRect(from: IdentifiedRect, to: IdentifiedRect, amount: number): IdentifiedRect {
  return {
    id: from.id,
    x: from.x + (to.x - from.x) * amount,
    y: from.y + (to.y - from.y) * amount,
    width: from.width + (to.width - from.width) * amount,
    height: from.height + (to.height - from.height) * amount,
  }
}

function targetsAt(samples: readonly TraceSample[], at: number): IdentifiedRect[] {
  if (at <= samples[0]!.at) return samples[0]!.targets.map(target => ({ ...target }))
  const last = samples[samples.length - 1]!
  if (at >= last.at) return last.targets.map(target => ({ ...target }))
  let upperIndex = 1
  while (samples[upperIndex]!.at < at) upperIndex += 1
  const from = samples[upperIndex - 1]!
  const to = samples[upperIndex]!
  const amount = (at - from.at) / (to.at - from.at)
  const nextById = new Map(to.targets.map(target => [target.id, target]))
  const result = from.targets
    .map(target => {
      const next = nextById.get(target.id)
      return next ? interpolateRect(target, next, amount) : amount < 1 ? { ...target } : null
    })
    .filter((target): target is IdentifiedRect => target !== null)
  if (amount === 1) {
    const existing = new Set(result.map(target => target.id))
    to.targets.forEach(target => {
      if (!existing.has(target.id)) result.push({ ...target })
    })
  }
  return result
}

export function runTrace(trace: CameraTrace, options: TraceRunOptions = {}): TraceReport {
  const samples = validateSamples(trace.samples)
  const fixedStepMs = options.fixedStepMs ?? 1000 / 60
  assertFinite(fixedStepMs, 'fixedStepMs')
  if (fixedStepMs <= 0) throw new CameraInputError('fixedStepMs must be greater than 0')
  const durationMs = samples[samples.length - 1]!.at
  const camera = createCamera(trace.config)
  const failures: TraceFailure[] = []
  const frames: TraceFrame[] = []
  let previousZoom: number | undefined

  const steps = Math.ceil(durationMs / fixedStepMs)
  for (let index = 0; index <= steps; index += 1) {
    const at = Math.min(index * fixedStepMs, durationMs)
    const targets = targetsAt(samples, at)
    const pose = camera.update(targets, index === 0 ? 0 : (at - frames[index - 1]!.at) / 1000)
    const snapshot = camera.inspect()
    frames.push({ at, pose, allTargetsVisible: snapshot.allTargetsVisible })

    if (trace.assertions?.targetsVisible) {
      targets.forEach(target => {
        if (!rectContains(snapshot.paddedVisibleBounds, target)) {
          failures.push({
            at,
            code: 'target-outside-safe-area',
            targetId: target.id,
            message: `Target "${target.id}" left the padded camera area at ${at.toFixed(2)}ms`,
          })
        }
      })
    }
    const maxZoomDelta = trace.assertions?.maxZoomDelta
    if (maxZoomDelta !== undefined && previousZoom !== undefined) {
      const actual = Math.abs(pose.zoom - previousZoom)
      if (actual > maxZoomDelta) {
        failures.push({
          at,
          code: 'zoom-delta-exceeded',
          actual,
          expected: maxZoomDelta,
          message: `Zoom changed by ${actual.toFixed(4)} at ${at.toFixed(2)}ms (limit ${maxZoomDelta})`,
        })
      }
    }
    previousZoom = pose.zoom
    if (at === durationMs) break
  }

  return { ok: failures.length === 0, fixedStepMs, durationMs, frames, failures }
}
