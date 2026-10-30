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
        this.controlPointerDownHandler = this.handleControlPointerDown.bind(this);
        this.controlPointerUpHandler = this.handleControlPointerUp.bind(this);
        this.boardTouchStartHandler = this.handleBoardTouchStart.bind(this);
        this.boardTouchMoveHandler = this.handleBoardTouchMove.bind(this);
        this.boardTouchEndHandler = this.handleBoardTouchEnd.bind(this);
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchLastX = 0;
        this.touchLastY = 0;
        this.touchStartTime = 0;
        this.repeatTimeout = null;
        this.repeatInterval = null;
        this.resetState();
    }

    readHighScore() {
        try {
            const score = Number(localStorage.getItem('tetris-highScore'));
            return Number.isSafeInteger(score) && score >= 0 ? score : 0;
        } catch { return 0; }
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
        this.bag = [];
        this.nextType = null;
        this.cells = [];
        this.prevRender = [];
        this.nextCells = [];
        this.pauseOverlay = null;
    }

    start() {
        this.cleanup();
        this.resetState();
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(null));
        this.isActive = true;
        const board = document.getElementById('game-board');
        board.classList.add('tetris-board');
        this.buildBoardCells();
        this.buildNextPreview();
        const nextEl = document.getElementById('tetris-next');
        if (nextEl) nextEl.classList.remove('hidden');
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
        this.stopControlRepeat();
        document.removeEventListener('keydown', this.keydownHandler);
        const controls = document.getElementById('tetris-controls');
        if (controls) {
            controls.removeEventListener('click', this.controlHandler);
            controls.removeEventListener('pointerdown', this.controlPointerDownHandler);
            controls.removeEventListener('pointerup', this.controlPointerUpHandler);
            controls.removeEventListener('pointercancel', this.controlPointerUpHandler);
            controls.removeEventListener('pointerleave', this.controlPointerUpHandler);
        }
        const boardEl = document.getElementById('game-board');
        if (boardEl) {
            boardEl.removeEventListener('touchstart', this.boardTouchStartHandler);
            boardEl.removeEventListener('touchmove', this.boardTouchMoveHandler);
            boardEl.removeEventListener('touchend', this.boardTouchEndHandler);
        }
        const board = document.getElementById('game-board');
        if (board) board.classList.remove('tetris-board');
        const nextEl = document.getElementById('tetris-next');
        if (nextEl) nextEl.classList.add('hidden');
        if (this.pauseOverlay) { this.pauseOverlay.remove(); this.pauseOverlay = null; }
        this.cells = [];
        this.prevRender = [];
        this.nextCells = [];
    }

    buildBoardCells() {
        const board = document.getElementById('game-board');
        if (!board) return;
        board.replaceChildren();
        this.cells = [];
        this.prevRender = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'tetris-cell';
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('aria-label', 'Empty');
                board.appendChild(cell);
                this.cells.push(cell);
                this.prevRender.push(null);
            }
        }
    }

    buildNextPreview() {
        const grid = document.getElementById('tetris-next-grid');
        if (!grid) return;
        grid.replaceChildren();
        this.nextCells = [];
        for (let i = 0; i < 8; i++) {
            const cell = document.createElement('div');
            cell.className = 'tetris-next-cell';
            grid.appendChild(cell);
            this.nextCells.push(cell);
        }
    }

    drawFromBag() {
        if (!this.bag.length) {
            this.bag = Object.keys(this.shapes);
            for (let i = this.bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
            }
        }
        return this.bag.shift();
    }

    updateNextPreview() {
        if (!this.nextCells.length || !this.nextType) return;
        const shape = this.shapes[this.nextType];
        for (let i = 0; i < this.nextCells.length; i++) {
            const row = Math.floor(i / 4);
            const col = i % 4;
            const filled = shape[row] && shape[row][col];
            this.nextCells[i].className = filled
                ? `tetris-next-cell tetromino-${this.nextType.toLowerCase()}`
                : 'tetris-next-cell';
        }
    }

    startGravity() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.tick(), Math.max(90, 800 - (this.level - 1) * 65));
    }

    spawnPiece() {
        const type = this.nextType || this.drawFromBag();
        this.nextType = this.drawFromBag();
        this.updateNextPreview();
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
        if (!board) return;
        if (!this.cells.length) this.buildBoardCells();
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
        cells.forEach((row, y) => row.forEach((type, x) => {
            const index = y * this.width + x;
            if (this.prevRender[index] === type) return;
            this.prevRender[index] = type;
            const cell = this.cells[index];
            if (!cell) return;
            cell.className = `tetris-cell${type ? ` tetromino-${type.toLowerCase()}` : ''}`;
            cell.setAttribute('aria-label', type ? `${type} block at row ${y + 1}, column ${x + 1}` : 'Empty');
        }));
        if (this.isPaused) {
            if (!this.pauseOverlay) {
                const overlay = document.createElement('div');
                overlay.className = 'game-over tetris-overlay';
                const card = document.createElement('div');
                card.className = 'game-over-card';
                const heading = document.createElement('h2');
                heading.textContent = 'Paused';
                const message = document.createElement('p');
                message.textContent = 'Resume when you are ready.';
                card.append(heading, message);
                overlay.appendChild(card);
                board.appendChild(overlay);
                this.pauseOverlay = overlay;
            }
        } else if (this.pauseOverlay) {
            this.pauseOverlay.remove();
            this.pauseOverlay = null;
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
        const card = document.createElement('div');
        card.className = 'game-over-card';
        const heading = document.createElement('h2');
        heading.textContent = 'Game over';
        const message = document.createElement('p');
        message.textContent = `Score: ${this.score} · Lines: ${this.lines}`;
        const button = document.createElement('button');
        button.className = 'control-button';
        button.type = 'button';
        button.textContent = 'Play again';
        button.addEventListener('click', () => this.start());
        card.append(heading, message, button);
        overlay.appendChild(card);
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
        // Pointerdown already fired this action on touch/mouse; ignore the
        // following click so a tap does not move/rotate/drop twice.
        // Keyboard activation has no pointerdown, so it still works.
        if (button.dataset.action === this.lastPointerAction &&
            Date.now() - (this.lastPointerTime || 0) < 500) return;
        this.doControlAction(button.dataset.action);
    }

    doControlAction(action) {
        if (action === 'left') this.move(-1);
        if (action === 'right') this.move(1);
        if (action === 'down') this.softDrop();
        if (action === 'rotate') this.rotate();
        if (action === 'drop') this.hardDrop();
        if (action === 'pause') this.togglePause();
    }

    stopControlRepeat() {
        if (this.repeatTimeout) { clearTimeout(this.repeatTimeout); this.repeatTimeout = null; }
        if (this.repeatInterval) { clearInterval(this.repeatInterval); this.repeatInterval = null; }
    }

    handleControlPointerDown(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        event.preventDefault();
        const action = button.dataset.action;
        this.lastPointerAction = action;
        this.lastPointerTime = Date.now();
        this.doControlAction(action);
        // Press-and-hold repeats only for continuous actions, never for
        // rotate / drop / pause, which must stay one-shot.
        this.stopControlRepeat();
        if (action === 'left' || action === 'right' || action === 'down') {
            this.repeatTimeout = setTimeout(() => {
                this.repeatInterval = setInterval(() => this.doControlAction(action), 90);
            }, 280);
        }
    }

    handleControlPointerUp() {
        this.stopControlRepeat();
    }

    handleBoardTouchStart(event) {
        if (!this.isActive || this.isPaused || event.touches.length !== 1) return;
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchLastX = touch.clientX;
        this.touchLastY = touch.clientY;
        this.touchStartTime = Date.now();
    }

    handleBoardTouchMove(event) {
        if (!this.isActive || this.isPaused || event.touches.length !== 1) return;
        const touch = event.touches[0];
        const dx = touch.clientX - this.touchLastX;
        const dy = touch.clientY - this.touchLastY;
        if (Math.abs(dx) >= 24) {
            this.move(dx > 0 ? 1 : -1);
            this.touchLastX = touch.clientX;
        }
        if (dy >= 24) {
            this.softDrop();
            this.touchLastY = touch.clientY;
        }
    }

    handleBoardTouchEnd(event) {
        if (!this.isActive || this.isPaused || !event.changedTouches.length) return;
        const touch = event.changedTouches[0];
        const totalDx = touch.clientX - this.touchStartX;
        const totalDy = touch.clientY - this.touchStartY;
        const duration = Date.now() - this.touchStartTime;
        // Tap = rotate. Flick down = hard drop. Anything else was already
        // handled step-by-step by touchmove, so do not repeat it here.
        if (Math.max(Math.abs(totalDx), Math.abs(totalDy)) < 24 && duration < 400) {
            this.rotate();
        } else if (totalDy > 80 && Math.abs(totalDy) > Math.abs(totalDx) && duration < 500) {
            this.hardDrop();
        }
    }

    bindEvents() {
        document.addEventListener('keydown', this.keydownHandler);
        const controls = document.getElementById('tetris-controls');
        if (controls) {
            controls.addEventListener('click', this.controlHandler);
            controls.addEventListener('pointerdown', this.controlPointerDownHandler);
            controls.addEventListener('pointerup', this.controlPointerUpHandler);
            controls.addEventListener('pointercancel', this.controlPointerUpHandler);
            controls.addEventListener('pointerleave', this.controlPointerUpHandler);
        }
        const board = document.getElementById('game-board');
        if (board) {
            board.addEventListener('touchstart', this.boardTouchStartHandler, { passive: true });
            board.addEventListener('touchmove', this.boardTouchMoveHandler, { passive: true });
            board.addEventListener('touchend', this.boardTouchEndHandler, { passive: true });
        }
    }
}
