import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["./tests/**/*.test.ts"],
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
})
