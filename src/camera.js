import { mat4 } from './math.js';
import { CAM_PAN_STEP, CAM_MIN_X, CAM_MAX_X, DEMO_CAM_MIN, DEMO_CAM_MAX } from './constants.js';

export class Camera {
  constructor() {
    this.lookXPos = 1.0; // matches C++ default
    this._shiftCam = 1;  // direction of demo camera movement: +1 or -1
    this._viewMatrix = new Float32Array(16);
  }

  // Arrow key panning (both modes)
  panLeft() {
    if (this.lookXPos < CAM_MAX_X) this.lookXPos += CAM_PAN_STEP;
  }

  panRight() {
    if (this.lookXPos > CAM_MIN_X) this.lookXPos -= CAM_PAN_STEP;
  }

  // Smooth nudge back to default position in game mode
  nudgeTowardCenter() {
    this.lookXPos += (1.0 - this.lookXPos) * 0.03;
  }

  // Demo mode: bounce camera between DEMO_CAM_MIN and DEMO_CAM_MAX
  animateTick() {
    this.lookXPos += this._shiftCam * 0.07;
    if (this.lookXPos >= DEMO_CAM_MAX) this._shiftCam = -1;
    if (this.lookXPos <= DEMO_CAM_MIN) this._shiftCam = +1;
  }

  getEyePosition() {
    const x = this.lookXPos;
    return [
      x,
      4 + (x - 1) * (x - 1) * 0.007,
      10 - Math.abs(x - 4) * 0.4,
    ];
  }

  getViewMatrix() {
    const eye    = this.getEyePosition();
    const center = [4, 0, 0];
    const up     = [0, 1, 0];
    mat4.lookAt(this._viewMatrix, eye, center, up);
    return this._viewMatrix;
  }
}
