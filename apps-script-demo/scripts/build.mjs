// Wrap the single-file Vite build into an Apps-Script-safe Index.html.
//
// Apps Script serves your HTML into the sandbox iframe via document.write(...).
// A 300 KB minified React bundle inevitably contains sequences (e.g. "</script"
// look-alikes, escapes) that break that write with:
//   "Failed to execute 'write' on 'Document': Invalid or unexpected token".
// So we do NOT ship the JS/CSS as raw inline text. We base64-encode both — a
// charset (A-Z a-z 0-9 + / =) that cannot contain <, >, quotes, backslashes or
// newlines — and a tiny bootstrap decodes them and injects a <style> + <script>
// at runtime. The served HTML is then immune to the document.write breakage.
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

const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const biggest = (arr) => arr.reduce((a, b) => (b.length > a.length ? b : a), "");
const js = biggest(scripts);
const css = biggest(styles);

if (!js) {
  console.error("[build] could not find the bundle <script> in the Vite output.");
  process.exit(1);
}

const b64 = (s) => Buffer.from(s, "utf8").toString("base64");

const out = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CRM Platform &mdash; Sheets demo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400..700,0..1,0&display=swap" rel="stylesheet" />
    <script>
      window.onerror = function (m, s, l, c) {
        try {
          var d = document.getElementById("boot-error");
          if (!d) {
            d = document.createElement("pre");
            d.id = "boot-error";
            d.style.cssText = "position:fixed;inset:0;z-index:99999;margin:0;padding:16px;background:#fff;color:#b00020;white-space:pre-wrap;font:12px/1.5 monospace;overflow:auto";
            (document.body || document.documentElement).appendChild(d);
          }
          d.textContent += "JS error: " + m + " @ " + (s || "") + ":" + l + ":" + c + "\\n";
        } catch (_) {}
      };
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script>
      (function () {
        function dec(b) { return decodeURIComponent(escape(atob(b))); }
        var CSS_B64 = "${b64(css)}";
        var JS_B64 = "${b64(js)}";
        try {
          if (CSS_B64) {
            var st = document.createElement("style");
            st.textContent = dec(CSS_B64);
            document.head.appendChild(st);
          }
          var sc = document.createElement("script");
          sc.textContent = dec(JS_B64);
          document.body.appendChild(sc);
        } catch (e) {
          document.body.innerHTML =
            '<pre style="padding:16px;color:#b00020;white-space:pre-wrap;font:12px monospace">Bootstrap failed: ' +
            String(e && e.stack || e) + "</pre>";
        }
      })();
    </script>
  </body>
</html>
`;

writeFileSync(dest, out);
const nonAscii = (out.match(/[^\x00-\x7F]/g) || []).length;
console.log(
  `[build] wrote ${(out.length / 1024).toFixed(0)} KiB -> appsscript/Index.html ` +
    `(js ${(js.length / 1024).toFixed(0)}k, css ${(css.length / 1024).toFixed(0)}k, base64-wrapped)`
);
if (nonAscii) console.error(`[build] WARNING: ${nonAscii} non-ASCII char(s) in output (expected 1: the &mdash; is an entity).`);
