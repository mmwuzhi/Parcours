import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  splitting: false,
  // Bundle workspace packages (TypeScript source) directly into the dist.
  // Without this, @parcours/shared ships as ./src/index.ts which Node.js
  // cannot import in the production runner (no tsx, no extensionless resolution).
  noExternal: [/^@parcours\//],
})
