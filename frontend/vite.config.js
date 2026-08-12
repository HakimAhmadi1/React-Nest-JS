import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      // fileURLToPath instead of __dirname: this file is ESM, and the CommonJS
      // global is what made `npm run lint` fail on a clean checkout.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Function form: Vite 8's rolldown bundler rejects the object form.
        // Keeps vendor libraries in their own long-lived, cacheable chunks.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(
              id,
            )
          ) {
            return "react";
          }
          if (id.includes("@tanstack")) return "query";
          if (/react-hook-form|@hookform|zod/.test(id)) return "forms";
          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    css: false,
  },
});
