import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: path.join(root, "$1") },
      // "server-only" throws outside React Server Components; tests run in plain Node.
      { find: "server-only", replacement: path.join(root, "tests/stubs/server-only.js") },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{js,jsx}"],
  },
});
