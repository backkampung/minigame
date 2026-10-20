# Browser Arcade

A lightweight browser game collection with 2048, Snake, Tetris, and chess. The site is static and needs no build step. Chess uses the bundled `chess-engine.js` rules library, so gameplay does not depend on a third-party content delivery network. The library is from [chess.js](https://github.com/jhlywa/chess.js); see `LICENSE-chess.js.txt` for its license.

## Play locally

Open `index.html` in a modern browser. For the most consistent behavior, serve the folder with any static file server.

## Controls

- **2048:** Arrow keys or W/A/S/D on a keyboard; swipe on the board on touch screens.
- **Snake:** Arrow keys or W/A/S/D on a keyboard; swipe on the board on touch screens.
- **Tetris:** Left/right move, up rotates, down soft-drops, Space hard-drops, and P pauses. On phones, use the on-screen buttons below the board.
- **Human vs Machine (Chess):** You play White against Charlie (Machine) as Black. Choose Easy, Moderate, or Hard before starting. Tap/click a piece, then a highlighted square. Pawn promotions let you choose a piece.
- Use **New game** to restart and **Games** to return to the menu.

Best scores are saved in the browser on the current device. Tetris awards points for dropping pieces and clearing lines; speed increases as you clear more lines. Chess difficulty changes Charlie's in-browser search depth; Hard searches deeper, but is not an unbeatable engine.

## Publish with GitHub Pages

1. Create a GitHub repository and upload the files in this folder to its root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, choose the default branch and the `/ (root)` folder, then save.
4. Open the Pages URL shown in the repository settings after deployment completes.

This project is static and uses relative file paths, which makes it suitable for a repository root or a GitHub Pages project site.
