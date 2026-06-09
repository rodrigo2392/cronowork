import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Read VITE_* variables from the single .env at the monorepo root.
  envDir: resolve(__dirname, "..", ".."),
  server: {
    port: 5750,
    open: true,
  },
});
