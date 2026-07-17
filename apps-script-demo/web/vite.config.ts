import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const coreSrc = path.resolve(dir, "../../services/web/src");
const gasClient = path.resolve(dir, "src/gasClient.ts");
const gasAuth = path.resolve(dir, "src/gasAuth.tsx");

/**
 * Redirect the two server-coupled modules of the core frontend to the Apps
 * Script adapters, without touching the core repo. Every other file (App, pages,
 * components, styles) is imported verbatim from services/web/src.
 */
function gasOverrides() {
  return {
    name: "gas-overrides",
    enforce: "pre" as const,
    resolveId(source: string) {
      if (source === gasClient || source === gasAuth) return null;
      if (source.endsWith("api/client")) return gasClient;
      if (source.endsWith("auth/AuthContext")) return gasAuth;
      return null;
    },
  };
}

// Single self-contained index.html (inlined JS+CSS) that Apps Script can serve
// verbatim as an HtmlService file.
export default defineConfig({
  root: dir,
  plugins: [gasOverrides(), react(), viteSingleFile()],
  resolve: {
    alias: { "@web": coreSrc },
  },
  build: {
    outDir: path.resolve(dir, "dist"),
    sourcemap: false,
    // Inline everything so there are no separate asset requests.
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 5000,
  },
});
