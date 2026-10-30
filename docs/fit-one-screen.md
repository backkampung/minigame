# All games fit on one screen, no page scroll + Tetris Pause hardcoded to the middle

Branch: `tetris-swipe-one-cell`, continuing from the already-merged PR #5
(main `7d55b7d3`). This work adds fit-to-screen for every game, on top of
the Tetris gesture work on the same branch.

## Why this change was made

Tetris already fit on one screen, but the other games did not reliably:
on a shorter phone, or in short landscape, the board + header + buttons
+ move list + tips added up to more than the viewport height, so the
page scrolled. Tetris Pause also drifted: it was centred in portrait,
but in short landscape it sat in a side column next to the board.

The intended effect is: every game (2048, Snake, Tetris, chess, and the
chess setup screen) fits within one viewport height, with no page
scroll, and Tetris Pause is always in the middle.

## What changed, and the intended effect of each change

### `main.js` — a `game-active` flag for every game

- `startGame()` and `openChessSetup()` add `game-active` to `body`;
  `stopCurrentGame()` (which the back button already calls) removes it.
  Intended effect: CSS can tell "a game is open" for all four games,
  not only Tetris (which already had `tetris-active`).

### `style.css` — boards shrink with viewport height, page never scrolls

- `body.game-active { overflow: hidden; }` — the page itself cannot
  scroll while a game is open. This is a guard, not the mechanism:
  the sizing rules below are what make the content fit, so nothing
  important is clipped.
- Non-Tetris games: `.game-container` becomes a centred flex column
  capped at `100svh - 56px - safe-area`. Intended effect: the container
  itself cannot exceed the viewport.
- Square boards (2048, Snake): width =
  `min(100%, 500px, 100svh - 290px)`, where 290px is the estimated
  chrome (back button + header + New game + tips + body padding).
  Intended effect: on a tall phone the width limit wins and the board
  is full size; on a short screen the height limit wins and the board
  shrinks instead of pushing content below the fold.
- Chess board: width =
  `min(100%, 480px, 100svh - 450px)` (larger chrome: wrapped header,
  player boxes, move list). The selector uses `#game-board.chess-board`
  on purpose, so it beats the square-board rule, which also matches
  the chess board element. The move list keeps a 72px cap and scrolls
  internally when long — the page still does not scroll.
- Chess setup: padding and gaps reduced, capped at `100svh - 300px`
  with internal scroll only on extremely short screens.
- Short landscape (height <= 520px): square boards use
  `100svh - 200px`, chess uses `100svh - 220px` and the move list is
  hidden (it would otherwise shrink the chess board to an unplayable
  size), tips are hidden. Intended effect: even a 360px-tall landscape
  phone fits, with a smaller but playable board.

### `style.css` — Tetris Pause hardcoded to the middle

- `.tetris-active .tetris-controls` is explicitly centred
  (`justify-self: stretch; place-items: center`) and its button has
  `margin-inline: auto`, with a comment stating it is hardcoded to
  the middle.
- Short landscape no longer uses the old "board left, buttons right"
  layout. The grid is stacked exactly like portrait
  (back/scores/new, next, board, pad), so Pause stays in its own
  centred row under the board in every orientation.
- To make that stacked landscape layout fit, its chrome is 120px
  (back button shortened to 36px, Pause button to 44px, Tetris
  padding to 4px). A 360px-tall landscape screen then gives a
  120px-wide, 240px-tall board: 120px chrome + 240px board = 360px.
  Intended effect: Pause cannot be pushed to a side by any
  orientation or screen size.

### `index.html` — cache-busting only

- Stylesheet `style.css?v=3` -> `?v=4`, `main.js` -> `main.js?v=4`,
  so browsers fetch the new fit rules and the new `game-active`
  logic instead of cached copies. No layout change in the HTML itself.

## What did NOT change

- Game rules, scoring, gravity, gestures (16px swipe, 300ms long-press),
  7-bag, Next preview, keyboard controls, chess engine, or the menu.
- Tetris portrait layout and chrome (120px on small phones, 154px
  otherwise) are unchanged, apart from the explicit Pause centring.
- The chess move list is still shown on portrait and taller screens;
  it is only hidden on short landscape screens.

## Height audit (board + chrome vs viewport height)

- 360x740 phone: 2048/Snake board 336px, total 626px; chess board
  290px, total 740px; Tetris board 310x620, total 740px. All fit.
- 360x640 phone: 2048/Snake total 626px; chess board 190px, total
  640px; Tetris board 260x520, total 640px. All fit.
- 412x915 phone: chess board 388px, total 838px; Tetris board
  360x720, total 840px. All fit.
- 700x360 landscape: 2048/Snake board 160px, total 360px; chess
  board 140px, total 360px; Tetris board 120x240, total 360px.
  All fit, with smaller boards — that is the trade-off for no scroll
  on a very short screen.
- 1920x1080 desktop: boards are width-limited (500px / 480px /
  360px), totals 790px / 930px / 874px. All fit.

## Risks and trade-offs

- On very short screens boards get small; that is deliberate, because
  the alternative is page scroll, which was the requirement to remove.
- `overflow: hidden` on the body while a game is open means any future
  element added to the game screen that exceeds the viewport will be
  clipped instead of scrollable. Any new game-screen element must be
  counted in the chrome estimates above.
- Chess move history is invisible on short landscape screens only.
  It returns as soon as the screen is taller or rotated to portrait.

## How to test

1. Open each game (2048, Snake, Tetris, chess setup, chess in play)
   on a phone in portrait: no vertical scroll, board fully visible.
2. Rotate to landscape on a short phone: same, no scroll, and Tetris
   Pause is centred under the board, not on the right.
3. Play Tetris: gestures, Pause/Resume, New game, and back to menu
   (menu must scroll normally again — `game-active` is removed).
4. Play chess to at least 10 moves: move list scrolls internally,
   page does not scroll.

## Rollback

Pre-branch main is `7d55b7d3` (the PR #5 merge). Reverting the merge
of this work restores the previous fit behaviour (Tetris only) and
the old landscape Tetris side-column layout.
