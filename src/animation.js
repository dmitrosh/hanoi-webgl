import { DISK_HEIGHT, Y_MAX, TOWER_X } from './constants.js';

export class Animation {
  constructor() {
    // Parabolic arc parameters
    this.x1 = 0; this.y1 = 0;
    this.x2 = 0; this.y2 = 0;
    this.x  = 0; this.y  = 0;
    this.xMax = 0; this.k = 0;
    this.direction  = 0; // sign of horizontal travel
    this.startRow   = -1;
    this.finishRow  = -1;

    // Selected disk spin (degrees, increments each tick)
    this.selectRotation = 0;
  }

  // Initiate a disk move. Removes disk from source tower.
  beginMove(game) {
    const { startCol, finishCol } = game;
    this.startRow  = game.topRowOf(startCol);
    this.finishRow = game.emptyRowOf(finishCol);

    this.x1 = TOWER_X[startCol];
    this.y1 = this.startRow * DISK_HEIGHT;
    this.x2 = TOWER_X[finishCol];
    this.y2 = this.finishRow * DISK_HEIGHT;

    const dy1 = Y_MAX - this.y1;
    const dy2 = Y_MAX - this.y2;

    // Exact port of C++ parabola midpoint formula
    this.xMax = ((this.x2 - this.x1) * dy1) /
                (dy1 + Math.sqrt(dy2) * Math.sqrt(dy1)) + this.x1;
    this.k    = dy1 / ((this.xMax - this.x1) ** 2);

    this.x = this.x1;
    this.y = this.y1;
    this.direction = Math.sign(finishCol - startCol) || 1;

    // Pick up the disk
    game.movingDisk = game.hanoi[startCol][this.startRow];
    game.hanoi[startCol][this.startRow] = 0;
  }

  // Advance one logic tick while a disk is in flight.
  tick(game) {
    const { stepping } = game;

    // Landing check: horizontal position has crossed x2
    if ((this.x1 - this.x) * (this.x2 - this.x) <= 0) {
      // Still in flight
      this.x += stepping * this.direction;
      this.y  = Y_MAX - this.k * (this.x - this.xMax) ** 2;
    } else {
      // Landed — snap to destination
      this.x = this.x2;
      this.y = this.y2;
      game.hanoi[game.finishCol][this.finishRow] = game.movingDisk;
      game.movingDisk = 0;
      game.startCol   = game.finishCol;
      this.direction  = 0;
    }
  }

  getCurrentPos() {
    return { x: this.x, y: this.y };
  }

  tickSelectRotation() {
    this.selectRotation = (this.selectRotation + 25) % 360;
  }

  resetSelectRotation() {
    this.selectRotation = 0;
  }
}
