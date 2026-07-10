import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// SPA build. During local `vite dev`, proxy API + auth to the reverse proxy so
// the same relative paths (/api/v1, /auth) work as in the container.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:80",
      "/auth": "http://localhost:80",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
