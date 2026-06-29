import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    // Tests aquí son lógica pura: sin DB, sin red, sin Google.
    // Los flujos de extremo a extremo se cubren con la checklist manual
    // en docs/QA-checklist-v1.md.
  },
});
