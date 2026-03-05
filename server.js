/**
 * server.js
 * Express service that replicates the Mule flow:
 *  - POST /table
 *  - Logs start/end
 *  - Generates multiplication table from input
 *  - Writes to file and then moves it to backup with timestamp
 */

const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8081;

// === Config: update these paths if needed (Windows paths supported) ===
const OUT_FILE_PATH = String.raw`C:\Users\91938\Desktop\file-maths\file.table2`;
const BACKUP_DIR = String.raw`C:\Users\91938\Desktop\file-maths\backup`;

// Middleware: JSON body parser and request logger
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Optional: simple in-memory cache similar to Mule's <ee:cache>
const cache = new Map();
/**
 * Create a cache key from request body.
 * In Mule, your cache encloses a logger; here we cache the computed payload
 * to avoid recomputation for identical inputs during the process lifetime.
 */
function cacheKey(body) {
  // Normalize keys of interest
  const { num, str, end } = body ?? {};
  return JSON.stringify({ num, str, end });
}

// Utility: ensure directory exists
async function ensureDir(dir) {
  try {
    await fsp.mkdir(dir, { recursive: true });
  } catch (e) {
    // ignore if exists
    if (e.code !== 'EEXIST') throw e;
  }
}

// Utility: format timestamp like yyyyMMdd_HHmmss
function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}${MM}${dd}_${HH}${mm}${ss}`;
}

// Core route: POST /table
app.post('/table', async (req, res) => {
  console.info('---------start flow------');

  try {
    // Input validation similar to your DataWeave expectations
    // Your DW casts payload.num/payload.str/payload.end as Number.
    const { num, str, end } = req.body || {};

    if (num === undefined || str === undefined || end === undefined) {
      return res.status(400).json({
        error:
          "Invalid body. Expected JSON with fields: { num, str, end }. All required.",
        example: { num: 5, str: 2, end: 10 },
      });
    }

    const N = Number(num);
    const S = Number(str);
    const E = Number(end);

    if (
      Number.isNaN(N) ||
      Number.isNaN(S) ||
      Number.isNaN(E) ||
      !Number.isFinite(N) ||
      !Number.isFinite(S) ||
      !Number.isFinite(E)
    ) {
      return res.status(400).json({
        error: 'num, str, end must be numbers or numeric strings',
      });
    }

    if (!Number.isInteger(S) || !Number.isInteger(E)) {
      return res.status(400).json({
        error: 'str and end should be integers (range bounds)',
      });
    }

    if (S > E) {
      return res.status(400).json({
        error: 'str must be <= end',
      });
    }

    // Check cache
    const key = cacheKey({ num, str, end });
    let table = cache.get(key);

    if (!table) {
      // Generate table (mirrors your DW logic)
      // (s to e) map (i) -> n ++ " x " ++ i ++ " = " ++ (n * i)
      table = [];
      for (let i = S; i <= E; i += 1) {
        table.push(`${N} x ${i} = ${N * i}`);
      }
      cache.set(key, table);
    }

    console.info('Inside cache/log -> payload:', JSON.stringify(table));

    // Write to output file
    // Ensure output directory exists
    await ensureDir(path.dirname(OUT_FILE_PATH));

    // Write the JSON array (because your DW sets output application/json)
    const jsonContent = JSON.stringify(table, null, 2);
    await fsp.writeFile(OUT_FILE_PATH, jsonContent, 'utf8');

    // Ensure backup directory exists, then move with timestamped name
    await ensureDir(BACKUP_DIR);
    const backupName = `${ts()}.table2`;
    const destPath = path.join(BACKUP_DIR, backupName);

    // If moving across volumes fails on Windows, fallback to copy+unlink
    try {
      await fsp.rename(OUT_FILE_PATH, destPath);
    } catch (e) {
      if (e.code === 'EXDEV') {
        await fsp.copyFile(OUT_FILE_PATH, destPath);
        await fsp.unlink(OUT_FILE_PATH);
      } else {
        throw e;
      }
    }

    console.info(
      '---------------------End flow-----------------',
      JSON.stringify(table)
    );

    // Respond with the JSON payload
    res.status(200).json(table);
  } catch (err) {
    console.error('Flow error:', err);
    res.status(500).json({ error: 'Internal Server Error', detail: String(err) });
  }
});

// Health check or simple GET landing
app.get('/', (_req, res) => {
  res.type('text/plain').send('Service is up. POST /table with JSON.');
});

// Start server
app.listen(PORT, () => {
  console.log(`HTTP Listener running on port ${PORT}`);
  console.log(`POST http://localhost:${PORT}/table`);
});
``
