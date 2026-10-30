# Tetris Pause fix: Pause moved above the board, chrome corrected

Branch: `tetris-swipe-one-cell`, continuing after PR #6 (main `f02c23c`).

## Bug reported on a phone

After PR #6, opening Tetris on a phone showed Pause hidden below the
screen, and the page could not be scrolled to reach it — so the game
effectively could not be paused.

## Root cause

The Tetris board width was computed from `--tetris-chrome`, the
estimated height of everything except the board. That estimate was
wrong: it was 154px (desktop) / 120px (small phones), but the real
rows add up to about 208px on a small phone (back/scores row ~50 +
Pause row 60 + Next ~30 + grid gaps 24 + body/tetris padding 44).
A board sized from 120px was therefore too tall, pushed Pause below
the fold, and `body.game-active { overflow: hidden; }` (added for the
no-scroll requirement) removed the only way to reach it.

## Fix

1. **Pause moved above the board.** The Tetris grid order is now:
   back/scores/new, Pause, Next, board, status (portrait/desktop),
   and back/scores/new, Pause, board (landscape). Pause is in its own
   centred row, still hardcoded to the middle, but now above the board
   instead of below it, so it is on screen even if the board ever
   overflows again.
2. **Chrome corrected.** Desktop `--tetris-chrome` 154px -> 280px
   (back 50 + Pause 48 + Next 30 + status 40 + gaps 32 + padding 72
   = ~272, rounded up). Small phones 120px -> 220px (back 50 + Pause
   60 + Next 30 + gaps 24 + padding 44 = 208, rounded up). Landscape
   stays 120px, which is correct there (no Next, no status, shorter
   buttons).
3. **Stylesheet cache-busted to `?v=5`** in `index.html`, because
   phones that already fetched `?v=4` would otherwise keep the broken
   CSS.

## Re-audit (actual rows + board height vs viewport height)

- Small phone 640px tall: board 210x420, total 628px. Fits.
- Small phone 740px tall: board 260x520, total 728px. Fits.
- Small phone 915px tall: board 347x694, total 902px. Fits.
- Desktop 900px tall: board 310x620, total 892px. Fits.
- Desktop 1080px tall: board 360x720, total 992px. Fits.
- Landscape 360px tall: board 120x240, total 360px. Fits.

## Unchanged

- Gestures, scoring, gravity, 7-bag, Next preview, keyboard controls,
  other games, and the no-scroll rule for game screens. Only the
  Tetris grid order and chrome values changed, plus the stylesheet
  version in `index.html`.

## Rollback

Pre-fix main is `f02c23c` (PR #6). Reverting this fix restores Pause
below the board with the old (wrong) chrome values.
