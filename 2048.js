class Game2048 {
    constructor() {
        this.size = 4;
        this.board = [];
        this.score = 0;
        this.highScore = this.readHighScore();
        this.isActive = false;
        this.isAnimating = false;
        this.runId = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.keydownHandler = this.handleKeydown.bind(this);
        this.touchStartHandler = this.handleTouchStart.bind(this);
        this.touchEndHandler = this.handleTouchEnd.bind(this);
    }

    readHighScore() {
        try { return Number(localStorage.getItem('2048-highScore')) || 0; }
        catch { return 0; }
    }

    saveHighScore() {
        try { localStorage.setItem('2048-highScore', String(this.highScore)); }
        catch { /* The game still works when storage is unavailable. */ }
    }

    init() {
        this.cleanup();
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.score = 0;
        this.isAnimating = false;
        this.isActive = true;
        this.addNewTile();
        this.addNewTile();
        this.updateBoard();
        this.bindEvents();
        this.updateScores();
        this.updateStatus('Use the arrow keys or swipe the board. Reach 2048 to win.');
    }

    cleanup() {
        this.runId++;
        this.isActive = false;
        this.isAnimating = false;
        this.removeEvents();
    }

    addNewTile() {
        const empty = [];
        this.board.forEach((row, y) => row.forEach((value, x) => {
            if (value === 0) empty.push({ x, y });
        }));
        if (!empty.length) return;
        const { x, y } = empty[Math.floor(Math.random() * empty.length)];
        this.board[y][x] = Math.random() < 0.9 ? 2 : 4;
    }

    async move(direction) {
        if (!this.isActive || this.isAnimating || this.isGameOver()) return;
        const runId = this.runId;
        const before = this.board.map(row => row.join(',')).join(';');
        let gained = 0;
        const next = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        for (let i = 0; i < this.size; i++) {
            const values = [];
            for (let j = 0; j < this.size; j++) {
                const y = direction === 'up' || direction === 'down' ? j : i;
                const x = direction === 'left' || direction === 'right' ? j : i;
                values.push(this.board[y][x]);
            }
            if (direction === 'right' || direction === 'down') values.reverse();
            const compact = values.filter(Boolean);
            const merged = [];
            for (let j = 0; j < compact.length; j++) {
                if (compact[j] === compact[j + 1]) {
                    const value = compact[j] * 2;
                    merged.push(value);
                    gained += value;
                    j++;
                } else merged.push(compact[j]);
            }
            while (merged.length < this.size) merged.push(0);
            if (direction === 'right' || direction === 'down') merged.reverse();
            for (let j = 0; j < this.size; j++) {
                const y = direction === 'up' || direction === 'down' ? j : i;
                const x = direction === 'left' || direction === 'right' ? j : i;
                next[y][x] = merged[j];
            }
        }
        this.board = next;
        const after = this.board.map(row => row.join(',')).join(';');
        if (before === after) return;

        this.isAnimating = true;
        this.score += gained;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        this.addNewTile();
        this.updateBoard();
        this.updateScores();
        await new Promise(resolve => setTimeout(resolve, 120));
        // The player may have left or restarted the game during the animation delay.
        if (!this.isActive || runId !== this.runId) return;
        this.isAnimating = false;

        if (this.board.some(row => row.includes(2048))) {
            this.endGame(true);
        } else if (this.isGameOver()) {
            this.endGame(false);
        }
    }

    updateBoard() {
        const board = document.getElementById('game-board');
        board.replaceChildren();
        this.board.forEach((row, y) => row.forEach((value, x) => {
            const cell = document.createElement('div');
            cell.className = value ? `cell tile-${value}${value >= 128 ? ' tile-large' : ''}` : 'cell';
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-label', value ? `Tile ${value}` : 'Empty');
            if (value) cell.textContent = value;
            board.appendChild(cell);
        }));
    }

    updateScores() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best-score').textContent = this.highScore;
    }

    updateStatus(message) {
        const status = document.getElementById('game-status');
        if (status) status.textContent = message;
    }

    endGame(won) {
        this.cleanup();
        this.updateStatus(won ? 'You reached 2048! Start a new game to play again.' : 'No more moves. Start a new game and try again.');
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.setAttribute('role', 'status');
        overlay.innerHTML = `<div class="game-over-card"><h2>${won ? 'You win!' : 'Game over'}</h2><p>${won ? 'You made a 2048 tile.' : 'There are no more moves.'}</p><button class="control-button" type="button">Play again</button></div>`;
        overlay.querySelector('button').addEventListener('click', () => this.init());
        document.getElementById('game-board').appendChild(overlay);
    }

    isGameOver() {
        return !this.board.some((row, y) => row.some((value, x) =>
            value === 0 || (x < this.size - 1 && value === row[x + 1]) ||
            (y < this.size - 1 && value === this.board[y + 1][x])
        ));
    }

    handleKeydown(event) {
        if (!this.isActive || event.altKey || event.ctrlKey || event.metaKey) return;
        const keyMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
        if (keyMap[event.key]) {
            event.preventDefault();
            this.move(keyMap[event.key]);
        }
    }

    handleTouchStart(event) {
        if (!this.isActive || event.touches.length !== 1) return;
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
    }

    handleTouchEnd(event) {
        if (!this.isActive || !event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - this.touchStartX;
        const dy = event.changedTouches[0].clientY - this.touchStartY;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        this.move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }

    bindEvents() {
        this.removeEvents();
        document.addEventListener('keydown', this.keydownHandler);
        const board = document.getElementById('game-board');
        board.addEventListener('touchstart', this.touchStartHandler, { passive: true });
        board.addEventListener('touchend', this.touchEndHandler, { passive: true });
    }

    removeEvents() {
        document.removeEventListener('keydown', this.keydownHandler);
        const board = document.getElementById('game-board');
        if (board) {
            board.removeEventListener('touchstart', this.touchStartHandler);
            board.removeEventListener('touchend', this.touchEndHandler);
        }
    }
}

