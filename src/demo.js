import { DEMO_PAUSE_TICKS } from './constants.js';

export class Demo {
  constructor() {
    this.demoMove   = 1;
    this._timerCount = 0;
  }

  reset() {
    this.demoMove   = 1;
    this._timerCount = 0;
  }

  // Returns true once the timer expires (after `n` ticks).
  // Calling with n=0 resets and returns true immediately.
  _timer(n) {
    if (n === 0) { this._timerCount = 0; return true; }
    if (this._timerCount === 0) { this._timerCount = n; }
    this._timerCount--;
    return this._timerCount === 0;
  }

  /**
   * Called each tick when status === DEMO and no disk is moving.
   * Mutates game.startCol / game.finishCol when a move is ready.
   * Also advances camera orbit.
   */
  tick(game, camera) {
    const level = game.level;

    // Pause at the start of each solution cycle
    if (this.demoMove % (1 << level) === 1) {
      if (!this._timer(DEMO_PAUSE_TICKS)) {
        camera.animateTick();
        return;
      }
    }

    // Only compute next move if no move is queued
    if (game.startCol === game.finishCol) {
      const move = this._computeNextMove(level, this.demoMove);
      if (move) {
        game.startCol  = move.startCol;
        game.finishCol = move.finishCol;
      }
      this.demoMove++;

      // Wrap at full cycle — reset board so next cycle starts fresh
      if (this.demoMove > (1 << level)) {
        this.demoMove = 1;
        this._timerCount = 0;
        game.initDemoMode();
      }
    }

    camera.animateTick();
  }

  // Bitwise iterative Towers of Hanoi algorithm — exact C++ port.
  _computeNextMove(level, demoMove) {
    for (let d = 1, n = 2; d <= level; d++, n *= 2) {
      if ((demoMove - n / 2) % n === 0) {
        const direction = 2 - (level - d) % 2;
        const raw       = Math.floor((demoMove - n / 2) / n) * direction;
        const startCol  = ((raw % 3) + 3) % 3;
        const finishCol = ((startCol + direction) % 3 + 3) % 3;
        return { startCol, finishCol };
      }
    }
    return null;
  }
}
