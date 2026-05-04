import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/routes/**/*.test.ts"],
    globalSetup: "./src/test/global-setup.ts",
    pool: "forks",
    singleFork: true,
    passWithNoTests: true,
  },
});
