import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    restoreMocks: true,

    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov", "json-summary"],
      include: [
        "client/src/**/*.{ts,tsx}",
        "server/**/*.ts",
        "shared/**/*.ts",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
        "**/dist/**",
        "server/vite.ts",
        "server/index.ts",
        "server/static.ts",
        "server/db.ts",
        "**/*.config.{ts,js}",
      ],
      reportsDirectory: "./coverage",
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        perFile: false,
      },
    },

    projects: [
      {
        extends: true,
        plugins: [react()],
        resolve: {
          alias: {
            "@": path.resolve(import.meta.dirname, "client", "src"),
            "@shared": path.resolve(import.meta.dirname, "shared"),
            "@assets": path.resolve(import.meta.dirname, "attached_assets"),
          },
        },
        test: {
          name: "client",
          environment: "jsdom",
          include: ["client/src/**/*.{test,spec}.{ts,tsx}"],
          setupFiles: ["./client/src/test/setup.ts"],
        },
      },
      {
        resolve: {
          alias: {
            "@shared": path.resolve(import.meta.dirname, "shared"),
          },
        },
        test: {
          name: "server",
          environment: "node",
          include: [
            "server/**/*.{test,spec}.ts",
            "shared/**/*.{test,spec}.ts",
          ],
          setupFiles: ["./server/test/setup.ts"],
        },
      },
    ],
  },
});
