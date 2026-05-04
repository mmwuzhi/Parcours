import { defineConfig } from "vitest/config";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(dir, "../../.env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}

export default defineConfig({
  test: {
    include: ["src/routes/**/*.test.ts"],
    globalSetup: "./src/test/global-setup.ts",
    pool: "forks",
    singleFork: true,
    passWithNoTests: true,
  },
});
