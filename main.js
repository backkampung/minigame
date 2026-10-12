document.addEventListener('DOMContentLoaded', () => {
    const games = {
        '2048': new Game2048(),
        Snake: new SnakeGame(),
        Tetris: new TetrisGame(),
        Chess: window.ChessGame ? new window.ChessGame() : null
    };
    const selector = document.getElementById('game-selector');
    const container = document.getElementById('game-container');
    const board = document.getElementById('game-board');
    const title = document.getElementById('game-title');
    const status = document.getElementById('game-status');
    const tetrisControls = document.getElementById('tetris-controls');
    const chessSetup = document.getElementById('chess-setup');
    const chessPlayers = document.getElementById('chess-players');
    const gameHeader = document.querySelector('.game-header');
    const chessMoveList = document.getElementById('chess-move-list');
    const scoreGroup = document.querySelector('.score-group:not(.chess-players)');
    const gameControls = document.querySelector('.game-controls');
    const difficulty = document.getElementById('chess-difficulty');
    let currentGame = null;
    let currentId = null;

    function stopCurrentGame() {
        if (currentGame && typeof currentGame.cleanup === 'function') currentGame.cleanup();
        currentGame = null;
        currentId = null;
        board.replaceChildren();
        board.classList.remove('tetris-board', 'chess-board');
        board.classList.remove('hidden');
        board.setAttribute('aria-label', 'Game board');
        tetrisControls.classList.add('hidden');
        chessSetup.classList.add('hidden');
        chessPlayers.classList.add('hidden');
        gameHeader.classList.remove('chess-layout');
        chessMoveList.classList.add('hidden');
        scoreGroup.classList.remove('hidden');
        gameControls.classList.remove('hidden');
        document.getElementById('restart-button').classList.remove('hidden');
        document.getElementById('score').textContent = '0';
        document.getElementById('best-score').textContent = '0';
    }

    function startGame(id) {
        stopCurrentGame();
        currentId = id;
        currentGame = games[id];
        selector.classList.add('hidden');
        container.classList.remove('hidden');
        title.textContent = id;
        document.getElementById('restart-button').textContent = 'New game';
        tetrisControls.classList.toggle('hidden', id !== 'Tetris');
        if (id === '2048') games['2048'].init();
        else if (id === 'Snake') games.Snake.start();
        else if (id === 'Tetris') games.Tetris.start();
    }

    function openChessSetup() {
        stopCurrentGame();
        currentId = 'Chess';
        currentGame = games.Chess;
        selector.classList.add('hidden');
        container.classList.remove('hidden');
        title.textContent = 'Human vs Machine';
        gameHeader.classList.add('chess-layout');
        scoreGroup.classList.add('hidden');
        chessPlayers.classList.remove('hidden');
        chessSetup.classList.remove('hidden');
        board.classList.add('hidden');
        gameControls.classList.add('hidden');
        status.textContent = 'Choose Charlie’s difficulty, then start a match.';
        document.getElementById('human-turn-state').textContent = 'Ready';
        document.getElementById('machine-turn-state').textContent = 'Ready';
        const startButton = document.getElementById('start-chess');
        startButton.disabled = !games.Chess;
        if (!games.Chess) status.textContent = 'Chess failed to load. Please refresh the page, or go back and choose another game.';
    }

    document.getElementById('game-2048').addEventListener('click', () => startGame('2048'));
    document.getElementById('game-snake').addEventListener('click', () => startGame('Snake'));
    document.getElementById('game-tetris').addEventListener('click', () => startGame('Tetris'));
    document.getElementById('game-chess').addEventListener('click', openChessSetup);
    document.getElementById('start-chess').addEventListener('click', () => {
        if (!games.Chess) return;
        chessGameStart();
    });
    function chessGameStart() {
        chessSetup.classList.add('hidden');
        board.classList.remove('hidden');
        gameControls.classList.remove('hidden');
        document.getElementById('restart-button').classList.remove('hidden');
        games.Chess.startMatch(difficulty.value);
    }

    document.getElementById('restart-button').addEventListener('click', () => {
        if (currentId === 'Chess') chessGameStart();
        else if (currentId) startGame(currentId);
    });
    document.getElementById('back-button').addEventListener('click', () => {
        stopCurrentGame();
        container.classList.add('hidden');
        selector.classList.remove('hidden');
        status.textContent = 'Choose a game to play.';
    });
});
