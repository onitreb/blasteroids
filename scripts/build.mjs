import { build, context } from "esbuild";
import { rm, mkdir } from "node:fs/promises";
import process from "node:process";

const args = new Set(process.argv.slice(2));
const shouldWatch = args.has("--watch");
const shouldClean = args.has("--clean");

const distDir = "dist";
const outFile = `${distDir}/blasteroids.js`;

if (shouldClean) {
  await rm(distDir, { recursive: true, force: true });
  process.exit(0);
}

await mkdir(distDir, { recursive: true });

const common = {
  entryPoints: ["src/app/index.js"],
  outfile: outFile,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  sourcemap: false,
  minify: false,
  logLevel: "info",
};

if (shouldWatch) {
  const ctx = await context(common);
  await ctx.watch();
  console.log(`[build] watching (output: ${outFile})`);
  process.on("SIGINT", async () => {
    await ctx.dispose();
    process.exit(0);
  });
  await new Promise(() => {});
} else {
  await build(common);
}
