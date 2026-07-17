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

let html = readFileSync(src, "utf8");

// Apps Script's sandboxed iframe does not execute inline ES-module scripts.
// The bundle is built as a classic IIFE; strip the leftover module markers so
// the inline <script> runs as a classic script.
html = html
  .replace(/<script\s+type="module"([^>]*)>/g, "<script$1>")
  .replace(/\s+crossorigin(?==?)/g, "")
  .replace(/<link[^>]+rel="modulepreload"[^>]*>/g, "");

// Strip astral (emoji) characters entirely — they only ever appear as escaped
// surrogate pairs (\uD83x\uDCxx) in string literals here, and add no value to
// the demo. Removes any residual multibyte-corruption risk.
html = html.replace(/\\u[dD][89abAB][0-9a-fA-F]{2}\\u[dD][c-fC-F][0-9a-fA-F]{2}/g, "");

if (/type="module"/.test(html)) {
  console.error("[build] WARNING: a type=module script survived — it will not run in Apps Script.");
}
// Non-ASCII anywhere is a red flag for Apps Script serving.
const nonAscii = (html.match(/[^\x00-\x7F]/g) || []).length;
if (nonAscii) console.error(`[build] WARNING: ${nonAscii} non-ASCII char(s) remain in the bundle.`);

writeFileSync(dest, html);
console.log(`[build] wrote ${(html.length / 1024).toFixed(0)} KiB -> appsscript/Index.html`);
