import { Renderer }     from './renderer.js';
import { TextRenderer } from './text.js';
import { Game }         from './game.js';
import { Camera }       from './camera.js';
import { Animation }    from './animation.js';
import { Demo }         from './demo.js';
import { setupInput }   from './input.js';
import { DEMO, GAME, COMPLETE, DISK_HEIGHT, TOWER_X, VICTORY_TICKS, COLORS } from './constants.js';

// ─── Initialization ──────────────────────────────────────────────────────────

const canvas   = document.getElementById('canvas');
const game     = new Game();
const camera   = new Camera();
const anim     = new Animation();
const demo     = new Demo();
const renderer = new Renderer(canvas);
renderer.init();

const text = new TextRenderer(renderer.gl);

setupInput(game, camera, demo);

game.initDemoMode();
demo.reset();
text.updateText(game.text, game.textColor);

// ─── Game loop (fixed 50 fps ticks = 20 ms) ──────────────────────────────────

const TICK_MS = 20;
let lastTime    = 0;
let accumulator = 0;

// Track text changes to avoid re-uploading every frame
let prevText      = game.text;
let prevTextColor = game.textColor;

function update() {
  // Camera snap in game/complete mode
  if (game.status !== DEMO && Math.abs(1 - camera.lookXPos) > 0.01) {
    camera.nudgeTowardCenter();
  }

  // Advance in-flight disk
  if (game.movingDisk !== 0) {
    anim.tick(game);
  }

  // No disk in flight
  if (game.movingDisk === 0) {
    if (game.status === GAME) {
      game.checkVictory();
    }

    if (game.status === COMPLETE) {
      game.victoryTick++;
      // Cycle text color every 6 ticks (matching C++ visual)
      const newColor = Math.floor(game.victoryTick / 6) % COLORS.length;
      if (newColor !== game.textColor) game.textColor = newColor;
      // Auto-reset to demo after VICTORY_TICKS
      if (game.victoryTick >= VICTORY_TICKS) {
        game.initDemoMode();
        demo.reset();
      }
    }

    if (game.status === DEMO) {
      demo.tick(game, camera);
    }

    // Initiate move if columns differ
    if (game.startCol !== game.finishCol && game.movingDisk === 0) {
      anim.beginMove(game);
    }
  }

  // Spin selected disk
  if (game.selectDisk !== 0) {
    anim.tickSelectRotation();
  } else {
    anim.resetSelectRotation();
  }
}

function render() {
  // Lazy text texture update
  if (game.text !== prevText || game.textColor !== prevTextColor) {
    text.updateText(game.text, game.textColor);
    prevText      = game.text;
    prevTextColor = game.textColor;
  }

  renderer.beginFrame(camera);

  // Floor
  renderer.drawFloor();

  // Pegs and stacked disks
  for (let t = 0; t < 3; t++) {
    renderer.drawPeg(t);
    for (let row = 0; row < game.level; row++) {
      const d = game.hanoi[t][row];
      if (d === 0) break;
      const isSelected   = (d === game.selectDisk);
      const rotationDeg  = isSelected ? anim.selectRotation : 0;
      renderer.drawDisk(TOWER_X[t], row * DISK_HEIGHT, d, game.level, isSelected, rotationDeg);
    }
  }

  // Moving disk
  if (game.movingDisk !== 0) {
    const pos = anim.getCurrentPos();
    renderer.drawDisk(pos.x, pos.y, game.movingDisk, game.level, false, 0);
  }

  // Text overlay (3D quad in scene)
  text.render(renderer.projMatrix, renderer.viewMatrix);
}

function loop(timestamp) {
  const dt = Math.min(timestamp - lastTime, 100); // cap at 100ms to avoid spiral
  lastTime     = timestamp;
  accumulator += dt;

  while (accumulator >= TICK_MS) {
    update();
    accumulator -= TICK_MS;
  }

  render();
  requestAnimationFrame(loop);
}

// ─── Canvas resize — maintain 1.5:1 aspect ratio ────────────────────────────

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  // Fit inside viewport preserving 3:2 aspect
  let cw, ch;
  if (w / h > 1.5) {
    ch = h;
    cw = Math.floor(h * 1.5);
  } else {
    cw = w;
    ch = Math.floor(w / 1.5);
  }
  canvas.width  = cw;
  canvas.height = ch;
  renderer.gl.viewport(0, 0, cw, ch);
}

window.addEventListener('resize', resize);
resize();

requestAnimationFrame((ts) => { lastTime = ts; loop(ts); });
