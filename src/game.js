import {
  DEMO, GAME, COMPLETE,
  DEMO_STEPPING, GAME_STEPPING,
  STEPPING_MIN, STEPPING_MAX, STEPPING_DELTA,
} from './constants.js';

export class Game {
  constructor() {
    // 3 towers × 20 slots; value = disk size (1..level), 0 = empty
    this.hanoi = [
      new Int32Array(20),
      new Int32Array(20),
      new Int32Array(20),
    ];
    this.level    = 7;
    this.status   = DEMO;
    this.stepping = DEMO_STEPPING;

    // Currently animating disk (0 = none)
    this.movingDisk = 0;

    // Source/destination columns for the next move
    this.startCol  = 0;
    this.finishCol = 0;

    // Selected disk in game mode (0 = none)
    this.selectDisk   = 0;
    this.selectCol    = -1; // which tower was clicked first

    // UI text
    this.text      = '';
    this.textColor = 6; // index into COLORS

    // Victory animation tick counter
    this.victoryTick = 0;
  }

  // ─── Initialization ────────────────────────────────────────────────────────

  initDemoMode() {
    this.status = DEMO;
    this.stepping = DEMO_STEPPING;
    this._resetBoard();
    this.movingDisk  = 0;
    this.startCol    = 0;
    this.finishCol   = 0;
    this.selectDisk  = 0;
    this.victoryTick = 0;
    this.text      = '1-БОЛЬШЕ  2-МЕНЬШЕ  3-СПРАВКА / ДЛЯ ИГРЫ НАЖМИТЕ ПРОБЕЛ';
    this.textColor = 6;
  }

  initGameMode() {
    this.status = GAME;
    this.stepping = GAME_STEPPING;
    this._resetBoard();
    this.movingDisk  = 0;
    this.startCol    = 0;
    this.finishCol   = 0;
    this.selectDisk  = 0;
    this.victoryTick = 0;
    this.text      = '   1           2           3 / ДЛЯ ДЕМО НАЖМИТЕ ПРОБЕЛ';
    this.textColor = 2;
  }

  _resetBoard() {
    for (let t = 0; t < 3; t++) this.hanoi[t].fill(0);
    // Stack all disks on tower 0, largest at bottom
    for (let i = 0; i < this.level; i++) {
      this.hanoi[0][i] = this.level - i;
    }
  }

  // ─── Board helpers ─────────────────────────────────────────────────────────

  // Row of the topmost disk on a tower (-1 if empty)
  topRowOf(col) {
    for (let i = this.level - 1; i >= 0; i--) {
      if (this.hanoi[col][i] !== 0) return i;
    }
    return -1;
  }

  // First empty row on a tower
  emptyRowOf(col) {
    for (let i = 0; i < this.level; i++) {
      if (this.hanoi[col][i] === 0) return i;
    }
    return this.level; // full (shouldn't happen in valid play)
  }

  // ─── Play mode interaction ─────────────────────────────────────────────────

  // Called when player presses 1/2/3 (place = 0/1/2)
  selecting(place) {
    if (this.status !== GAME || this.movingDisk !== 0) return;

    if (this.selectDisk === 0) {
      // First click — select the top disk of this tower
      const row = this.topRowOf(place);
      if (row < 0) return; // empty tower, ignore
      this.selectDisk = this.hanoi[place][row];
      this.selectCol  = place;
    } else {
      // Second click — try to move the selected disk here
      if (place === this.selectCol) {
        // Same tower: deselect
        this.selectDisk = 0;
        this.selectCol  = -1;
        return;
      }

      const topRow  = this.topRowOf(place);
      const topDisk = topRow >= 0 ? this.hanoi[place][topRow] : 0;

      // Valid if destination is empty or has a larger disk on top
      if (topDisk === 0 || topDisk > this.selectDisk) {
        this.startCol  = this.selectCol;
        this.finishCol = place;
        // movingDisk will be set by animation.beginMove()
      }
      this.selectDisk = 0;
      this.selectCol  = -1;
    }
  }

  // ─── Victory ──────────────────────────────────────────────────────────────

  checkVictory() {
    if (this.status !== GAME) return;
    // All disks on tower 2, largest at bottom
    if (this.hanoi[2][this.level - 1] !== 0) {
      this.status    = COMPLETE;
      this.text      = 'ПОЗДРАВЛЯЕМ! ВЫ СПРАВИЛИСЬ!';
      this.textColor = 0;
    }
  }

  // ─── Speed / level controls ────────────────────────────────────────────────

  increaseSpeed() {
    this.stepping = Math.min(this.stepping + STEPPING_DELTA, STEPPING_MAX);
  }

  decreaseSpeed() {
    this.stepping = Math.max(this.stepping - STEPPING_DELTA, STEPPING_MIN);
  }

  increaseLevel() {
    if (this.level < 16) { this.level++; this.initDemoMode(); }
  }

  decreaseLevel() {
    if (this.level > 3) { this.level--; this.initDemoMode(); }
  }
}
