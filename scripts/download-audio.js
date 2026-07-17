#!/usr/bin/env node
/**
 * Download Quran reciter audio files from the Islamic Network CDN
 * into public/audio/{reciterId}/{ayahNumber}.mp3
 *
 * Usage:
 *   node scripts/download-audio.js                 # all 5 reciters
 *   node scripts/download-audio.js ar.alafasy      # one reciter only
 *
 * Resumes automatically — already-downloaded files are skipped.
 * Uses 5 concurrent downloads to keep things fast but polite.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// ── Config ───────────────────────────────────────────────────────────────────

const ALL_RECITERS = [
  "ar.alafasy",
  "ar.abdulbasitmurattal",
  "ar.husary",
  "ar.abdurrahmaansudais",
  "ar.saadalghamdi",
];

const TOTAL_AYAHS   = 6236;
const BITRATE       = 128;                           // kbps; use 64 for smaller files
const CDN_BASE      = `https://cdn.islamic.network/quran/audio/${BITRATE}`;
const OUTPUT_DIR    = path.join(__dirname, "../public/audio");
const CONCURRENCY   = 5;                             // parallel downloads

// ── Helpers ───────────────────────────────────────────────────────────────────

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve("skip"); return; }

    const tmp = dest + ".tmp";
    const file = fs.createWriteStream(tmp);

    const req = https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.existsSync(tmp) && fs.unlinkSync(tmp);
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.existsSync(tmp) && fs.unlinkSync(tmp);
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          fs.renameSync(tmp, dest);
          resolve("ok");
        });
      });
    });

    req.on("error", (err) => {
      file.close();
      fs.existsSync(tmp) && fs.unlinkSync(tmp);
      reject(err);
    });

    req.setTimeout(20000, () => {
      req.destroy();
      file.close();
      fs.existsSync(tmp) && fs.unlinkSync(tmp);
      reject(new Error(`Timeout: ${url}`));
    });
  });
}

async function runConcurrent(tasks, concurrency) {
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      await tasks[idx]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function downloadReciter(reciter) {
  const dir = path.join(OUTPUT_DIR, reciter);
  fs.mkdirSync(dir, { recursive: true });

  let done = 0, skipped = 0, failed = 0;
  const start = Date.now();

  const tasks = Array.from({ length: TOTAL_AYAHS }, (_, i) => {
    const ayah = i + 1;
    return async () => {
      const dest = path.join(dir, `${ayah}.mp3`);
      try {
        const result = await downloadFile(`${CDN_BASE}/${reciter}/${ayah}.mp3`, dest);
        if (result === "skip") skipped++;
        else done++;
      } catch (err) {
        failed++;
        fs.appendFileSync(
          path.join(OUTPUT_DIR, "errors.log"),
          `${new Date().toISOString()} ${reciter}/${ayah}: ${err.message}\n`
        );
      }
      // Progress line
      const total = done + skipped + failed;
      const pct = Math.round((total / TOTAL_AYAHS) * 100);
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      process.stdout.write(
        `\r  [${pct}%] ${total}/${TOTAL_AYAHS}  downloaded:${done}  skipped:${skipped}  errors:${failed}  ${elapsed}s`
      );
    };
  });

  await runConcurrent(tasks, CONCURRENCY);
  process.stdout.write("\n");
  console.log(`  ✓ ${reciter}: ${done} new, ${skipped} cached, ${failed} errors`);
}

async function main() {
  const arg = process.argv[2];
  const reciters = arg ? [arg] : ALL_RECITERS;

  const unknown = reciters.filter((r) => !ALL_RECITERS.includes(r));
  if (unknown.length) {
    console.error(`Unknown reciter(s): ${unknown.join(", ")}`);
    console.error(`Available: ${ALL_RECITERS.join(", ")}`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Bitrate: ${BITRATE} kbps  |  Concurrency: ${CONCURRENCY}`);
  console.log(`Estimated size per reciter: ~${Math.round(TOTAL_AYAHS * 90 / 1024)} MB\n`);

  for (const reciter of reciters) {
    console.log(`Downloading ${reciter} ...`);
    await downloadReciter(reciter);
  }

  console.log("\nDone! Files are in public/audio/");
  console.log("The app will use them automatically (CDN fallback if a file is missing).");
}

main().catch((err) => { console.error(err); process.exit(1); });
