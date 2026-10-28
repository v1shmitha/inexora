import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Tests never load real env vars or talk to Supabase; mock what you need.
    env: { SKIP_ENV_VALIDATION: "1" },
    clearMocks: true,
  },
});
