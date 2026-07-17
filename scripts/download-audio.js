#!/usr/bin/env node
/**
 * Download Quran reciter audio from everyayah.com into
 * public/audio/{reciterId}/{absoluteAyahNumber}.mp3
 *
 * Usage:
 *   node scripts/download-audio.js                 # all 5 reciters
 *   node scripts/download-audio.js ar.alafasy      # one reciter only
 *
 * Already-downloaded files are skipped (safe to resume).
 * 5 concurrent connections; polite 50 ms gap between requests.
 */

const https = require("https");
const fs    = require("fs");
const path  = require("path");

// ── Reciter map: app ID → everyayah.com folder ───────────────────────────────

const RECITERS = {
  "ar.alafasy":            "Alafasy_128kbps",
  "ar.abdulbasitmurattal": "Abdul_Basit_Murattal_192kbps",
  "ar.husary":             "Husary_128kbps",
  "ar.abdurrahmaansudais": "Abdurrahmaan_As-Sudais_192kbps",
  "ar.saadalghamdi":       "Ghamadi_40kbps",
};

const SOURCE_BASE  = "https://everyayah.com/data";
const OUTPUT_DIR   = path.join(__dirname, "../public/audio");
const CONCURRENCY  = 5;
const REQUEST_GAP  = 50; // ms between request starts

// ── Quran surah ayah counts (114 surahs) ─────────────────────────────────────

const AYAH_COUNTS = [
    7, 286, 200, 176, 120, 165, 206,  75, 129, 109,
  123, 111,  43,  52,  99, 128, 111, 110,  98, 135,
  112,  78, 118,  64,  77, 227,  93,  88,  69,  60,
   34,  30,  73,  54,  45,  83, 182,  88,  75,  85,
   54,  53,  89,  59,  37,  35,  38,  29,  18,  45,
   60,  49,  62,  55,  78,  96,  29,  22,  24,  13,
   14,  11,  11,  18,  12,  12,  30,  52,  52,  44,
   28,  28,  20,  56,  40,  31,  50,  40,  46,  42,
   29,  19,  36,  25,  22,  17,  19,  26,  30,  20,
   15,  21,  11,   8,   8,  19,   5,   8,   8,  11,
   11,   8,   3,   9,   5,   4,   7,   3,   6,   3,
    5,   4,   5,   6,
];

// Build a lookup: absoluteAyah (1-6236) → { surah, ayah }
const ABS_TO_SURAH_AYAH = [];
let abs = 0;
for (let s = 0; s < AYAH_COUNTS.length; s++) {
  for (let a = 1; a <= AYAH_COUNTS[s]; a++) {
    abs++;
    ABS_TO_SURAH_AYAH[abs] = { surah: s + 1, ayah: a };
  }
}
const TOTAL_AYAHS = abs; // 6236

// ── Download helpers ──────────────────────────────────────────────────────────

function pad3(n) { return String(n).padStart(3, "0"); }

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve("skip"); return; }

    const tmp = dest + ".tmp";
    const file = fs.createWriteStream(tmp);

    function cleanup() {
      try { file.close(); } catch (_) {}
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) {}
    }

    const req = https.get(url, { headers: { "User-Agent": "QuranApp/1.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        cleanup();
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        cleanup();
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          try { fs.renameSync(tmp, dest); resolve("ok"); }
          catch (e) { reject(e); }
        });
      });
    });

    req.on("error", (err) => { cleanup(); reject(err); });
    req.setTimeout(30000, () => { req.destroy(); cleanup(); reject(new Error(`Timeout: ${url}`)); });
  });
}

async function runConcurrent(tasks, concurrency) {
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      await tasks[idx]();
      if (idx % concurrency === 0) await sleep(REQUEST_GAP);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

// ── Download one reciter ──────────────────────────────────────────────────────

async function downloadReciter(appId, folder) {
  const dir = path.join(OUTPUT_DIR, appId);
  fs.mkdirSync(dir, { recursive: true });

  let done = 0, skipped = 0, failed = 0;
  const start = Date.now();
  const errorLog = path.join(OUTPUT_DIR, "errors.log");

  const tasks = Array.from({ length: TOTAL_AYAHS }, (_, i) => {
    const absNum = i + 1;
    const { surah, ayah } = ABS_TO_SURAH_AYAH[absNum];
    const filename = `${pad3(surah)}${pad3(ayah)}.mp3`;          // everyayah format
    const url      = `${SOURCE_BASE}/${folder}/${filename}`;
    const dest     = path.join(dir, `${absNum}.mp3`);            // local format (absolute number)

    return async () => {
      try {
        const r = await downloadFile(url, dest);
        if (r === "skip") skipped++; else done++;
      } catch (err) {
        failed++;
        fs.appendFileSync(errorLog, `${new Date().toISOString()} ${appId}/${absNum}: ${err.message}\n`);
      }

      const total   = done + skipped + failed;
      const pct     = Math.round((total / TOTAL_AYAHS) * 100);
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      process.stdout.write(
        `\r  [${pct}%] ${total}/${TOTAL_AYAHS}  new:${done}  cached:${skipped}  errors:${failed}  ${elapsed}s  `
      );
    };
  });

  await runConcurrent(tasks, CONCURRENCY);
  process.stdout.write("\n");
  console.log(`  ✓ ${appId}: ${done} downloaded, ${skipped} already cached, ${failed} errors\n`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  const arg = process.argv[2];
  const ids  = arg ? [arg] : Object.keys(RECITERS);

  const unknown = ids.filter((id) => !RECITERS[id]);
  if (unknown.length) {
    console.error(`Unknown reciter(s): ${unknown.join(", ")}`);
    console.error(`Valid IDs: ${Object.keys(RECITERS).join(", ")}`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Source : ${SOURCE_BASE}`);
  console.log(`Output : ${OUTPUT_DIR}`);
  console.log(`Total  : ${TOTAL_AYAHS} ayahs × ${ids.length} reciter(s)\n`);

  for (const id of ids) {
    console.log(`▶ ${id}  (${RECITERS[id]})`);
    await downloadReciter(id, RECITERS[id]);
  }

  console.log("Done. Run the app — local files are used automatically.");
  console.log("CDN fallback activates for any file that is still missing.");
}

main().catch((err) => { console.error(err.message); process.exit(1); });
