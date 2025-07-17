class SnakeGame {
    constructor() {
        this.resetGame();
        this.keydownHandler = this.handleKeydown.bind(this);
        this.touchStartHandler = this.handleTouchStart.bind(this);
        this.touchEndHandler = this.handleTouchEnd.bind(this);
        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    resetGame() {
        this.size = 20;
        this.snake = [{x: 10, y: 10}];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.food = null;
        this.score = 0;
        this.speed = 150;
        this.gameInterval = null;
        this.isGameOver = false;
        this.isActive = false;
        this.highScore = parseInt(localStorage.getItem('snake-highScore')) || 0;
    }

    start() {
        this.cleanup();
        this.resetGame();
        this.isActive = true;
        this.clearBoard();
        this.food = this.generateFood();
        this.renderSnake();
        this.renderFood();
        document.getElementById('score').textContent = this.score;
        
        this.gameInterval = setInterval(() => this.update(), this.speed);
        this.bindEvents();
    }

    cleanup() {
        this.isActive = false;
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        this.removeEvents();
    }

    clearBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
    }

    renderSnake() {
        const board = document.getElementById('game-board');
        
        this.snake.forEach((segment, index) => {
            const segmentElement = document.createElement('div');
            segmentElement.className = index === 0 ? 'snake-segment snake-head' : 'snake-segment';
            segmentElement.style.left = `${segment.x * 5}%`;
            segmentElement.style.top = `${segment.y * 5}%`;
            board.appendChild(segmentElement);
        });
    }

    renderFood() {
        const board = document.getElementById('game-board');
        const foodElement = document.createElement('div');
        foodElement.className = 'food';
        foodElement.style.left = `${this.food.x * 5}%`;
        foodElement.style.top = `${this.food.y * 5}%`;
        board.appendChild(foodElement);
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.size),
                y: Math.floor(Math.random() * this.size)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        
        return food;
    }

    update() {
        if (!this.isActive) return;
        
        this.direction = this.nextDirection;
        
        const head = {...this.snake[0]};
        
        switch (this.direction) {
            case 'up': head.y -= 1; break;
            case 'down': head.y += 1; break;
            case 'left': head.x -= 1; break;
            case 'right': head.x += 1; break;
        }
        
        if (
            head.x < 0 || head.x >= this.size ||
            head.y < 0 || head.y >= this.size ||
            this.snake.some(segment => segment.x === head.x && segment.y === head.y)
        ) {
            this.endGame();
            return;
        }
        
        this.snake.unshift(head);
        
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            document.getElementById('score').textContent = this.score;
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snake-highScore', this.highScore);
            }
            
            this.food = this.generateFood();
            
            if (this.score % 50 === 0 && this.speed > 50) {
                this.speed -= 10;
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(() => this.update(), this.speed);
            }
        } else {
            this.snake.pop();
        }
        
        this.clearBoard();
        this.renderSnake();
        this.renderFood();
    }

    handleKeydown(e) {
        if (!this.isActive) return;
        
        switch(e.key) {
            case 'ArrowUp':
                if (this.direction !== 'down') this.nextDirection = 'up';
                e.preventDefault();
                break;
            case 'ArrowDown':
                if (this.direction !== 'up') this.nextDirection = 'down';
                e.preventDefault();
                break;
            case 'ArrowLeft':
                if (this.direction !== 'right') this.nextDirection = 'left';
                e.preventDefault();
                break;
            case 'ArrowRight':
                if (this.direction !== 'left') this.nextDirection = 'right';
                e.preventDefault();
                break;
        }
    }

    // 修改：触摸开始处理器 - 参考2048的实现
    handleTouchStart(e) {
        if (!this.isActive) return;
        
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    // 修改：触摸结束处理器 - 参考2048的实现
    handleTouchEnd(e) {
        if (!this.isActive) return;
        
        const dx = e.changedTouches[0].clientX - this.touchStartX;
        const dy = e.changedTouches[0].clientY - this.touchStartY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // 使用与2048相同的最小滑动距离
        if (Math.max(absDx, absDy) < 30) return;

        // 确定滑动方向
        let newDirection;
        if (absDx > absDy) {
            newDirection = dx > 0 ? 'right' : 'left';
        } else {
            newDirection = dy > 0 ? 'down' : 'up';
        }

        // 防止反向移动
        const oppositeDirections = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (this.direction !== oppositeDirections[newDirection]) {
            this.nextDirection = newDirection;
        }
    }

    // 修改：事件绑定 - 参考2048的实现
    bindEvents() {
        this.removeEvents();
        
        // 键盘事件绑定到document
        document.addEventListener('keydown', this.keydownHandler);
        
        // 触摸事件绑定到游戏板，与2048保持一致
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            gameBoard.addEventListener('touchstart', this.touchStartHandler, { passive: true });
            gameBoard.addEventListener('touchend', this.touchEndHandler);
        }
    }

    // 修改：移除事件监听器
    removeEvents() {
        document.removeEventListener('keydown', this.keydownHandler);
        
        // 从游戏板移除触摸事件
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            gameBoard.removeEventListener('touchstart', this.touchStartHandler);
            gameBoard.removeEventListener('touchend', this.touchEndHandler);
        }
    }

    endGame() {
        this.cleanup();
        this.isGameOver = true;
        
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.textContent = '游戏结束！';
        document.getElementById('game-board').appendChild(overlay);
    }
}