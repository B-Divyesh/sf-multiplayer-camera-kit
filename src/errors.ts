export class CameraInputError extends TypeError {
  readonly code = 'CAMERA_INPUT_ERROR'

  constructor(message: string) {
    super(message)
    this.name = 'CameraInputError'
  }
}
