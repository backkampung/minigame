import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { Chess } from '../chess-engine.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('all game scripts pass Node syntax checks', async () => {
  const scripts = ['2048.js', 'snake.js', 'tetris.js', 'chess.js', 'chess-engine.js', 'main.js'];
  for (const script of scripts) {
    const result = spawnSync(process.execPath, ['--check', path.join(root, script)], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${script}: ${result.stderr}`);
  }
});

test('bundled chess engine starts with 20 legal moves and applies a legal move', () => {
  const game = new Chess();
  assert.equal(game.moves().length, 20);
  const move = game.move({ from: 'e2', to: 'e4' });
  assert.equal(move.color, 'w');
  assert.equal(move.from, 'e2');
  assert.equal(move.to, 'e4');
  assert.equal(move.san, 'e4');
  assert.equal(game.turn(), 'b');
});

test('2048 does not finish an old move after cleanup during its animation', async () => {
  const source = await readFile(path.join(root, '2048.js'), 'utf8');
  const boardElement = {
    addEventListener() {},
    removeEventListener() {}
  };
  const document = {
    addEventListener() {},
    removeEventListener() {},
    getElementById() { return boardElement; }
  };
  const Game2048 = vm.runInNewContext(`${source}\n;Game2048;`, {
    document,
    localStorage: { getItem() { return null; }, setItem() {} },
    setTimeout
  });
  const game = new Game2048();
  game.board = [[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  game.isActive = true;
  game.addNewTile = () => {};
  game.updateBoard = () => {};
  game.updateScores = () => {};
  let ended = false;
  game.endGame = () => { ended = true; };

  const oldMove = game.move('left');
  game.cleanup();
  await oldMove;
  assert.equal(ended, false);
  assert.equal(game.isActive, false);
});

