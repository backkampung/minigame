class TetrisGame {
    constructor() {
        this.width = 10;
        this.height = 20;
        this.shapes = {
            I: [[1, 1, 1, 1]],
            J: [[1, 0, 0], [1, 1, 1]],
            L: [[0, 0, 1], [1, 1, 1]],
            O: [[1, 1], [1, 1]],
            S: [[0, 1, 1], [1, 1, 0]],
            T: [[0, 1, 0], [1, 1, 1]],
            Z: [[1, 1, 0], [0, 1, 1]]
        };
        this.keydownHandler = this.handleKeydown.bind(this);
        this.controlHandler = this.handleControlClick.bind(this);
        this.resetState();
    }

    readHighScore() {
        try { return Number(localStorage.getItem('tetris-highScore')) || 0; }
        catch { return 0; }
    }

    resetState() {
        this.grid = [];
        this.piece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.highScore = this.readHighScore();
        this.isActive = false;
        this.isPaused = false;
        this.gameInterval = null;
    }

    start() {
        this.cleanup();
        this.resetState();
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(null));
        this.isActive = true;
        const board = document.getElementById('game-board');
        board.classList.add('tetris-board');
        const pauseButton = document.querySelector('[data-action="pause"]');
        if (pauseButton) pauseButton.textContent = 'Pause';
        this.bindEvents();
        this.updateScores();
        this.setStatus('← → move · ↑ rotate · ↓ soft drop · Space hard drop · P pause');
        this.spawnPiece();
        if (this.isActive) this.startGravity();
    }

    cleanup() {
        this.isActive = false;
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = null;
        document.removeEventListener('keydown', this.keydownHandler);
        const controls = document.getElementById('tetris-controls');
        if (controls) controls.removeEventListener('click', this.controlHandler);
        const board = document.getElementById('game-board');
        if (board) board.classList.remove('tetris-board');
    }

    startGravity() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.tick(), Math.max(90, 800 - (this.level - 1) * 65));
    }

    spawnPiece() {
        const types = Object.keys(this.shapes);
        const type = types[Math.floor(Math.random() * types.length)];
        const matrix = this.shapes[type].map(row => [...row]);
        this.piece = { type, matrix, x: Math.floor((this.width - matrix[0].length) / 2), y: 0 };
        if (this.collides(this.piece)) {
            this.endGame();
            return;
        }
        this.render();
    }

    collides(piece) {
        for (let y = 0; y < piece.matrix.length; y++) {
            for (let x = 0; x < piece.matrix[y].length; x++) {
                if (!piece.matrix[y][x]) continue;
                const boardX = piece.x + x;
                const boardY = piece.y + y;
                if (boardX < 0 || boardX >= this.width || boardY >= this.height) return true;
                if (boardY >= 0 && this.grid[boardY][boardX]) return true;
            }
        }
        return false;
    }

    move(dx, dy = 0) {
        if (!this.isActive || this.isPaused || !this.piece) return;
        const next = { ...this.piece, x: this.piece.x + dx, y: this.piece.y + dy };
        if (this.collides(next)) {
            if (dy > 0) this.lockPiece();
            return;
        }
        this.piece = next;
        this.render();
    }

    rotate() {
        if (!this.isActive || this.isPaused || !this.piece || this.piece.type === 'O') return;
        const matrix = this.piece.matrix[0].map((_, x) => this.piece.matrix.map(row => row[x]).reverse());
        for (const offset of [0, -1, 1, -2, 2]) {
            const rotated = { ...this.piece, matrix, x: this.piece.x + offset };
            if (!this.collides(rotated)) {
                this.piece = rotated;
                this.render();
                return;
            }
        }
    }

    softDrop() {
        if (!this.isActive || this.isPaused || !this.piece) return;
        const next = { ...this.piece, y: this.piece.y + 1 };
        if (this.collides(next)) this.lockPiece();
        else {
            this.piece = next;
            this.score += 1;
            this.updateHighScore();
            this.updateScores();
            this.render();
        }
    }

    hardDrop() {
        if (!this.isActive || this.isPaused || !this.piece) return;
        let distance = 0;
        while (!this.collides({ ...this.piece, y: this.piece.y + 1 })) {
            this.piece.y++;
            distance++;
        }
        this.score += distance * 2;
        this.updateHighScore();
        this.updateScores();
        this.lockPiece();
    }

    tick() {
        if (!this.isActive || this.isPaused || !this.piece) return;
        const next = { ...this.piece, y: this.piece.y + 1 };
        if (this.collides(next)) this.lockPiece();
        else {
            this.piece = next;
            this.render();
        }
    }

    lockPiece() {
        if (!this.piece) return;
        this.piece.matrix.forEach((row, y) => row.forEach((value, x) => {
            if (value) {
                const boardY = this.piece.y + y;
                if (boardY >= 0) this.grid[boardY][this.piece.x + x] = this.piece.type;
            }
        }));
        const remaining = this.grid.filter(row => row.some(cell => !cell));
        const cleared = this.height - remaining.length;
        if (cleared) {
            this.grid = Array.from({ length: cleared }, () => Array(this.width).fill(null)).concat(remaining);
            this.lines += cleared;
            const points = [0, 100, 300, 500, 800][cleared] || cleared * 200;
            this.score += points * this.level;
            this.level = 1 + Math.floor(this.lines / 10);
            this.startGravity();
            this.updateHighScore();
            this.updateScores();
        }
        this.piece = null;
        this.updateScores();
        this.render();
        this.spawnPiece();
    }

    updateHighScore() {
        if (this.score <= this.highScore) return;
        this.highScore = this.score;
        try { localStorage.setItem('tetris-highScore', String(this.highScore)); }
        catch { /* Storage is optional; the game remains playable. */ }
    }

    updateScores() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best-score').textContent = this.highScore;
    }

    setStatus(message) {
        const status = document.getElementById('game-status');
        if (status) status.textContent = message;
    }

    togglePause() {
        if (!this.isActive) return;
        this.isPaused = !this.isPaused;
        const pauseButton = document.querySelector('[data-action="pause"]');
        if (pauseButton) pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
        this.setStatus(this.isPaused ? 'Paused. Press P or tap Resume to continue.' : '← → move · ↑ rotate · ↓ soft drop · Space hard drop · P pause');
        this.render();
    }

    render() {
        const board = document.getElementById('game-board');
        const cells = Array.from({ length: this.height }, (_, y) =>
            Array.from({ length: this.width }, (_, x) => this.grid[y][x])
        );
        if (this.piece) {
            this.piece.matrix.forEach((row, y) => row.forEach((value, x) => {
                const boardY = this.piece.y + y;
                const boardX = this.piece.x + x;
                if (value && boardY >= 0 && boardY < this.height) cells[boardY][boardX] = this.piece.type;
            }));
        }
        board.replaceChildren();
        cells.forEach((row, y) => row.forEach((type, x) => {
            const cell = document.createElement('div');
            cell.className = `tetris-cell${type ? ` tetromino-${type.toLowerCase()}` : ''}`;
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-label', type ? `${type} block at row ${y + 1}, column ${x + 1}` : 'Empty');
            board.appendChild(cell);
        }));
        if (this.isPaused) {
            const overlay = document.createElement('div');
            overlay.className = 'game-over tetris-overlay';
            overlay.innerHTML = '<div class="game-over-card"><h2>Paused</h2><p>Resume when you are ready.</p></div>';
            board.appendChild(overlay);
        }
    }

    endGame() {
        this.isActive = false;
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = null;
        this.updateScores();
        this.setStatus('Game over. Start a new game and try again.');
        const overlay = document.createElement('div');
        overlay.className = 'game-over tetris-overlay';
        overlay.setAttribute('role', 'status');
        overlay.innerHTML = `<div class="game-over-card"><h2>Game over</h2><p>Score: ${this.score} · Lines: ${this.lines}</p><button class="control-button" type="button">Play again</button></div>`;
        overlay.querySelector('button').addEventListener('click', () => this.start());
        document.getElementById('game-board').appendChild(overlay);
    }

    handleKeydown(event) {
        if (!this.isActive || event.altKey || event.ctrlKey || event.metaKey) return;
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'p', 'P'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        switch (event.key) {
            case 'ArrowLeft': this.move(-1); break;
            case 'ArrowRight': this.move(1); break;
            case 'ArrowDown': this.softDrop(); break;
            case 'ArrowUp': this.rotate(); break;
            case ' ': this.hardDrop(); break;
            case 'p':
            case 'P': this.togglePause(); break;
        }
    }

    handleControlClick(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'left') this.move(-1);
        if (action === 'right') this.move(1);
        if (action === 'down') this.softDrop();
        if (action === 'rotate') this.rotate();
        if (action === 'drop') this.hardDrop();
        if (action === 'pause') this.togglePause();
    }

    bindEvents() {
        document.addEventListener('keydown', this.keydownHandler);
        const controls = document.getElementById('tetris-controls');
        if (controls) controls.addEventListener('click', this.controlHandler);
    }
}
