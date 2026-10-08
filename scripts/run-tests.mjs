// I test del repo (08/10/2026, gemello di triestevillas-web). Niente runner:
// `tsc -p tsconfig.test.json` compila i file elencati lì, e ogni *.test.js
// compilato si esegue con node — esce 1 alla prima differenza.
// Gira da `npm test` e dal prebuild. Un test nuovo si aggiunge a
// tsconfig.test.json → include.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(join(root, "tsconfig.test.json"), "utf8"));
const OUT = resolve(root, cfg.compilerOptions.outDir);
rmSync(OUT, { recursive: true, force: true });
execFileSync(process.execPath, [join(root, "node_modules/typescript/bin/tsc"), "-p", join(root, "tsconfig.test.json")], {
  stdio: "inherit",
  cwd: root,
});

const test = [];
const giro = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) giro(p);
    else if (n.endsWith(".test.js")) test.push(p);
  }
};
giro(OUT);
let rotti = 0;
for (const t of test.sort()) {
  try {
    execFileSync(process.execPath, [t], { stdio: "inherit" });
  } catch {
    rotti++;
  }
}
rmSync(OUT, { recursive: true, force: true });
if (!test.length) {
  console.error("✗ test: nessun file compilato — tsconfig.test.json non include niente?");
  process.exit(1);
}
if (rotti) {
  console.error(`✗ test: ${rotti} file su ${test.length} falliti`);
  process.exit(1);
}
console.log(`✓ test: ${test.length} file, tutti verdi`);
