import { DEMO, GAME } from './constants.js';

export function setupInput(game, camera, demo) {
  const dialog = document.getElementById('info-dialog');

  function showHelp() {
    if (dialog) dialog.showModal();
  }

  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (game.status === DEMO) {
          game.initGameMode();
          demo.reset();
        } else {
          game.initDemoMode();
          demo.reset();
        }
        break;

      case 'Digit1':
      case 'Numpad1':
        e.preventDefault();
        if (game.status === GAME) game.selecting(0);
        else game.increaseLevel();
        break;

      case 'Digit2':
      case 'Numpad2':
        e.preventDefault();
        if (game.status === GAME) game.selecting(1);
        else game.decreaseLevel();
        break;

      case 'Digit3':
      case 'Numpad3':
        e.preventDefault();
        if (game.status === GAME) game.selecting(2);
        else showHelp();
        break;

      case 'ArrowLeft':
        e.preventDefault();
        camera.panLeft();
        break;

      case 'ArrowRight':
        e.preventDefault();
        camera.panRight();
        break;

      case 'ArrowUp':
        e.preventDefault();
        game.increaseSpeed();
        break;

      case 'ArrowDown':
        e.preventDefault();
        game.decreaseSpeed();
        break;
    }
  });
}
