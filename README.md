# INSTALLATION PROCEDURES

1. Check if your [Node.js](https://nodejs.org/) version is >= **10.13**.
2. Run `npm install` to install the dependencies.
3. Run `npm start`.
4. Delete `manifest.json` from `build/`. The Firefox manifest is already provided in the `extension/`.
5. Copy `background.bundle.js`, `background.bundle.js.map`, `contentScript.bundle.js`, `contentScript.bundle.js.map`, `options.bundle.js`, `options.bundle.js.map` into `extension/js`.
6. Copy `options.html` into `extension/html`.
7. Uncomment `script` and `img` tags in `options.html`.
8. Copy `content.style.css` into `extension/css`.
9. Copy the contents of `background.js` at the end of `background.bundle.js` and delete `background.js` from `extension/js`.

Extension is completely set up.

CanvasU is built using repurposed code from two open-source projects. View those projects here:
- Better Canvas: https://github.com/ksucpea/bettercanvas
- Tasks for Canvas: https://github.com/jtcheng26/canvas-task-extension
