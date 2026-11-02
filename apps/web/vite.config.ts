import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
  const env = loadEnv(mode, repositoryRoot, "");
  const proxyTarget =
    process.env.API_PROXY_TARGET || env.API_PROXY_TARGET || "http://localhost:4000";

  return {
    plugins: [react(), tailwindcss()],
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      restoreMocks: true,
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      watch: {
        usePolling: true,
      },
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
