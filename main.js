document.addEventListener('DOMContentLoaded', () => {
    const game2048 = new Game2048();
    const snakeGame = new SnakeGame();
    
    const gameSelector = document.getElementById('game-selector');
    const gameContainer = document.getElementById('game-container');
    const backButton = document.getElementById('back-button');
    const gameBoard = document.getElementById('game-board');
    const gameTitle = document.getElementById('game-title');
    const gameTips = document.getElementById('game-tips');
    const gameScore = document.getElementById('score');
    
    // 当前活跃的游戏
    let currentGame = null;
    
    // 添加加载状态
    function setLoadingState() {
        gameBoard.classList.add('loading-active');
        gameBoard.innerHTML = '<div class="loading">加载中...</div>';
        gameBoard.style.backgroundColor = '#bbada0';
    }

    // 清理当前游戏状态
    function cleanupCurrentGame() {
        if (currentGame) {
            currentGame.cleanup();
            currentGame = null;
        }
        
        // 清理界面
        gameBoard.innerHTML = '';
        gameBoard.style.backgroundColor = '#bbada0';
        gameScore.textContent = '0';
    }

    // 启动2048游戏
    async function start2048Game() {
        cleanupCurrentGame();
        
        gameSelector.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        setLoadingState();
        
        // 确保完全清理
        await new Promise(resolve => setTimeout(resolve, 50));
        
        gameTitle.textContent = '2048';
        gameTips.textContent = '使用方向键或滑动操作';
        
        currentGame = game2048;
        game2048.init();
    }

    // 启动贪吃蛇游戏
    async function startSnakeGame() {
        cleanupCurrentGame();
        
        gameSelector.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        setLoadingState();
        
        // 等待渲染帧完成
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        gameTitle.textContent = '贪吃蛇';
        gameTips.textContent = '使用方向键控制';
        
        currentGame = snakeGame;
        snakeGame.start();
    }

    // 返回主菜单
    function returnToMenu() {
        cleanupCurrentGame();
        
        gameContainer.classList.add('hidden');
        gameSelector.classList.remove('hidden');
        
        // 重置界面透明度
        gameBoard.style.opacity = '0';
        setTimeout(() => {
            gameBoard.style.opacity = '1';
        }, 50);
    }

    // 事件监听器
    document.getElementById('game-2048').addEventListener('click', start2048Game);
    document.getElementById('game-snake').addEventListener('click', startSnakeGame);
    backButton.addEventListener('click', returnToMenu);
});