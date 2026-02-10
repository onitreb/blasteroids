// Composition root (browser). Keep this file small and boring.
//
// Today this imports the existing monolithic game file for side effects.
// Next refactor steps will move boot/render/input wiring into `src/app/`
// and split the game into engine/render/ui modules.
import "../main.js";

