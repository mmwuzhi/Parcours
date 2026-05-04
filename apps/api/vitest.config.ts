import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["src/routes/**/*.test.ts"],
    passWithNoTests: true,
  },
});
