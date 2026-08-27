export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Rect extends Point, Size {
  id?: string
}

export interface IdentifiedRect extends Rect {
  id: string
}

export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface CameraPose extends Point {
  centerX: number
  centerY: number
  zoom: number
  visibleWidth: number
  visibleHeight: number
}

export interface CameraConfig {
  viewport: Size
  world: Rect
  /** Safety margin in viewport pixels. */
  padding?: number | Partial<Padding>
  /** Smallest allowed viewport-pixels-per-world-pixel value. Defaults to 0.25. */
  minZoom?: number
  /** Largest allowed viewport-pixels-per-world-pixel value. Defaults to 2. */
  maxZoom?: number
  /** Exponential damping strength per second. Set to 0 to snap. Defaults to 8. */
  damping?: number
}

export interface ResolvedCameraConfig {
  viewport: Size
  world: Rect
  padding: Padding
  minZoom: number
  maxZoom: number
  damping: number
}

export type LimitingAxis = 'width' | 'height' | 'maxZoom' | 'minZoom' | 'none'

export interface CameraSnapshot {
  pose: CameraPose
  desiredPose: CameraPose
  targets: readonly Rect[]
  targetBounds: Rect | null
  paddedVisibleBounds: Rect
  allTargetsVisible: boolean
  limitingAxis: LimitingAxis
  config: ResolvedCameraConfig
}

export interface CameraController {
  readonly pose: CameraPose
  update(targets: readonly Rect[], deltaSeconds: number): CameraPose
  snap(targets: readonly Rect[]): CameraPose
  resize(viewport: Size): CameraPose
  reset(pose?: Partial<Pick<CameraPose, 'centerX' | 'centerY' | 'zoom'>>): CameraPose
  inspect(): CameraSnapshot
}

export interface TraceSample {
  /** Milliseconds since the beginning of the trace. */
  at: number
  targets: readonly IdentifiedRect[]
}

export interface TraceAssertions {
  /** Fail whenever a target is outside the padded visible bounds. */
  targetsVisible?: boolean
  /** Maximum absolute zoom change between fixed simulation steps. */
  maxZoomDelta?: number
}

export interface CameraTrace {
  config: CameraConfig
  samples: readonly TraceSample[]
  assertions?: TraceAssertions
}

export interface TraceFailure {
  at: number
  code: 'target-outside-safe-area' | 'zoom-delta-exceeded'
  message: string
  targetId?: string
  actual?: number
  expected?: number
}

export interface TraceFrame {
  at: number
  pose: CameraPose
  allTargetsVisible: boolean
}

export interface TraceReport {
  ok: boolean
  fixedStepMs: number
  durationMs: number
  frames: readonly TraceFrame[]
  failures: readonly TraceFailure[]
}

export interface TraceRunOptions {
  fixedStepMs?: number
}
