# Browser Arcade

A lightweight browser game collection with 2048, Snake, Tetris, and chess. The site is static and needs no build step. Chess uses the bundled `chess-engine.js` rules library, so gameplay does not depend on a third-party content delivery network. The library is from [chess.js](https://github.com/jhlywa/chess.js); see `LICENSE-chess.js.txt` for its license.

## Play locally

Open `index.html` in a modern browser. For the most consistent behavior, serve the folder with any static file server.

## Controls

- **2048:** Arrow keys or W/A/S/D on a keyboard; swipe on the board on touch screens.
- **Snake:** Arrow keys or W/A/S/D on a keyboard; swipe on the board on touch screens. Snake has no pause button and no pause key: to stop a game, use **New game** or **Games** to return to the menu.
- **Tetris:** Left/right move, up rotates, down soft-drops, Space hard-drops, and P pauses. On touch screens, swipe left, right, or down to move exactly one cell, tap the board to rotate, and press and hold the board (300ms) to hard-drop. Tetris uses the same layout as 2048: Games, Score/Best, and New game in the same positions, with Next above the board and the **Pause** button below the board, centred, and the same size as **New game** (padding 9px 16px, minimum height 44px). The Games button is a full-width centred bar on every game, and the Tetris operation-instructions line below the board is removed (Paused and game-over are still shown by the board overlay and the Pause/Resume button).
- **Human vs Machine (Chess):** You play White against Charlie (Machine) as Black. Choose Easy, Moderate, or Hard before starting. Tap/click a piece, then a highlighted square. Pawn promotions let you choose a piece.
- Use **New game** to restart and **Games** to return to the menu.

## Layout

Every game fits on one screen with no page scrolling: boards shrink on short screens instead of pushing content below the fold. On Tetris, the Pause button is always in the middle below the board. On chess, the board fills its container width (up to 560px) without going edge-to-edge, and piece size is tied to the board (10% of board width, 80% of one square), so a piece can never be larger than its square. The move history scrolls inside its own list on taller screens and is hidden on very short landscape screens.

Best scores are saved in the browser on the current device. Tetris awards points for dropping pieces and clearing lines; speed increases as you clear more lines. Chess difficulty changes Charlie's in-browser search depth; Hard searches deeper, but is not an unbeatable engine.

## Publish with GitHub Pages

1. Create a GitHub repository and upload the files in this folder to its root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, choose the default branch and the `/ (root)` folder, then save.
4. Open the Pages URL shown in the repository settings after deployment completes.

This project is static and uses relative file paths, which makes it suitable for a repository root or a GitHub Pages project site.
