import { Game } from './game/Game';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
        throw new Error('Canvas element not found');
    }

    // Initialize and start the game
    const game = new Game(canvas);
    game.start();
}); 