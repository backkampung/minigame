// Xiangqi (Chinese Chess) engine — pure JavaScript, no DOM, no dependencies.
// Runs in Node (ES module) and in the browser as an ES module.
// Board: 10 rows (0-9) x 9 cols (0-8). Row 0 = Black back rank (top),
// row 9 = Red back rank (bottom). Red moves toward decreasing row (up),
// Black toward increasing row (down).

const VALUES = { K: 100000, R: 600, C: 300, H: 300, P: 60, A: 120, E: 120 };
const OPP = { red: 'black', black: 'red' };

function inBoard(r, c) { return r >= 0 && r < 10 && c >= 0 && c < 9; }
function inPalace(color, r, c) {
  if (c < 3 || c > 5) return false;
  return color === 'red' ? (r >= 7 && r <= 9) : (r >= 0 && r <= 2);
}

export class Xiangqi {
  constructor() {
    this.board = Array.from({ length: 10 }, () => Array(9).fill(null));
    this.turn = 'red';
    this.history = [];
    this._nodes = 0;
    this._nodeCap = 0; // 0 = no cap
    const back = ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R'];
    for (let c = 0; c < 9; c++) {
      this.board[0][c] = { type: back[c], color: 'black' };
      this.board[9][c] = { type: back[c], color: 'red' };
    }
    for (const c of [1, 7]) {
      this.board[2][c] = { type: 'C', color: 'black' };
      this.board[7][c] = { type: 'C', color: 'red' };
    }
    for (const c of [0, 2, 4, 6, 8]) {
      this.board[3][c] = { type: 'P', color: 'black' };
      this.board[6][c] = { type: 'P', color: 'red' };
    }
  }

  // ---- internal helpers ----

  _findGeneral(color) {
    for (let r = 0; r < 10; r++)
      for (let c = 0; c < 9; c++) {
        const p = this.board[r][c];
        if (p && p.type === 'K' && p.color === color) return { r, c };
      }
    return null;
  }

