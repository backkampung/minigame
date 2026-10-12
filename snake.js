class SnakeGame {
    constructor() {
        this.keydownHandler = this.handleKeydown.bind(this);
        this.touchStartHandler = this.handleTouchStart.bind(this);
        this.touchEndHandler = this.handleTouchEnd.bind(this);
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.resetGame();
    }

    readHighScore() {
        try { return Number(localStorage.getItem('snake-highScore')) || 0; }
        catch { return 0; }
    }

    resetGame() {
        this.size = 20;
        this.snake = [{ x: 10, y: 10 }];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.food = null;
        this.score = 0;
        this.speed = 150;
        this.gameInterval = null;
        this.isGameOver = false;
        this.isActive = false;
        this.highScore = this.readHighScore();
    }

    start() {
        this.cleanup();
        this.resetGame();
        this.isActive = true;
        this.food = this.generateFood();
        this.render();
        this.updateScores();
        this.setStatus('Use the arrow keys or swipe the board to steer.');
        this.gameInterval = setInterval(() => this.update(), this.speed);
        this.bindEvents();
    }

    cleanup() {
        this.isActive = false;
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = null;
        this.removeEvents();
    }

    setStatus(message) {
        const status = document.getElementById('game-status');
        if (status) status.textContent = message;
    }

    updateScores() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best-score').textContent = this.highScore;
    }

    generateFood() {
        const empty = [];
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (!this.snake.some(segment => segment.x === x && segment.y === y)) empty.push({ x, y });
            }
        }
        return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
    }

    update() {
        if (!this.isActive) return;
        this.direction = this.nextDirection;
        const head = { ...this.snake[0] };
        if (this.direction === 'up') head.y--;
        if (this.direction === 'down') head.y++;
        if (this.direction === 'left') head.x--;
        if (this.direction === 'right') head.x++;

        const eating = this.food && head.x === this.food.x && head.y === this.food.y;
        const bodyToCheck = eating ? this.snake : this.snake.slice(0, -1);
        if (head.x < 0 || head.x >= this.size || head.y < 0 || head.y >= this.size ||
            bodyToCheck.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.endGame(false);
            return;
        }

        this.snake.unshift(head);
        if (eating) {
            this.score += 10;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                try { localStorage.setItem('snake-highScore', String(this.highScore)); } catch { /* Storage is optional. */ }
            }
            this.food = this.generateFood();
            if (this.score % 50 === 0 && this.speed > 50) {
                this.speed -= 10;
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(() => this.update(), this.speed);
            }
            if (!this.food) {
                this.updateScores();
                this.endGame(true);
                return;
            }
        } else this.snake.pop();

        this.updateScores();
        this.render();
    }

    render() {
        const board = document.getElementById('game-board');
        board.replaceChildren();
        this.snake.forEach((segment, index) => {
            const element = document.createElement('div');
            element.className = index === 0 ? 'snake-segment snake-head' : 'snake-segment';
            element.style.left = `${segment.x * 5}%`;
            element.style.top = `${segment.y * 5}%`;
            board.appendChild(element);
        });
        if (this.food) {
            const food = document.createElement('div');
            food.className = 'food';
            food.style.left = `${this.food.x * 5}%`;
            food.style.top = `${this.food.y * 5}%`;
            board.appendChild(food);
        }
    }

    endGame(won) {
        this.cleanup();
        this.isGameOver = true;
        this.setStatus(won ? 'You filled the board. Amazing!' : 'Game over. Start a new game and try again.');
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.setAttribute('role', 'status');
        overlay.innerHTML = `<div class="game-over-card"><h2>${won ? 'Board complete!' : 'Game over'}</h2><p>${won ? 'You filled every space.' : `Final score: ${this.score}`}</p><button class="control-button" type="button">Play again</button></div>`;
        overlay.querySelector('button').addEventListener('click', () => this.start());
        document.getElementById('game-board').appendChild(overlay);
    }

    handleKeydown(event) {
        if (!this.isActive || event.altKey || event.ctrlKey || event.metaKey) return;
        const keyMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
        const direction = keyMap[event.key];
        if (!direction) return;
        event.preventDefault();
        const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (direction !== opposite[this.direction]) this.nextDirection = direction;
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
        const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (direction !== opposite[this.direction]) this.nextDirection = direction;
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
