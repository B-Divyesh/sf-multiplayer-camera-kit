import { CameraInputError } from './errors'
import type {
  CameraConfig,
  CameraPose,
  LimitingAxis,
  Padding,
  Rect,
  ResolvedCameraConfig,
  Size,
} from './types'

const EPSILON = 1e-9

export function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new CameraInputError(`${label} must be a finite number; received ${String(value)}`)
  }
}

export function validateSize(size: Size, label: string): Size {
  assertFinite(size.width, `${label}.width`)
  assertFinite(size.height, `${label}.height`)
  if (size.width <= 0 || size.height <= 0) {
    throw new CameraInputError(`${label} width and height must be greater than 0`)
  }
  return { width: size.width, height: size.height }
}

export function validateRect(rect: Rect, label: string): Rect {
  assertFinite(rect.x, `${label}.x`)
  assertFinite(rect.y, `${label}.y`)
  assertFinite(rect.width, `${label}.width`)
  assertFinite(rect.height, `${label}.height`)
  if (rect.width < 0 || rect.height < 0) {
    throw new CameraInputError(`${label} width and height cannot be negative`)
  }
  return rect.id === undefined
    ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    : { id: rect.id, x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

function resolvePadding(input: CameraConfig['padding']): Padding {
  if (typeof input === 'number') {
    assertFinite(input, 'padding')
    if (input < 0) throw new CameraInputError('padding cannot be negative')
    return { top: input, right: input, bottom: input, left: input }
  }
  const padding = {
    top: input?.top ?? 64,
    right: input?.right ?? 64,
    bottom: input?.bottom ?? 64,
    left: input?.left ?? 64,
  }
  for (const [side, value] of Object.entries(padding)) {
    assertFinite(value, `padding.${side}`)
    if (value < 0) throw new CameraInputError(`padding.${side} cannot be negative`)
  }
  return padding
}

export function resolveConfig(config: CameraConfig): ResolvedCameraConfig {
  const viewport = validateSize(config.viewport, 'viewport')
  const world = validateRect(config.world, 'world')
  if (world.width <= 0 || world.height <= 0) {
    throw new CameraInputError('world width and height must be greater than 0')
  }
  const padding = resolvePadding(config.padding)
  if (padding.left + padding.right >= viewport.width || padding.top + padding.bottom >= viewport.height) {
    throw new CameraInputError('padding must leave a positive safe area inside the viewport')
  }
  const minZoom = config.minZoom ?? 0.25
  const maxZoom = config.maxZoom ?? 2
  const damping = config.damping ?? 8
  assertFinite(minZoom, 'minZoom')
  assertFinite(maxZoom, 'maxZoom')
  assertFinite(damping, 'damping')
  if (minZoom <= 0 || maxZoom <= 0 || minZoom > maxZoom) {
    throw new CameraInputError('zoom limits must satisfy 0 < minZoom <= maxZoom')
  }
  if (damping < 0) throw new CameraInputError('damping cannot be negative')
  return { viewport, world, padding, minZoom, maxZoom, damping }
}

export function boundsOf(targets: readonly Rect[]): Rect | null {
  if (targets.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  targets.forEach((rawTarget, index) => {
    const target = validateRect(rawTarget, `targets[${index}]`)
    minX = Math.min(minX, target.x)
    minY = Math.min(minY, target.y)
    maxX = Math.max(maxX, target.x + target.width)
    maxY = Math.max(maxY, target.y + target.height)
  })
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function clampedAxisPosition(center: number, visible: number, worldStart: number, worldSize: number): number {
  if (visible >= worldSize) return worldStart + (worldSize - visible) / 2
  return clamp(center - visible / 2, worldStart, worldStart + worldSize - visible)
}

export function poseFromCenter(centerX: number, centerY: number, zoom: number, config: ResolvedCameraConfig): CameraPose {
  const safeZoom = clamp(zoom, config.minZoom, config.maxZoom)
  const visibleWidth = config.viewport.width / safeZoom
  const visibleHeight = config.viewport.height / safeZoom
  const x = clampedAxisPosition(centerX, visibleWidth, config.world.x, config.world.width)
  const y = clampedAxisPosition(centerY, visibleHeight, config.world.y, config.world.height)
  return {
    x,
    y,
    centerX: x + visibleWidth / 2,
    centerY: y + visibleHeight / 2,
    zoom: safeZoom,
    visibleWidth,
    visibleHeight,
  }
}

export function restingPose(config: ResolvedCameraConfig): CameraPose {
  return poseFromCenter(
    config.world.x + config.world.width / 2,
    config.world.y + config.world.height / 2,
    config.maxZoom,
    config,
  )
}

export function desiredPoseForBounds(
  bounds: Rect,
  config: ResolvedCameraConfig,
): { pose: CameraPose; limitingAxis: LimitingAxis } {
  const availableWidth = config.viewport.width - config.padding.left - config.padding.right
  const availableHeight = config.viewport.height - config.padding.top - config.padding.bottom
  const zoomForWidth = bounds.width <= EPSILON ? Infinity : availableWidth / bounds.width
  const zoomForHeight = bounds.height <= EPSILON ? Infinity : availableHeight / bounds.height
  const fitZoom = Math.min(zoomForWidth, zoomForHeight)
  const rawZoom = Number.isFinite(fitZoom) ? fitZoom : config.maxZoom
  const zoom = clamp(rawZoom, config.minZoom, config.maxZoom)
  let limitingAxis: LimitingAxis
  if (rawZoom < config.minZoom) limitingAxis = 'minZoom'
  else if (rawZoom > config.maxZoom || !Number.isFinite(fitZoom)) limitingAxis = 'maxZoom'
  else limitingAxis = zoomForWidth <= zoomForHeight ? 'width' : 'height'
  const centerX = bounds.x + bounds.width / 2 + (config.padding.right - config.padding.left) / (2 * zoom)
  const centerY = bounds.y + bounds.height / 2 + (config.padding.bottom - config.padding.top) / (2 * zoom)
  return { pose: poseFromCenter(centerX, centerY, zoom, config), limitingAxis }
}

export function paddedVisibleBounds(pose: CameraPose, config: ResolvedCameraConfig): Rect {
  return {
    x: pose.x + config.padding.left / pose.zoom,
    y: pose.y + config.padding.top / pose.zoom,
    width: pose.visibleWidth - (config.padding.left + config.padding.right) / pose.zoom,
    height: pose.visibleHeight - (config.padding.top + config.padding.bottom) / pose.zoom,
  }
}

export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x - EPSILON &&
    inner.y >= outer.y - EPSILON &&
    inner.x + inner.width <= outer.x + outer.width + EPSILON &&
    inner.y + inner.height <= outer.y + outer.height + EPSILON
  )
}
