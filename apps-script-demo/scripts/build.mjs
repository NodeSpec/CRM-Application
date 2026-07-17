// Copy the single-file Vite build into the Apps Script project as `Index.html`.
// Apps Script HtmlService serves this file verbatim (inline JS/CSS is allowed in
// the IFRAME sandbox). Run automatically via `npm run build` (postbuild).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(dir, "../web/dist/index.html");
const dest = path.resolve(dir, "../appsscript/Index.html");

if (!existsSync(src)) {
  console.error(`[build] ${src} not found — run the web build first.`);
  process.exit(1);
}

const html = readFileSync(src, "utf8");
writeFileSync(dest, html);
console.log(`[build] wrote ${(html.length / 1024).toFixed(0)} KiB -> appsscript/Index.html`);
