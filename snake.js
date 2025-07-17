class SnakeGame {
    constructor() {
        this.resetGame();
        this.keydownHandler = this.handleKeydown.bind(this);
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
        this.isActive = false; // 新增：游戏激活状态
        this.highScore = parseInt(localStorage.getItem('snake-highScore')) || 0;
    }

    start() {
        this.cleanup(); // 先清理
        this.resetGame();
        this.isActive = true; // 激活游戏
        this.clearBoard();
        this.food = this.generateFood();
        this.renderSnake();
        this.renderFood();
        document.getElementById('score').textContent = this.score;
        
        this.gameInterval = setInterval(() => this.update(), this.speed);
        this.bindEvents();
    }

    // 新增：清理方法
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
        if (!this.isActive) return; // 只有激活状态才更新
        
        this.direction = this.nextDirection;
        
        const head = {...this.snake[0]};
        
        switch (this.direction) {
            case 'up': head.y -= 1; break;
            case 'down': head.y += 1; break;
            case 'left': head.x -= 1; break;
            case 'right': head.x += 1; break;
        }
        
        // 检查碰撞
        if (
            head.x < 0 || head.x >= this.size ||
            head.y < 0 || head.y >= this.size ||
            this.snake.some(segment => segment.x === head.x && segment.y === head.y)
        ) {
            this.endGame();
            return;
        }
        
        this.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            document.getElementById('score').textContent = this.score;
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snake-highScore', this.highScore);
            }
            
            this.food = this.generateFood();
            
            // 随着分数增加加快速度
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

    // 重构：键盘事件处理器
    handleKeydown(e) {
        if (!this.isActive) return; // 只有激活状态才响应
        
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

    bindEvents() {
        // 移除旧的事件监听器（防止重复绑定）
        this.removeEvents();
        
        // 绑定新的事件监听器
        document.addEventListener('keydown', this.keydownHandler);
    }

    // 新增：移除事件监听器
    removeEvents() {
        document.removeEventListener('keydown', this.keydownHandler);
    }

    endGame() {
        this.cleanup(); // 使用统一的清理方法
        this.isGameOver = true;
        
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.textContent = '游戏结束！';
        document.getElementById('game-board').appendChild(overlay);
    }
}