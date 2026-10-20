document.addEventListener('DOMContentLoaded', () => {
    const games = {
        '2048': new Game2048(),
        Snake: new SnakeGame(),
        Tetris: new TetrisGame(),
        Chess: null
    };

    // chess.js is an ES module with top-level await, so it may finish loading
    // after DOMContentLoaded. Create the chess game lazily instead of once at startup.
    function getChess() {
        if (!games.Chess && window.ChessGame) games.Chess = new window.ChessGame();
        return games.Chess;
    }
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
        document.body.classList.remove('tetris-active');
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
        document.body.classList.toggle('tetris-active', id === 'Tetris');
        if (id === '2048') games['2048'].init();
        else if (id === 'Snake') games.Snake.start();
        else if (id === 'Tetris') games.Tetris.start();
    }

    function openChessSetup() {
        stopCurrentGame();
        currentId = 'Chess';
        currentGame = getChess();
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
        refreshChessSetup();
    }

    function refreshChessSetup() {
        if (currentId !== 'Chess') return;
        const startButton = document.getElementById('start-chess');
        if (getChess()) {
            currentGame = games.Chess;
            startButton.disabled = false;
            if (!board.classList.contains('chess-board')) status.textContent = 'Choose Charlie’s difficulty, then start a match.';
        } else if (window.chessLibraryError) {
            startButton.disabled = true;
            status.textContent = 'Chess failed to load. Please refresh the page, or go back and choose another game.';
        } else {
            startButton.disabled = true;
            status.textContent = 'Loading the chess engine…';
        }
    }

    window.addEventListener('chess-game-ready', refreshChessSetup);
    window.addEventListener('chess-game-load-error', refreshChessSetup);

    // If the module file itself fails to load, chess.js cannot dispatch its own
    // error event. Give the browser time for slower connections, then surface it.
    window.setTimeout(() => {
        if (!window.ChessGame && !window.chessLibraryError) {
            window.chessLibraryError = true;
            refreshChessSetup();
        }
    }, 12000);

    document.getElementById('game-2048').addEventListener('click', () => startGame('2048'));
    document.getElementById('game-snake').addEventListener('click', () => startGame('Snake'));
    document.getElementById('game-tetris').addEventListener('click', () => startGame('Tetris'));
    document.getElementById('game-chess').addEventListener('click', openChessSetup);
    document.getElementById('start-chess').addEventListener('click', () => {
        if (!getChess()) return;
        chessGameStart();
    });
    function chessGameStart() {
        const chessGame = getChess();
        if (!chessGame) return;
        currentGame = chessGame;
        chessSetup.classList.add('hidden');
        board.classList.remove('hidden');
        gameControls.classList.remove('hidden');
        document.getElementById('restart-button').classList.remove('hidden');
        chessGame.startMatch(difficulty.value);
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