  // Pseudo-legal moves for `color`: movement rules only, no check filter.
  // Includes captures of the enemy General (needed only as an attack test
  // in the old sense); legalMoves() strips K-captures out.
  _pseudoMoves(color) {
    const moves = [];
    const b = this.board;
    const add = (r, c, nr, nc) => {
      const target = b[nr][nc];
      if (!target) moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece: b[r][c], captured: null });
      else if (target.color !== color) moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece: b[r][c], captured: target });
    };
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = b[r][c];
        if (!p || p.color !== color) continue;
        switch (p.type) {
          case 'K': {
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
              const nr = r + dr, nc = c + dc;
              if (inBoard(nr, nc) && inPalace(color, nr, nc)) add(r, c, nr, nc);
            }
            break;
          }
          case 'A': {
            for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
              const nr = r + dr, nc = c + dc;
              if (inBoard(nr, nc) && inPalace(color, nr, nc)) add(r, c, nr, nc);
            }
            break;
          }
          case 'E': {
            for (const [dr, dc] of [[-2, -2], [-2, 2], [2, -2], [2, 2]]) {
              const nr = r + dr, nc = c + dc;
              if (!inBoard(nr, nc)) continue;
              // Cannot cross the river: Red rows 5-9, Black rows 0-4.
              if (color === 'red' && nr < 5) continue;
              if (color === 'black' && nr > 4) continue;
              if (b[r + dr / 2][c + dc / 2]) continue; // elephant's eye blocked
              add(r, c, nr, nc);
            }
            break;
          }
          case 'H': {
            // Orthogonal leg, then diagonal outward.
            for (const [dr, dc, legs] of [
              [-1, 0, [[-2, -1], [-2, 1]]],
              [1, 0, [[2, -1], [2, 1]]],
              [0, -1, [[-1, -2], [1, -2]]],
              [0, 1, [[-1, 2], [1, 2]]],
            ]) {
              const lr = r + dr, lc = c + dc;
              if (!inBoard(lr, lc) || b[lr][lc]) continue; // horse's leg blocked
              for (const [dr2, dc2] of legs) {
                const nr = r + dr2, nc = c + dc2;
                if (inBoard(nr, nc)) add(r, c, nr, nc);
              }
            }
            break;
          }
          case 'R': {
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
              let nr = r + dr, nc = c + dc;
              while (inBoard(nr, nc)) {
                const t = b[nr][nc];
                if (!t) { add(r, c, nr, nc); nr += dr; nc += dc; }
                else { if (t.color !== color) add(r, c, nr, nc); break; }
              }
            }
            break;
          }
          case 'C': {
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
              let nr = r + dr, nc = c + dc, screen = null;
              while (inBoard(nr, nc)) {
                const t = b[nr][nc];
                if (!screen) {
                  if (!t) add(r, c, nr, nc); // quiet move, like a Chariot
                  else screen = t; // first piece is the screen, not a destination
                } else {
                  if (!t) { /* empty beyond screen: not a move */ }
                  else { if (t.color !== color) add(r, c, nr, nc); break; } // first piece after screen only
                }
                nr += dr; nc += dc;
              }
            }
            break;
          }
          case 'P': {
            const fwd = color === 'red' ? -1 : 1;
            const nr = r + fwd;
            if (inBoard(nr, c)) add(r, c, nr, c);
            const crossed = color === 'red' ? r <= 4 : r >= 5;
            if (crossed) {
              if (inBoard(r, c - 1)) add(r, c, r, c - 1);
              if (inBoard(r, c + 1)) add(r, c, r, c + 1);
            }
            break;
          }
        }
      }
    }
    return moves;
  }

  // Legal moves for a given colour (does not depend on this.turn).
  _legalMovesFor(color) {
    const out = [];
    for (const m of this._pseudoMoves(color)) {
      if (m.captured && m.captured.type === 'K') continue; // Generals are never captured
      const { r, c } = m.from, { r: tr, c: tc } = m.to;
      const piece = this.board[r][c];
      const captured = this.board[tr][tc];
      this.board[tr][tc] = piece;
      this.board[r][c] = null;
      const inCheck = this.isInCheck(color);
      this.board[r][c] = piece;
      this.board[tr][tc] = captured;
      if (!inCheck) out.push(m);
    }
    return out;
  }

  // ---- public API ----

  legalMoves() { return this._legalMovesFor(this.turn); }

  movesFrom(r, c) {
    if (!inBoard(r, c)) return [];
    const p = this.board[r][c];
    if (!p || p.color !== this.turn) return [];
    return this._legalMovesFor(this.turn).filter(m => m.from.r === r && m.from.c === c);
  }

  makeMove(m) {
    const piece = this.board[m.from.r][m.from.c];
    const captured = this.board[m.to.r][m.to.c];
    this.history.push({ from: { ...m.from }, to: { ...m.to }, piece, captured });
    this.board[m.to.r][m.to.c] = piece;
    this.board[m.from.r][m.from.c] = null;
    this.turn = OPP[this.turn];
  }

  undoMove() {
    const h = this.history.pop();
    if (!h) return;
    this.board[h.from.r][h.from.c] = h.piece;
    this.board[h.to.r][h.to.c] = h.captured;
    this.turn = OPP[this.turn];
  }

  // Direct attack test (no move generation, so no recursion and fast):
  // flying general, soldiers, horses, chariot/cannon/general sliding,
  // advisors (1 diagonal) and elephants (2 diagonal, eye).
  isInCheck(color) {
    const g = this._findGeneral(color);
    if (!g) return false;
    const b = this.board, opp = OPP[color];
    const { r: gr, c: gc } = g;

    // Flying general: same file, nothing between.
    const og = this._findGeneral(opp);
    if (og && og.c === gc) {
      let blocked = false;
      for (let r = Math.min(gr, og.r) + 1; r < Math.max(gr, og.r); r++) {
        if (b[r][gc]) { blocked = true; break; }
      }
      if (!blocked) return true;
    }

    // Soldiers: a soldier attacks the general from one step in front of
    // it (relative to the soldier), or sideways once it has crossed.
    const soldierAt = (r, c, type) => {
      if (!inBoard(r, c)) return false;
      const p = b[r][c];
      return p && p.color === opp && p.type === type;
    };
    if (opp === 'red') {
      if (soldierAt(gr + 1, gc, 'P')) return true;
      if (gr <= 4 && (soldierAt(gr, gc - 1, 'P') || soldierAt(gr, gc + 1, 'P'))) return true;
    } else {
      if (soldierAt(gr - 1, gc, 'P')) return true;
      if (gr >= 5 && (soldierAt(gr, gc - 1, 'P') || soldierAt(gr, gc + 1, 'P'))) return true;
    }

    // Horses: 8 offsets; leg is the orthogonal step from the horse.
    for (const [dr, dc] of [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2]]) {
      const hr = gr + dr, hc = gc + dc;
      if (!inBoard(hr, hc)) continue;
      const p = b[hr][hc];
      if (!p || p.color !== opp || p.type !== 'H') continue;
      const lr = Math.abs(dr) === 2 ? hr + Math.sign(-dr) : hr;
      const lc = Math.abs(dc) === 2 ? hc + Math.sign(-dc) : hc;
      if (!b[lr][lc]) return true;
    }

    // Advisors (1 diagonal) and elephants (2 diagonal, eye empty).
    for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      if (soldierAt(gr + dr, gc + dc, 'A')) return true;
      const er = gr + 2 * dr, ec = gc + 2 * dc;
      if (inBoard(er, ec) && !b[gr + dr][gc + dc]) {
        const p = b[er][ec];
        if (p && p.color === opp && p.type === 'E') return true;
      }
    }

    // Sliding orthogonal: Chariot (first piece), Cannon (second piece
    // after exactly one screen), enemy General at distance 1.
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      let screen = null, step = 0;
      let nr = gr + dr, nc = gc + dc;
      while (inBoard(nr, nc)) {
        step++;
        const p = b[nr][nc];
        if (p) {
          if (!screen) {
            if (p.color === opp && (p.type === 'R' || (p.type === 'K' && step === 1))) return true;
            screen = p;
          } else {
            if (p.color === opp && p.type === 'C') return true;
            break; // only the first piece after the screen can be a cannon capture
          }
        }
        nr += dr; nc += dc;
      }
    }
    return false;
  }

  gameOver() {
    if (this.legalMoves().length > 0) return null;
    // No legal moves: loss for the side to move, whether in check
    // (checkmate) or not (stalemate — a loss in Xiangqi, never a draw).
    return { winner: OPP[this.turn], reason: this.isInCheck(this.turn) ? 'checkmate' : 'stalemate' };
  }

  evaluate(color) {
    let score = 0;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = this.board[r][c];
        if (!p) continue;
        let v = VALUES[p.type];
        // Small positional terms (symmetric; soldier term is colour-aware).
        if (p.type === 'P') {
          const adv = p.color === 'red' ? (9 - r) : r;
          v += adv * 6 + ((p.color === 'red' ? r <= 4 : r >= 5) ? 15 : 0);
        } else if (p.type === 'R') {
          v += (c >= 3 && c <= 5) ? 10 : ((c === 2 || c === 6) ? 5 : 0);
        } else if (p.type === 'C') {
          v += (c >= 3 && c <= 5) ? 5 : 0;
        } else if (p.type === 'H') {
          v += (c >= 3 && c <= 5) ? 5 : 0;
        }
        score += p.color === color ? v : -v;
      }
    }
    return score;
  }

  _orderMoves(moves) {
    // Captures first, highest victim value first (MVV); quiet moves last.
    return moves.slice().sort((a, b) => {
      const va = a.captured ? VALUES[a.captured.type] : 0;
      const vb = b.captured ? VALUES[b.captured.type] : 0;
      return vb - va;
    });
  }

  _negamax(depth, alpha, beta, color) {
    this._nodes++;
    if (this._nodeCap && this._nodes > this._nodeCap) return this.evaluate(color);
    if (depth === 0) return this.evaluate(color);
    const moves = this._orderMoves(this._legalMovesFor(color));
    if (moves.length === 0) return -100000; // checkmate or stalemate: loss
    let best = -Infinity;
    for (const m of moves) {
      this.makeMove(m);
      const s = -this._negamax(depth - 1, -beta, -alpha, OPP[color]);
      this.undoMove();
      if (s > best) best = s;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  findBestMove(color, depth) {
    const rootMoves = this._orderMoves(this._legalMovesFor(color));
    if (rootMoves.length === 0) return null;
    if (depth < 1) depth = 1;
    this._nodes = 0;
    const scored = [];
    let bestScore = -Infinity;
    for (const m of rootMoves) {
      // Full window per root move so every score is exact (needed for
      // the random tie-break below); alpha-beta still prunes inside.
      this.makeMove(m);
      const s = -this._negamax(depth - 1, -Infinity, Infinity, OPP[color]);
      this.undoMove();
      scored.push({ move: m, score: s });
      if (s > bestScore) bestScore = s;
    }
    // Random tie-break: pick randomly among moves within 5 points of best.
    const near = scored.filter(x => x.score >= bestScore - 5);
    return near[Math.floor(Math.random() * near.length)].move;
  }
}
