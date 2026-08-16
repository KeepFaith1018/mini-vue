import { build } from "esbuild";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packagesDir = resolve(root, "packages");
const packages = await readdir(packagesDir, { withFileTypes: true });

await Promise.all(
  packages
    .filter((entry) => entry.isDirectory())
    .map(async (entry) => {
      const packageDir = resolve(packagesDir, entry.name);
      const packageJson = JSON.parse(
        await readFile(resolve(packageDir, "package.json"), "utf8")
      );
      await build({
        entryPoints: [resolve(packageDir, "src/index.ts")],
        outfile: resolve(packageDir, `dist/${entry.name}.js`),
        bundle: true,
        platform: "browser",
        sourcemap: true,
        format: "esm",
        globalName: packageJson.buildOptions.name,
      });
    })
);
