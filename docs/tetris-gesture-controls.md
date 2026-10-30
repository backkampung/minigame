# Tetris mobile controls: one swipe = one cell, no direction buttons

Branch: `tetris-swipe-one-cell` (from `main` at `d463611`).

## Why this change was made

Playing Tetris on a phone was still difficult. The old controls had two
problems:

1. Dragging on the board moved one cell per 24px dragged, so a slightly
   longer drag moved the piece two or three cells by accident.
2. The six on-screen buttons (left, rotate, right, down, drop, pause)
   took up vertical space that the board could have used, so the board
   stayed small on a tall phone screen.

The intended effect of this change is: the board is controlled entirely
by gestures on the board itself, the direction/drop buttons are gone,
and the freed space makes the board bigger.

## What changed, and the intended effect of each change

### `tetris.js` — board gestures replace dragging and the flick-down hard drop

- **Swipe left / right = move exactly one cell left / right.**
  A touch that moves more than 24px from its start point, with horizontal
  movement larger than vertical movement, moves the piece one cell.
  Further movement in the same touch is ignored. To move another cell,
  lift the finger and swipe again. Intended effect: one deliberate swipe
  can never overshoot by two or three cells.
- **Swipe down = move exactly one cell down (soft drop).**
  Same 24px threshold, vertical movement larger than horizontal movement,
  and the movement is downwards. Intended effect: down behaves exactly
  like left and right, so the three directions are consistent to learn.
- **Tap = rotate, unchanged.**
  A touch that lifts within 400ms and moves less than 24px still rotates
  the piece once. Intended effect: the one gesture that already felt
  good is not changed.
- **Long-press = hard drop.**
  Holding the finger still on the board for 500ms drops the piece
  instantly to the bottom. Any swipe cancels the long-press timer, and
  lifting the finger cancels it too. Intended effect: fast dropping is
  still available, but it can no longer happen by accident the way the
  old fast flick-down hard drop could.
- **Removed: flick-down hard drop.**
  The old rule (downward flick over 80px in under 500ms = hard drop) is
  deleted. A fast downward swipe now only moves one cell down.
  Intended effect: no more accidental hard drops when the player only
  meant to move down one cell.
- **Removed: upward swipe does nothing.**
  An upward swipe counts as a swipe (so lifting the finger after it does
  not rotate the piece), but it does not move the piece. There is no
  upward move in Tetris.
- **Status text updated.**
  The status line under the board now reads "Swipe = 1 cell · Tap =
  rotate · Long-press = hard drop", so the gestures are visible in the
  game instead of only being documented here.
- **Long-press timer is cleared on cleanup.**
  Leaving the game or starting a new game cannot leave a pending timer
  that hard-drops a piece in the new game.

### `index.html` — direction and drop buttons removed, Pause kept

- Removed from `#tetris-controls`: left, rotate, right, down, drop.
- Kept: Pause (with its existing Resume toggle). Phones have no keyboard,
  so without this button there would be no way to pause on mobile.
  Intended effect: the button row shrinks to one centred button.

### `style.css` — the freed space goes to the board

- `.tetris-active .tetris-controls` is now a single centred Pause button
  (minimum width 120px) instead of a six-button grid.
- `--tetris-chrome` (vertical space used by everything except the board)
  drops from 224px to 154px on desktop, and from 184px to 120px on
  small portrait phones, because the button row is gone. The board width
  is `min(100%, 360px, (100svh - --tetris-chrome) / 2)`, so on a 700px-tall
  phone the board grows from about 238px wide to about 273px wide
  (about 15% wider, and twice that in height, since the board is 1:2).
  Intended effect: a visibly larger board on the same phone.

## What did NOT change

- Keyboard controls: ArrowLeft / ArrowRight move, ArrowUp rotates,
  ArrowDown soft-drops, Space hard-drops, P pauses. Desktop play is
  unchanged.
- Scoring, gravity, levels, the 7-bag piece generator, the Next preview,
  the pause overlay, and the game-over screen.
- The other games (2048, Snake, chess), the main menu, and the New game
  and Games buttons.
- The button click / pointer handlers in `tetris.js` are still present
  because the Pause button still uses them; the other actions in
  `doControlAction` are now unreachable from the UI, since their buttons
  no longer exist.

## Risks and trade-offs

- Moving two cells now needs two separate swipes, which is slower than
  the old drag. That is deliberate: accuracy was chosen over speed, and
  long-press hard drop covers the case where the player wants to drop
  fast.
- A 500ms long-press can feel slow the first few times. If it feels
  wrong in real play, the threshold to try first is 400ms, not a return
  to flick-down hard drop.
- A swipe that starts on the Pause button is a button press, not a board
  gesture, because the button sits outside the board element.
- Mouse users: clicking on the board does nothing, exactly as before.
  Board control on desktop is by keyboard.

## How to test

1. Open Tetris on a phone. Swipe left once: the piece moves exactly one
   cell left, even if the swipe is long.
2. Swipe down once: the piece moves exactly one cell down, and does not
   hard-drop, even on a fast swipe.
3. Tap the board: the piece rotates once.
4. Press and hold the board for about half a second: the piece hard-drops.
5. Check the board is larger than before on the same phone, and that
   only the Pause button remains under the board.
6. Check desktop keyboard play still works (arrows, Space, P).

## Rollback

Reverting this branch restores the previous behaviour: drag-to-move
(one cell per 24px), flick-down hard drop, and all six Tetris buttons.
The pre-branch `main` commit is `d463611`.
