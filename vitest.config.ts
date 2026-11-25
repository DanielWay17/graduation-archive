import { defineConfig } from "vitest/config";

// Separate from vite.config.ts so unit tests don't start the Cloudflare/React Router plugins.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["app/**/*.test.ts"],
    environment: "node",
  },
});
