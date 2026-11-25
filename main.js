document.addEventListener('DOMContentLoaded', () => {
    const games = {
        '2048': new Game2048(),
        Snake: new SnakeGame(),
        Tetris: new TetrisGame(),
        Chess: null,
        Xiangqi: null
    };

    // chess.js is an ES module with top-level await, so it may finish loading
    // after DOMContentLoaded. Create the chess game lazily instead of once at startup.
    function getChess() {
        if (!games.Chess && window.ChessGame) games.Chess = new window.ChessGame();
        return games.Chess;
    }

    // xiangqi.js is an ES module with top-level await, so it may finish loading
    // after DOMContentLoaded. Create the Xiangqi game lazily instead of once at startup.
    function getXiangqi() {
        if (!games.Xiangqi && window.XiangqiGame) games.Xiangqi = new window.XiangqiGame();
        return games.Xiangqi;
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
    const xiangqiSetup = document.getElementById('xiangqi-setup');
    const xiangqiPlayers = document.getElementById('xiangqi-players');
    const xiangqiMoveList = document.getElementById('xiangqi-move-list');
    const scoreGroup = document.querySelector('.score-group:not(.chess-players)');
    const gameControls = document.querySelector('.game-controls');
    const difficulty = document.getElementById('chess-difficulty');
    const xiangqiDifficulty = document.getElementById('xiangqi-difficulty');
    let currentGame = null;
    let currentId = null;

    function stopCurrentGame() {
        if (currentGame && typeof currentGame.cleanup === 'function') currentGame.cleanup();
        currentGame = null;
        currentId = null;
        board.replaceChildren();
        board.classList.remove('tetris-board', 'chess-board', 'xiangqi-board');
        board.classList.remove('hidden');
        board.setAttribute('aria-label', 'Game board');
        document.body.classList.remove('tetris-active');
        document.body.classList.remove('game-active');
        tetrisControls.classList.add('hidden');
        chessSetup.classList.add('hidden');
        chessPlayers.classList.add('hidden');
        gameHeader.classList.remove('chess-layout');
        chessMoveList.classList.add('hidden');
        xiangqiSetup.classList.add('hidden');
        xiangqiPlayers.classList.add('hidden');
        gameHeader.classList.remove('xiangqi-layout');
        xiangqiMoveList.classList.add('hidden');
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
        document.body.classList.add('game-active');
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
        document.body.classList.add('game-active');
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

    function openXiangqiSetup() {
        stopCurrentGame();
        currentId = 'Xiangqi';
        currentGame = getXiangqi();
        selector.classList.add('hidden');
        container.classList.remove('hidden');
        title.textContent = 'Human vs Machine';
        gameHeader.classList.add('xiangqi-layout');
        scoreGroup.classList.add('hidden');
        xiangqiPlayers.classList.remove('hidden');
        xiangqiSetup.classList.remove('hidden');
        document.body.classList.add('game-active');
        board.classList.add('hidden');
        gameControls.classList.add('hidden');
        status.textContent = 'Choose Charlie’s difficulty, then start a match.';
        document.getElementById('xiangqi-human-turn-state').textContent = 'Ready';
        document.getElementById('xiangqi-machine-turn-state').textContent = 'Ready';
        refreshXiangqiSetup();
    }

    function refreshXiangqiSetup() {
        if (currentId !== 'Xiangqi') return;
        const startButton = document.getElementById('start-xiangqi');
        if (getXiangqi()) {
            startButton.disabled = false;
            if (!board.classList.contains('xiangqi-board')) status.textContent = 'Choose Charlie’s difficulty, then start a match.';
        } else if (window.xiangqiLibraryError) {
            startButton.disabled = true;
            status.textContent = 'Xiangqi failed to load. Please refresh the page, or go back and choose another game.';
        } else {
            startButton.disabled = true;
            status.textContent = 'Loading the Xiangqi engine…';
        }
    }

    window.addEventListener('xiangqi-game-ready', refreshXiangqiSetup);
    window.addEventListener('xiangqi-game-load-error', refreshXiangqiSetup);

    document.getElementById('game-2048').addEventListener('click', () => startGame('2048'));
    document.getElementById('game-snake').addEventListener('click', () => startGame('Snake'));
    document.getElementById('game-tetris').addEventListener('click', () => startGame('Tetris'));
    document.getElementById('game-chess').addEventListener('click', openChessSetup);
    document.getElementById('game-xiangqi').addEventListener('click', openXiangqiSetup);
    document.getElementById('start-chess').addEventListener('click', () => {
        if (!getChess()) return;
        chessGameStart();
    });
    document.getElementById('start-xiangqi').addEventListener('click', () => {
        if (!getXiangqi()) return;
        xiangqiGameStart();
    });
    function chessGameStart() {
        chessSetup.classList.add('hidden');
        board.classList.remove('hidden');
        gameControls.classList.remove('hidden');
        document.getElementById('restart-button').classList.remove('hidden');
        getChess().startMatch(difficulty.value);
    }

    function xiangqiGameStart() {
        xiangqiSetup.classList.add('hidden');
        board.classList.remove('hidden');
        gameControls.classList.remove('hidden');
        document.getElementById('restart-button').classList.remove('hidden');
        getXiangqi().startMatch(xiangqiDifficulty.value);
    }

    document.getElementById('restart-button').addEventListener('click', () => {
        if (currentId === 'Chess') chessGameStart();
        else if (currentId === 'Xiangqi') xiangqiGameStart();
        else if (currentId) startGame(currentId);
    });
    document.getElementById('back-button').addEventListener('click', () => {
        stopCurrentGame();
        container.classList.add('hidden');
        selector.classList.remove('hidden');
        status.textContent = 'Choose a game to play.';
    });
});
