Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
# Browser Arcade

A lightweight browser game collection with 2048, Snake, Tetris, and chess. The site is static and needs no build step. Chess uses the locally bundled `chess-engine.js` rules library, so gameplay does not depend on a third-party CDN. See the [chess.js project](https://github.com/jhlywa/chess.js) and the included `LICENSE-chess.js.txt`.

## Play locally

Serve the folder with a local HTTP server, then open its URL in a modern browser. This avoids browser restrictions on JavaScript modules opened directly from `file://`.

For example, with Node.js installed, run `npx serve .` from this folder and open the URL printed in the terminal.

## Checks

Run the lightweight automated checks with `node --test tests/*.test.mjs`. They validate the JavaScript syntax, bundled chess rules, and 2048 behavior when a game is exited during a move animation.

Before publishing, also open the site on a desktop browser and a phone-sized viewport. Confirm that keyboard controls, touch swipes, Tetris buttons, chess difficulty selection, and the chess board remain usable.

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

