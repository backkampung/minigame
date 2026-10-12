document.addEventListener('DOMContentLoaded', () => {
    const game2048 = new Game2048();
    const snakeGame = new SnakeGame();
    const selector = document.getElementById('game-selector');
    const container = document.getElementById('game-container');
    const board = document.getElementById('game-board');
    const title = document.getElementById('game-title');
    const status = document.getElementById('game-status');
    let currentGame = null;
    let currentId = null;

    function stopCurrentGame() {
        if (currentGame) currentGame.cleanup();
        currentGame = null;
        currentId = null;
        board.replaceChildren();
        document.getElementById('score').textContent = '0';
        document.getElementById('best-score').textContent = '0';
    }

    function startGame(id) {
        stopCurrentGame();
        currentId = id;
        currentGame = id === '2048' ? game2048 : snakeGame;
        selector.classList.add('hidden');
        container.classList.remove('hidden');
        title.textContent = id;
        document.getElementById('restart-button').textContent = 'New game';
        if (id === '2048') game2048.init();
        else snakeGame.start();
    }

    document.getElementById('game-2048').addEventListener('click', () => startGame('2048'));
    document.getElementById('game-snake').addEventListener('click', () => startGame('Snake'));
    document.getElementById('restart-button').addEventListener('click', () => {
        if (currentId) startGame(currentId);
    });
    document.getElementById('back-button').addEventListener('click', () => {
        stopCurrentGame();
        container.classList.add('hidden');
        selector.classList.remove('hidden');
        status.textContent = 'Choose a game to play.';
    });
});
