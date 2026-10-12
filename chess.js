try {
    const { Chess } = await import('./chess-engine.js');

    class ChessGame {
        constructor() {
            this.game = null;
            this.difficulty = 'moderate';
            this.selectedSquare = null;
            this.isActive = false;
            this.isThinking = false;
            this.matchId = 0;
            this.boardClickHandler = this.handleBoardClick.bind(this);
            this.pieceValues = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 20000 };
            this.glyphs = {
                w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
                b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
            };
        }

        cleanup() {
            this.isActive = false;
            this.isThinking = false;
            this.matchId++;
            const board = document.getElementById('game-board');
            if (board) {
                board.removeEventListener('click', this.boardClickHandler);
                board.classList.remove('chess-board');
            }
        }

        startMatch(difficulty = 'moderate') {
            this.cleanup();
            this.difficulty = ['easy', 'moderate', 'hard'].includes(difficulty) ? difficulty : 'moderate';
            this.game = new Chess();
            this.selectedSquare = null;
            this.isActive = true;
            const board = document.getElementById('game-board');
            board.classList.add('chess-board');
            board.setAttribute('aria-label', 'Chess board. You are White; Charlie is Black.');
            board.addEventListener('click', this.boardClickHandler);
            document.getElementById('chess-setup').classList.add('hidden');
            document.getElementById('game-controls').classList.remove('hidden');
            this.updateTurnCards();
            this.updateStatus('Your move. Select one of your pieces, then choose a highlighted square.');
            this.render();
        }

        updateStatus(message) {
            const status = document.getElementById('game-status');
            if (status) status.textContent = message;
        }

        updateTurnCards() {
            if (!this.game) return;
            const human = document.getElementById('human-turn-state');
            const machine = document.getElementById('machine-turn-state');
            if (this.isThinking) {
                human.textContent = 'Waiting';
                machine.textContent = 'Thinking…';
            } else if (this.game.isGameOver()) {
                human.textContent = this.game.isCheckmate() && this.game.turn() === 'b' ? 'You win' : 'Finished';
                machine.textContent = this.game.isCheckmate() && this.game.turn() === 'w' ? 'Charlie wins' : 'Finished';
            } else if (this.game.turn() === 'w') {
                human.textContent = 'Your move';
                machine.textContent = 'Waiting';
            } else {
                human.textContent = 'Waiting';
                machine.textContent = 'Charlie to move';
            }
        }

        handleBoardClick(event) {
            if (!this.isActive || this.isThinking || this.game.turn() !== 'w' || this.game.isGameOver()) return;
            const squareElement = event.target.closest('[data-square]');
            if (!squareElement) return;
            const square = squareElement.dataset.square;
            const piece = this.game.get(square);

            if (this.selectedSquare) {
                const moves = this.game.moves({ square: this.selectedSquare, verbose: true });
                const chosenMove = moves.find(move => move.to === square);
                if (chosenMove) {
                    if (chosenMove.promotion) this.showPromotionPicker(chosenMove.from, chosenMove.to);
                    else this.playMove(chosenMove.from, chosenMove.to);
                    return;
                }
            }

            if (piece && piece.color === 'w') {
                this.selectedSquare = square;
                this.updateStatus(`Selected ${piece.type.toUpperCase()} on ${square}. Choose a highlighted square.`);
            } else {
                this.selectedSquare = null;
                this.updateStatus('Select one of your White pieces.');
            }
            this.render();
        }

        showPromotionPicker(from, to) {
            const overlay = document.createElement('div');
            overlay.className = 'game-over promotion-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-label', 'Choose a promotion piece');
            overlay.innerHTML = '<div class="game-over-card"><h2>Promote pawn</h2><p>Choose a piece</p><div class="promotion-options"><button type="button" data-piece="q" aria-label="Promote to queen">♕</button><button type="button" data-piece="r" aria-label="Promote to rook">♖</button><button type="button" data-piece="b" aria-label="Promote to bishop">♗</button><button type="button" data-piece="n" aria-label="Promote to knight">♘</button></div><button class="control-button promotion-cancel" type="button">Cancel</button></div>';
            overlay.querySelectorAll('[data-piece]').forEach(button => button.addEventListener('click', () => {
                overlay.remove();
                this.playMove(from, to, button.dataset.piece);
            }));
            overlay.querySelector('.promotion-cancel').addEventListener('click', () => overlay.remove());
            document.getElementById('game-board').appendChild(overlay);
        }

        playMove(from, to, promotion = 'q') {
            if (!this.isActive || this.isThinking) return;
            try {
                this.game.move({ from, to, promotion });
            } catch {
                this.updateStatus('That move is not legal. Choose another square.');
                return;
            }
            this.selectedSquare = null;
            this.afterMove();
        }

        afterMove(fromMachine = false) {
            this.render();
            this.updateTurnCards();
            if (this.game.isGameOver()) {
                this.finishGame();
                return;
            }
            if (this.game.turn() === 'b') this.makeMachineMove();
            else this.updateStatus(this.game.isCheck() ? 'Check! Your move.' : 'Your move. Select a piece.');
        }

        async makeMachineMove() {
            this.isThinking = true;
            const currentMatch = this.matchId;
            this.updateTurnCards();
            this.updateStatus(`Charlie (Machine) is thinking · ${this.difficulty[0].toUpperCase()}${this.difficulty.slice(1)}`);
            this.render();
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!this.isActive || currentMatch !== this.matchId || this.game.isGameOver()) return;

            const move = this.difficulty === 'easy'
                ? this.chooseEasyMove()
                : this.chooseSearchMove(this.difficulty === 'hard' ? 3 : 2);
            if (move && this.isActive && currentMatch === this.matchId) this.game.move(move);
            this.isThinking = false;
            this.afterMove(true);
        }

        chooseEasyMove() {
            const moves = this.game.moves({ verbose: true });
            if (!moves.length) return null;
            return moves[Math.floor(Math.random() * moves.length)];
        }

        chooseSearchMove(depth) {
            const moves = this.orderMoves(this.game.moves({ verbose: true }));
            let bestMove = null;
            let bestScore = -Infinity;
            let alpha = -Infinity;
            const beta = Infinity;
            for (const move of moves) {
                this.game.move(move);
                const score = -this.negamax(depth - 1, -beta, -alpha, 1);
                this.game.undo();
                if (score > bestScore || (score === bestScore && Math.random() < 0.12)) {
                    bestScore = score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, score);
            }
            return bestMove;
        }

        negamax(depth, alpha, beta, ply) {
            if (this.game.isCheckmate()) return -100000 + ply;
            if (this.game.isDraw() || this.game.isStalemate() || this.game.isThreefoldRepetition()) return 0;
            if (depth === 0) {
                const whiteScore = this.evaluatePosition();
                return this.game.turn() === 'w' ? whiteScore : -whiteScore;
            }

            let best = -Infinity;
            const moves = this.orderMoves(this.game.moves({ verbose: true }));
            for (const move of moves) {
                this.game.move(move);
                const score = -this.negamax(depth - 1, -beta, -alpha, ply + 1);
                this.game.undo();
                best = Math.max(best, score);
                alpha = Math.max(alpha, score);
                if (alpha >= beta) break;
            }
            return best;
        }

        orderMoves(moves) {
            return moves.sort((a, b) => this.movePriority(b) - this.movePriority(a));
        }

        movePriority(move) {
            return (move.captured ? this.pieceValues[move.captured] * 10 - this.pieceValues[move.piece] : 0) +
                (move.promotion ? this.pieceValues[move.promotion] : 0) +
                (move.san.includes('+') ? 40 : 0);
        }

        evaluatePosition() {
            let total = 0;
            const board = this.game.board();
            board.forEach((row, rank) => row.forEach((piece, file) => {
                if (!piece) return;
                const sign = piece.color === 'w' ? 1 : -1;
                total += sign * this.pieceValues[piece.type];
                const centerDistance = Math.abs(3.5 - file) + Math.abs(3.5 - rank);
                if (piece.type === 'n' || piece.type === 'b') total += sign * Math.round((7 - centerDistance) * 5);
                if (piece.type === 'p') total += sign * (piece.color === 'w' ? 6 - rank : rank - 1) * 3;
            }));
            return total;
        }

        finishGame() {
            this.isActive = false;
            this.isThinking = false;
            let heading = 'Draw';
            let detail = 'The game ended in a draw.';
            if (this.game.isCheckmate()) {
                const humanWon = this.game.turn() === 'b';
                heading = humanWon ? 'You win!' : 'Charlie wins';
                detail = humanWon ? 'Checkmate. You defeated Charlie (Machine).' : 'Checkmate. Charlie (Machine) wins this game.';
            } else if (this.game.isStalemate()) detail = 'Stalemate. Neither side can make a legal move.';
            else if (this.game.isThreefoldRepetition()) detail = 'Draw by threefold repetition.';
            else if (this.game.isInsufficientMaterial()) detail = 'Draw by insufficient material.';
            else if (this.game.isDraw()) detail = 'Draw by the fifty-move rule or repetition.';
            this.updateTurnCards();
            this.updateStatus(detail);
            const overlay = document.createElement('div');
            overlay.className = 'game-over chess-overlay';
            overlay.setAttribute('role', 'status');
            overlay.innerHTML = `<div class="game-over-card"><h2>${heading}</h2><p>${detail}</p><button class="control-button" type="button">Play again</button></div>`;
            overlay.querySelector('button').addEventListener('click', () => this.startMatch(this.difficulty));
            document.getElementById('game-board').appendChild(overlay);
        }

        render() {
            if (!this.game) return;
            const boardElement = document.getElementById('game-board');
            const lastMove = this.game.history({ verbose: true }).at(-1);
            const legalMoves = this.selectedSquare ? this.game.moves({ square: this.selectedSquare, verbose: true }) : [];
            const targets = new Set(legalMoves.map(move => move.to));
            boardElement.replaceChildren();
            this.game.board().forEach((row, rowIndex) => row.forEach((piece, fileIndex) => {
                const square = document.createElement('button');
                square.type = 'button';
                square.className = 'chess-square';
                const file = fileIndex;
                const rank = 8 - rowIndex;
                square.dataset.square = `${String.fromCharCode(97 + file)}${rank}`;
                square.classList.add((file + rank) % 2 === 1 ? 'square-dark' : 'square-light');
                if (piece && piece.square === this.selectedSquare) square.classList.add('selected');
                if (piece && lastMove && (piece.square === lastMove.from || piece.square === lastMove.to)) square.classList.add('last-move');
                if (targets.has(square.dataset.square)) square.classList.add(piece ? 'capture-target' : 'legal-target');
                const pieceSpan = document.createElement('span');
                pieceSpan.className = `chess-piece ${piece ? `piece-${piece.color}` : ''}`;
                pieceSpan.textContent = piece ? this.glyphs[piece.color][piece.type] : '';
                square.appendChild(pieceSpan);
                if (file === 0) {
                    const rankLabel = document.createElement('span');
                    rankLabel.className = 'square-coordinate rank-coordinate';
                    rankLabel.textContent = rank;
                    square.appendChild(rankLabel);
                }
                if (rank === 1) {
                    const fileLabel = document.createElement('span');
                    fileLabel.className = 'square-coordinate file-coordinate';
                    fileLabel.textContent = String.fromCharCode(97 + file);
                    square.appendChild(fileLabel);
                }
                square.setAttribute('role', 'gridcell');
                square.setAttribute('aria-label', `${piece ? `${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}` : 'Empty'} square ${square.dataset.square}`);
                boardElement.appendChild(square);
            }));
            this.renderHistory();
            this.updateTurnCards();
        }

        renderHistory() {
            const list = document.getElementById('chess-move-list');
            const history = this.game.history();
            list.replaceChildren();
            for (let index = 0; index < history.length; index += 2) {
                const item = document.createElement('li');
                item.textContent = `${Math.floor(index / 2) + 1}. ${history[index]}${history[index + 1] ? `  ${history[index + 1]}` : ''}`;
                list.appendChild(item);
            }
            list.classList.toggle('hidden', history.length === 0);
        }
    }

    window.ChessGame = ChessGame;
    window.dispatchEvent(new Event('chess-game-ready'));
} catch (error) {
    console.error('Could not load the chess rules library.', error);
    window.chessLibraryError = true;
    window.dispatchEvent(new Event('chess-game-load-error'));
}
