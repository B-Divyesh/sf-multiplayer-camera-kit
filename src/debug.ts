import type { CameraSnapshot, Point, Rect } from './types'

export interface DebugCanvasContext {
  strokeStyle: string | CanvasGradient | CanvasPattern
  fillStyle: string | CanvasGradient | CanvasPattern
  lineWidth: number
  font: string
  save(): void
  restore(): void
  beginPath(): void
  rect(x: number, y: number, width: number, height: number): void
  stroke(): void
  fill(): void
  fillText(text: string, x: number, y: number): void
  setLineDash?(segments: number[]): void
}

export interface DebugOverlayOptions {
  worldToScreen?: (point: Point) => Point
  cameraColor?: string
  safetyColor?: string
  targetColor?: string
  labelColor?: string
  showLabels?: boolean
}

function drawRect(context: DebugCanvasContext, rect: Rect, map: (point: Point) => Point): void {
  const topLeft = map({ x: rect.x, y: rect.y })
  const bottomRight = map({ x: rect.x + rect.width, y: rect.y + rect.height })
  context.beginPath()
  context.rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y)
  context.stroke()
}

/** Draws camera, safety, and target bounds without mutating camera state. */
export function drawDebugOverlay(
  context: DebugCanvasContext,
  snapshot: CameraSnapshot,
  options: DebugOverlayOptions = {},
): void {
  const map = options.worldToScreen ?? ((point: Point) => point)
  context.save()
  context.lineWidth = 2

  context.strokeStyle = options.cameraColor ?? '#88b7a9'
  context.setLineDash?.([8, 6])
  drawRect(
    context,
    {
      x: snapshot.pose.x,
      y: snapshot.pose.y,
      width: snapshot.pose.visibleWidth,
      height: snapshot.pose.visibleHeight,
    },
    map,
  )

  context.strokeStyle = options.safetyColor ?? '#b83620'
  context.setLineDash?.([])
  drawRect(context, snapshot.paddedVisibleBounds, map)

  context.strokeStyle = options.targetColor ?? '#b78938'
  context.fillStyle = options.labelColor ?? '#fff8e8'
  context.setLineDash?.([3, 3])
  snapshot.targets.forEach((target, index) => {
    drawRect(context, target, map)
    if (options.showLabels !== false) {
      const topLeft = map({ x: target.x, y: target.y })
      context.font = '12px monospace'
      context.fillText(target.id ?? `target-${index + 1}`, topLeft.x + 4, topLeft.y + 14)
    }
  })

  context.restore()
}
