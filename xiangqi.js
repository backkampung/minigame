try {
    const { Xiangqi } = await import('./xiangqi-engine.js?v=2');

    class XiangqiGame {
        constructor() {
            this.game = null;
            this.difficulty = 'moderate';
            this.selected = null; // { r, c } of the selected Red piece, or null
            this.isActive = false;
            this.isThinking = false;
            this.matchId = 0;
            this.moveHistory = []; // { side: 'red'|'black', char, from: {r,c}, to: {r,c} }
            this.lastMove = null; // { from: {r,c}, to: {r,c} }
            this.boardClickHandler = this.handleBoardClick.bind(this);
            // Traditional characters, used consistently for both sides.
            this.glyphs = {
                red: { K: '帥', A: '仕', E: '相', H: '傌', R: '俥', C: '砲', P: '兵' },
                black: { K: '將', A: '士', E: '象', H: '馬', R: '車', C: '炮', P: '卒' }
            };
            this.pieceNames = { K: 'General', A: 'Advisor', E: 'Elephant', H: 'Horse', R: 'Chariot', C: 'Cannon', P: 'Soldier' };
        }

        cleanup() {
            this.isActive = false;
            this.isThinking = false;
            this.matchId++;
            const board = document.getElementById('game-board');
            if (board) {
                board.removeEventListener('click', this.boardClickHandler);
                board.classList.remove('xiangqi-board');
            }
        }

        startMatch(difficulty = 'moderate') {
            this.cleanup();
            this.difficulty = ['easy', 'moderate', 'hard'].includes(difficulty) ? difficulty : 'moderate';
            this.game = new Xiangqi();
            this.selected = null;
            this.moveHistory = [];
            this.lastMove = null;
            this.isActive = true;
            const board = document.getElementById('game-board');
            board.classList.add('xiangqi-board');
            board.setAttribute('aria-label', 'Xiangqi board. You are Red; Charlie is Black.');
            board.addEventListener('click', this.boardClickHandler);
            document.getElementById('xiangqi-setup').classList.add('hidden');
            document.getElementById('game-controls').classList.remove('hidden');
            this.updateTurnCards();
            this.updateStatus('Your move. Select one of your Red pieces, then choose a highlighted point.');
            this.render();
        }

        updateStatus(message) {
            const status = document.getElementById('game-status');
            if (status) status.textContent = message;
        }

        updateTurnCards() {
            if (!this.game) return;
            const human = document.getElementById('xiangqi-human-turn-state');
            const machine = document.getElementById('xiangqi-machine-turn-state');
            if (!human || !machine) return;
            const over = this.game.gameOver();
            if (this.isThinking) {
                human.textContent = 'Waiting';
                machine.textContent = 'Thinking…';
            } else if (over) {
                human.textContent = over.winner === 'red' ? 'You win' : 'Finished';
                machine.textContent = over.winner === 'black' ? 'Charlie wins' : 'Finished';
            } else if (this.game.turn === 'red') {
                human.textContent = 'Your move';
                machine.textContent = 'Waiting';
            } else {
                human.textContent = 'Waiting';
                machine.textContent = 'Charlie to move';
            }
        }

        handleBoardClick(event) {
            if (!this.isActive || this.isThinking || !this.game) return;
            if (this.game.turn !== 'red' || this.game.gameOver()) return;
            const point = event.target.closest('[data-r]');
            if (!point) return;
            const r = Number(point.dataset.r);
            const c = Number(point.dataset.c);
            const piece = this.game.board[r][c];

            if (this.selected) {
                const moves = this.game.movesFrom(this.selected.r, this.selected.c);
                const chosen = moves.find(m => m.to.r === r && m.to.c === c);
                if (chosen) {
                    this.playMove(chosen);
                    return;
                }
            }

            if (piece && piece.color === 'red') {
                this.selected = { r, c };
                this.updateStatus(`Selected ${this.glyphs.red[piece.type]} ${this.pieceNames[piece.type]} at (${r},${c}). Choose a highlighted point.`);
            } else {
                this.selected = null;
                this.updateStatus('Select one of your Red pieces.');
            }
            this.render();
        }

        playMove(move) {
            if (!this.isActive || this.isThinking || !this.game) return;
            const char = this.glyphs[move.piece.color][move.piece.type];
            this.moveHistory.push({ side: move.piece.color, char, from: { ...move.from }, to: { ...move.to } });
            this.lastMove = { from: { ...move.from }, to: { ...move.to } };
            this.game.makeMove(move);
            this.selected = null;
            this.afterMove();
        }

        afterMove() {
            this.render();
            this.updateTurnCards();
            const over = this.game.gameOver();
            if (over) {
                this.finishGame(over);
                return;
            }
            if (this.game.turn === 'black') this.makeMachineMove();
            else this.updateStatus(this.game.isInCheck('red') ? 'Check! Your move.' : 'Your move. Select a Red piece.');
        }

        makeMachineMove() {
            this.isThinking = true;
            const currentMatch = this.matchId;
            this.updateTurnCards();
            this.updateStatus(`Charlie (Machine) is thinking · ${this.difficulty[0].toUpperCase()}${this.difficulty.slice(1)}`);
            this.render();
            // Short delay so the move reads as a turn, not an instant reply.
            // Guarded by matchId + isActive so a stale timeout can never
            // move in a later match (e.g. after restart / back to menu).
            setTimeout(() => {
                if (!this.isActive || currentMatch !== this.matchId || !this.game) return;
                if (this.game.gameOver()) {
                    this.isThinking = false;
                    return;
                }
                const depth = { easy: 2, moderate: 3, hard: 4 }[this.difficulty] || 3;
                const move = this.game.findBestMove('black', depth);
                if (move && this.isActive && currentMatch === this.matchId) {
                    const char = this.glyphs[move.piece.color][move.piece.type];
                    this.moveHistory.push({ side: move.piece.color, char, from: { ...move.from }, to: { ...move.to } });
                    this.lastMove = { from: { ...move.from }, to: { ...move.to } };
                    this.game.makeMove(move);
                }
                this.isThinking = false;
                if (this.isActive && currentMatch === this.matchId) this.afterMove();
            }, 400);
        }

        finishGame(over) {
            this.isActive = false;
            this.isThinking = false;
            const humanWon = over.winner === 'red';
            const heading = humanWon ? 'You win!' : 'Charlie wins';
            const reasonWord = over.reason === 'checkmate' ? 'Checkmate' : 'Stalemate';
            const detail = over.reason === 'checkmate'
                ? (humanWon ? 'Checkmate. You defeated Charlie (Machine).' : 'Checkmate. Charlie (Machine) wins this game.')
                : (humanWon ? 'Stalemate. Black has no legal move — Red wins.' : 'Stalemate. Red has no legal move — Black wins.');
            this.updateTurnCards();
            this.updateStatus(`${reasonWord} — ${humanWon ? 'Red' : 'Black'} wins!`);
            const overlay = document.createElement('div');
            overlay.className = 'game-over xiangqi-overlay';
            overlay.setAttribute('role', 'status');
            const card = document.createElement('div');
            card.className = 'game-over-card';
            const title = document.createElement('h2');
            title.textContent = heading;
            const message = document.createElement('p');
            message.textContent = detail;
            const button = document.createElement('button');
            button.className = 'control-button';
            button.type = 'button';
            button.textContent = 'Play again';
            button.addEventListener('click', () => this.startMatch(this.difficulty));
            card.append(title, message, button);
            overlay.appendChild(card);
            document.getElementById('game-board').appendChild(overlay);
        }

        // SVG line layer: outer border, 9 verticals (broken at the river
        // except the two outer files), 10 horizontals, palace diagonals,
        // small round position marks at every Cannon and Soldier point,
        // and the river text. viewBox 800x900 = 9 points x 10 points.
        linesSvg() {
            const v = [];
            for (let c = 0; c <= 8; c++) {
                const x = c * 100;
                if (c === 0 || c === 8) v.push(`<line x1="${x}" y1="0" x2="${x}" y2="900"/>`);
                else v.push(`<line x1="${x}" y1="0" x2="${x}" y2="400"/><line x1="${x}" y1="500" x2="${x}" y2="900"/>`);
            }
            const h = [];
            for (let r = 0; r <= 9; r++) h.push(`<line x1="0" y1="${r * 100}" x2="800" y2="${r * 100}"/>`);
            const palace = '<line x1="300" y1="0" x2="500" y2="200"/><line x1="500" y1="0" x2="300" y2="200"/>'
                + '<line x1="300" y1="700" x2="500" y2="900"/><line x1="500" y1="700" x2="300" y2="900"/>';
            // Small round marks at the Cannon points (4) and Soldier
            // points (10) — the dots a real board has. Edge Soldier
            // points sit on the border, so the SVG clips them to a half
            // dot, exactly like a real board. (c, r) pairs.
            const marks = [[1, 2], [7, 2], [1, 7], [7, 7],
                [0, 3], [2, 3], [4, 3], [6, 3], [8, 3],
                [0, 6], [2, 6], [4, 6], [6, 6], [8, 6]]
                .map(([c, r]) => `<circle class="xiangqi-mark" cx="${c * 100}" cy="${r * 100}" r="9"/>`).join('');
            const river = '<text x="200" y="468" class="xiangqi-river-text">楚河</text>'
                + '<text x="600" y="468" class="xiangqi-river-text">汉界</text>';
            return `<svg class="xiangqi-lines" viewBox="0 0 800 900" aria-hidden="true">`
                + `<g class="xiangqi-lines-stroke">${v.join('')}${h.join('')}${palace}</g>${marks}${river}</svg>`;
        }

        render() {
            if (!this.game) return;
            const boardElement = document.getElementById('game-board');
            const legalMoves = this.selected ? this.game.movesFrom(this.selected.r, this.selected.c) : [];
            const targets = new Map(legalMoves.map(m => [`${m.to.r},${m.to.c}`, m]));
            boardElement.replaceChildren();
            boardElement.insertAdjacentHTML('beforeend', this.linesSvg());
            for (let r = 0; r < 10; r++) {
                for (let c = 0; c < 9; c++) {
                    const piece = this.game.board[r][c];
                    const point = document.createElement('button');
                    point.type = 'button';
                    point.className = 'xiangqi-point';
                    point.dataset.r = String(r);
                    point.dataset.c = String(c);
                    if (this.selected && this.selected.r === r && this.selected.c === c) point.classList.add('selected');
                    if (this.lastMove && ((this.lastMove.from.r === r && this.lastMove.from.c === c) ||
                        (this.lastMove.to.r === r && this.lastMove.to.c === c))) point.classList.add('last-move');
                    const target = targets.get(`${r},${c}`);
                    if (target) point.classList.add(piece ? 'capture-target' : 'legal-target');
                    // Only occupied points get a disc. Empty points must
                    // stay transparent so the board lines, the river text
                    // and the small round position marks show through —
                    // otherwise the board becomes a field of pale discs.
                    if (piece) {
                        const pieceSpan = document.createElement('span');
                        pieceSpan.className = `xiangqi-piece piece-${piece.color}`;
                        pieceSpan.textContent = this.glyphs[piece.color][piece.type];
                        point.appendChild(pieceSpan);
                    }
                    point.setAttribute('role', 'gridcell');
                    point.setAttribute('aria-label', piece
                        ? `${piece.color === 'red' ? 'Red' : 'Black'} ${this.pieceNames[piece.type]} at row ${r}, column ${c}`
                        : `Empty point row ${r}, column ${c}`);
                    boardElement.appendChild(point);
                }
            }
            this.renderHistory();
            this.updateTurnCards();
        }

        renderHistory() {
            const list = document.getElementById('xiangqi-move-list');
            if (!list) return;
            list.replaceChildren();
            for (let i = 0; i < this.moveHistory.length; i += 2) {
                const item = document.createElement('li');
                const fmt = m => `${m.side === 'red' ? '红' : '黑'} ${m.char} (${m.from.r},${m.from.c}) → (${m.to.r},${m.to.c})`;
                item.textContent = `${Math.floor(i / 2) + 1}. ${fmt(this.moveHistory[i])}`
                    + (this.moveHistory[i + 1] ? `  ${fmt(this.moveHistory[i + 1])}` : '');
                list.appendChild(item);
            }
            list.classList.toggle('hidden', this.moveHistory.length === 0);
        }
    }

    window.XiangqiGame = XiangqiGame;
    window.dispatchEvent(new Event('xiangqi-game-ready'));
} catch (error) {
    console.error('Could not load the Xiangqi rules library.', error);
    window.xiangqiLibraryError = true;
    window.dispatchEvent(new Event('xiangqi-game-load-error'));
}
