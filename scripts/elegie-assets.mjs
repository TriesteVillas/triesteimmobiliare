// Asset della scena Elegie Duino (scheda annuncio): render al tramonto dal sito
// dedicato in webp a tre larghezze + crop 4:5 per i telefoni, e il logo ufficiale
// «castello» bianco a due misure. Una tantum: l'output sta in
// public/progetti/elegie/ ed è committato. Sorgente: il repo statico del sito
// dedicato (~/dev/elegie-duino), gli stessi file che elegieduino.it serve.
//   node scripts/elegie-assets.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";

const SRC = `${homedir()}/dev/elegie-duino/assets/`;
const OUT = "public/progetti/elegie/";
mkdirSync(OUT, { recursive: true });

const sunset = SRC + "images/exterior-sunset-garden.jpg";
for (const w of [768, 1280, 1920, 2400]) {
  await sharp(sunset).resize({ width: w }).webp({ quality: 72, effort: 6 })
    .toFile(`${OUT}sunset-${w}.webp`);
}
// Crop 4:5 per < 640px: i volumi illuminati stanno a destra.
for (const w of [720, 1080]) {
  await sharp(sunset).resize({ width: w, height: Math.round(w * 1.25), fit: "cover", position: "right" })
    .webp({ quality: 72, effort: 6 }).toFile(`${OUT}sunset-m-${w}.webp`);
}
const logo = sharp(SRC + "logos/logo-castello-white.png").trim();
await logo.clone().resize({ width: 640 }).png({ compressionLevel: 9 }).toFile(OUT + "logo-white.png");
await logo.clone().resize({ width: 96 }).png({ compressionLevel: 9 }).toFile(OUT + "logo-white-96.png");
console.log("ok: public/progetti/elegie/");
