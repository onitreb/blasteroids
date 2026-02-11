import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { DEBUG_MENU_CONTROL_IDS } from "../src/ui/createUiBindings.js";

function extractInteractiveMenuIds(html) {
  const ids = new Set();
  const tagRe = /<(input|select)\b[^>]*\bid="([^"]+)"[^>]*>/gi;
  let m;
  while ((m = tagRe.exec(html))) {
    const id = m[2];
    if (id === "ship-explode" || id.startsWith("dbg-") || id.startsWith("tune-")) ids.add(id);
  }
  return ids;
}

test("debug menu interactive controls are fully represented in metadata", () => {
  const html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
  const htmlIds = extractInteractiveMenuIds(html);
  const metaIds = new Set(DEBUG_MENU_CONTROL_IDS);

  for (const id of htmlIds) {
    assert.ok(metaIds.has(id), `missing metadata entry for #${id}`);
  }
  for (const id of metaIds) {
    assert.ok(htmlIds.has(id), `metadata id not present in index.html: #${id}`);
  }
});

