class Game2048 {
    constructor() {
        this.size = 4;
        this.board = [];
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('2048-highScore')) || 0;
        this.isAnimating = false;
        this.isActive = false; // 新增：游戏激活状态
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        // 绑定事件处理器到实例，便于移除
        this.keydownHandler = this.handleKeydown.bind(this);
        this.touchStartHandler = this.handleTouchStart.bind(this);
        this.touchEndHandler = this.handleTouchEnd.bind(this);
    }

    init() {
        // 清理之前的状态
        this.cleanup();
        
        document.querySelectorAll('.game-over').forEach(el => el.remove());
        const container = document.getElementById('game-board');
        
        // 强制终止所有动画
        container.querySelectorAll('.cell').forEach(cell => {
            cell.style.transition = 'none';
            cell.style.animation = 'none';
        });
        
        container.innerHTML = '';
        
        // 重置游戏逻辑状态
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.score = 0;
        document.getElementById('score').textContent = this.score;
        this.isAnimating = false;
        this.isActive = true; // 激活游戏
        
        this.addNewTile();
        this.addNewTile();
        this.updateBoard();
        this.bindEvents();
    }

    // 新增：清理方法
    cleanup() {
        this.isActive = false;
        this.removeEvents();
        this.isAnimating = false;
    }

    addNewTile() {
        const emptyCells = [];
        this.board.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell === 0) emptyCells.push({x: i, y: j});
            });
        });

        if (emptyCells.length > 0) {
            const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[x][y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    async move(direction) {
        if (!this.isActive || this.isAnimating || this.isGameOver()) return;
        
        const oldBoard = JSON.stringify(this.board);
        let moved = false;

        switch(direction) {
            case 'left': moved = this.moveHorizontal(true); break;
            case 'right': moved = this.moveHorizontal(false); break;
            case 'up': moved = this.moveVertical(true); break;
            case 'down': moved = this.moveVertical(false); break;
        }

        if (moved) {
            this.isAnimating = true;
            await this.animateTiles();
            
            this.addNewTile();
            this.updateBoard();
            
            if (this.isGameOver()) {
                this.showGameOver();
            }
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('2048-highScore', this.highScore);
            }
            
            this.isAnimating = false;
        }
    }

    moveHorizontal(leftDirection) {
        let moved = false;
        this.board.forEach(row => {
            const nonZero = row.filter(cell => cell !== 0);
            const newRow = [];
            let prev = null;

            for (const cell of leftDirection ? nonZero : nonZero.reverse()) {
                if (prev === cell) {
                    newRow[newRow.length - 1] *= 2;
                    this.score += newRow[newRow.length - 1];
                    prev = null;
                } else {
                    newRow.push(cell);
                    prev = cell;
                }
            }

            while (newRow.length < this.size) newRow.push(0);
            const finalRow = leftDirection ? newRow : newRow.reverse();
            
            if (row.join(',') !== finalRow.join(',')) {
                row.splice(0, this.size, ...finalRow);
                moved = true;
            }
        });
        return moved;
    }

    moveVertical(upDirection) {
        this.transpose();
        const moved = this.moveHorizontal(upDirection);
        this.transpose();
        return moved;
    }

    transpose() {
        this.board = this.board[0].map((_, col) => 
            this.board.map(row => row[col])
        );
    }

    async animateTiles() {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                const tiles = document.querySelectorAll('.cell');
                tiles.forEach(tile => {
                    tile.style.transition = 'none';
                    const rect = tile.getBoundingClientRect();
                    tile.style.left = `${rect.left}px`;
                    tile.style.top = `${rect.top}px`;
                });
                
                requestAnimationFrame(() => {
                    tiles.forEach(tile => {
                        tile.style.transition = '';
                        const x = parseInt(tile.dataset.x);
                        const y = parseInt(tile.dataset.y);
                        tile.style.left = `${(x * 24) + 2}%`;
                        tile.style.top = `${(y * 24) + 2}%`;
                    });
                    setTimeout(resolve, 150);
                });
            });
        });
    }

    updateBoard() {
        const container = document.getElementById('game-board');
        const oldTiles = Array.from(container.children);
        
        this.board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value === 0) return;
                
                const existingTile = oldTiles.find(t => 
                    parseInt(t.dataset.x) === x && 
                    parseInt(t.dataset.y) === y
                );
                
                if (!existingTile) {
                    const tile = document.createElement('div');
                    tile.className = `cell tile-${value} animate-appear`;
                    tile.textContent = value;
                    tile.dataset.x = x;
                    tile.dataset.y = y;
                    tile.style.left = `${(x * 24) + 2}%`;
                    tile.style.top = `${(y * 24) + 2}%`;
                    container.appendChild(tile);
                } else {
                    if (parseInt(existingTile.textContent) !== value) {
                        existingTile.className = `cell tile-${value} animate-merge`;
                        existingTile.textContent = value;
                    }
                    existingTile.style.zIndex = 1;
                }
            });
        });

        oldTiles.forEach(tile => {
            const x = parseInt(tile.dataset.x);
            const y = parseInt(tile.dataset.y);
            if (this.board[y][x] === 0) {
                tile.remove();
            }
        });

        document.getElementById('score').textContent = this.score;
    }

    showGameOver() {
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.textContent = '游戏结束！';
        document.getElementById('game-board').appendChild(overlay);
    }

    isGameOver() {
        return !this.board.some((row, y) =>
            row.some((cell, x) =>
                cell === 0 ||
                (x < 3 && cell === row[x + 1]) ||
                (y < 3 && cell === this.board[y + 1][x])
            )
        );
    }

    // 重构：键盘事件处理器
    handleKeydown(e) {
        if (!this.isActive) return; // 只有激活状态才响应
        
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            this.move(e.key.replace('Arrow', '').toLowerCase());
        }
    }

    // 重构：触摸开始处理器
    handleTouchStart(e) {
        if (!this.isActive) return;
        
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    // 重构：触摸结束处理器
    handleTouchEnd(e) {
        if (!this.isActive) return;
        
        const dx = e.changedTouches[0].clientX - this.touchStartX;
        const dy = e.changedTouches[0].clientY - this.touchStartY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) < 30) return;

        const direction = absDx > absDy 
            ? (dx > 0 ? 'right' : 'left')
            : (dy > 0 ? 'down' : 'up');
        
        this.move(direction);
    }

    bindEvents() {
        // 移除旧的事件监听器（防止重复绑定）
        this.removeEvents();
        
        // 绑定新的事件监听器
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('touchstart', this.touchStartHandler, { passive: true });
        document.addEventListener('touchend', this.touchEndHandler);
    }

    // 新增：移除事件监听器
    removeEvents() {
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('touchstart', this.touchStartHandler);
        document.removeEventListener('touchend', this.touchEndHandler);
    }
}