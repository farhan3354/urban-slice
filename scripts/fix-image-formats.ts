// Re-encode the mislabeled image files (JPEG bytes saved as .png) into real PNGs
// so the browser decodes them reliably with Content-Type: image/png.
import sharp from "sharp";
import fs from "fs";
import path from "path";

const DIR = path.join(process.cwd(), "public", "images");

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".png"));
  let fixed = 0;
  for (const f of files) {
    const fp = path.join(DIR, f);
    const buf = fs.readFileSync(fp);
    // Detect JPEG magic bytes FF D8 FF
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    if (!isJpeg) {
      console.log(`SKIP ${f} (already PNG)`);
      continue;
    }
    try {
      const pngBuf = await sharp(buf).png().toBuffer();
      fs.writeFileSync(fp, pngBuf);
      console.log(`FIXED ${f} (${buf.length}B jpeg -> ${pngBuf.length}B png)`);
      fixed++;
    } catch (e) {
      console.error(`ERR ${f}: ${e.message}`);
    }
  }
  console.log(`--- ${fixed} files re-encoded to real PNG ---`);
}

main().catch((e) => { console.error(e); process.exit(1); });
