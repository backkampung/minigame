# Browser Arcade

A lightweight browser game collection with 2048, Snake, and Tetris. It uses plain HTML, CSS, and JavaScript, so no build step or package installation is needed.

## Play locally

Open `index.html` in a modern browser. For the most consistent behavior, serve the folder with any static file server.

## Controls

- **2048:** Arrow keys or W/A/S/D on a keyboard; swipe on the board on touch screens.
- **Snake:** Arrow keys or W/A/S/D on a keyboard; swipe on the board on touch screens.
- **Tetris:** Left/right move, up rotates, down soft-drops, Space hard-drops, and P pauses. On phones, use the on-screen buttons below the board.
- Use **New game** to restart and **Games** to return to the menu.

Best scores are saved in the browser on the current device. Tetris awards points for dropping pieces and clearing lines; speed increases as you clear more lines.

## Publish with GitHub Pages

1. Create a GitHub repository and upload the files in this folder to its root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, choose the default branch and the `/ (root)` folder, then save.
4. Open the Pages URL shown in the repository settings after deployment completes.

This project is static and uses relative file paths, which makes it suitable for a repository root or a GitHub Pages project site.
