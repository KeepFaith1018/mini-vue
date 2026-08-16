import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@vue/share": resolve(__dirname, "packages/share/src/index.ts"),
      "@vue/reactivity": resolve(__dirname, "packages/reactivity/src/index.ts"),
      "@vue/runtime-core": resolve(__dirname, "packages/runtime-core/src/index.ts"),
      "@vue/runtime-dom": resolve(__dirname, "packages/runtime-dom/src/index.ts"),
      "@vue/compiler-core": resolve(
        __dirname,
        "packages/compiler-core/src/index.ts"
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["packages/**/*.spec.ts"],
  },
});
