import { CameraInputError } from './errors'
import {
  assertFinite,
  boundsOf,
  desiredPoseForBounds,
  paddedVisibleBounds,
  poseFromCenter,
  rectContains,
  resolveConfig,
  restingPose,
  validateRect,
  validateSize,
} from './math'
import type {
  CameraConfig,
  CameraController,
  CameraPose,
  CameraSnapshot,
  LimitingAxis,
  Rect,
  ResolvedCameraConfig,
  Size,
} from './types'

function clonePose(pose: CameraPose): CameraPose {
  return { ...pose }
}

function cloneTargets(targets: readonly Rect[]): Rect[] {
  return targets.map((target, index) => validateRect(target, `targets[${index}]`))
}

export function frameTargets(targets: readonly Rect[], config: CameraConfig): CameraPose {
  const resolved = resolveConfig(config)
  const targetBounds = boundsOf(targets)
  return targetBounds ? desiredPoseForBounds(targetBounds, resolved).pose : restingPose(resolved)
}

export function createCamera(inputConfig: CameraConfig): CameraController {
  let config = resolveConfig(inputConfig)
  let pose = restingPose(config)
  let desiredPose = pose
  let targets: Rect[] = []
  let targetBounds: Rect | null = null
  let limitingAxis: LimitingAxis = 'none'
  let initialized = false

  function setTargets(nextTargets: readonly Rect[]): void {
    targets = cloneTargets(nextTargets)
    targetBounds = boundsOf(targets)
    if (targetBounds) {
      const desired = desiredPoseForBounds(targetBounds, config)
      desiredPose = desired.pose
      limitingAxis = desired.limitingAxis
    } else {
      desiredPose = pose
      limitingAxis = 'none'
    }
  }

  function update(nextTargets: readonly Rect[], deltaSeconds: number): CameraPose {
    assertFinite(deltaSeconds, 'deltaSeconds')
    if (deltaSeconds < 0) throw new CameraInputError('deltaSeconds cannot be negative')
    setTargets(nextTargets)
    if (!targetBounds) return clonePose(pose)
    if (!initialized || config.damping === 0) {
      pose = desiredPose
      initialized = true
      return clonePose(pose)
    }
    const alpha = 1 - Math.exp(-config.damping * deltaSeconds)
    const centerX = pose.centerX + (desiredPose.centerX - pose.centerX) * alpha
    const centerY = pose.centerY + (desiredPose.centerY - pose.centerY) * alpha
    const zoom = pose.zoom + (desiredPose.zoom - pose.zoom) * alpha
    pose = poseFromCenter(centerX, centerY, zoom, config)
    return clonePose(pose)
  }

  function snap(nextTargets: readonly Rect[]): CameraPose {
    setTargets(nextTargets)
    if (targetBounds) pose = desiredPose
    initialized = true
    return clonePose(pose)
  }

  function resize(viewport: Size): CameraPose {
    config = resolveConfig({ ...config, viewport: validateSize(viewport, 'viewport') })
    if (targetBounds) {
      const desired = desiredPoseForBounds(targetBounds, config)
      desiredPose = desired.pose
      limitingAxis = desired.limitingAxis
      pose = poseFromCenter(pose.centerX, pose.centerY, pose.zoom, config)
    } else {
      pose = poseFromCenter(pose.centerX, pose.centerY, pose.zoom, config)
      desiredPose = pose
    }
    return clonePose(pose)
  }

  function reset(next?: Partial<Pick<CameraPose, 'centerX' | 'centerY' | 'zoom'>>): CameraPose {
    const rest = restingPose(config)
    const centerX = next?.centerX ?? rest.centerX
    const centerY = next?.centerY ?? rest.centerY
    const zoom = next?.zoom ?? rest.zoom
    assertFinite(centerX, 'pose.centerX')
    assertFinite(centerY, 'pose.centerY')
    assertFinite(zoom, 'pose.zoom')
    pose = poseFromCenter(centerX, centerY, zoom, config)
    desiredPose = pose
    targets = []
    targetBounds = null
    limitingAxis = 'none'
    initialized = false
    return clonePose(pose)
  }

  function inspect(): CameraSnapshot {
    const safeBounds = paddedVisibleBounds(pose, config)
    return {
      pose: clonePose(pose),
      desiredPose: clonePose(desiredPose),
      targets: cloneTargets(targets),
      targetBounds: targetBounds && { ...targetBounds },
      paddedVisibleBounds: safeBounds,
      allTargetsVisible: targets.every(target => rectContains(safeBounds, target)),
      limitingAxis,
      config: {
        ...config,
        viewport: { ...config.viewport },
        world: { ...config.world },
        padding: { ...config.padding },
      },
    }
  }

  return {
    get pose() {
      return clonePose(pose)
    },
    update,
    snap,
    resize,
    reset,
    inspect,
  }
}
