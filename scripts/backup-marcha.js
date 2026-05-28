#!/usr/bin/env node
/**
 * GoMarcha — Supabase Backup Script
 *
 * Exports all critical tables and storage bucket files to a timestamped
 * local folder. Requires .env.backup.local in the project root.
 *
 * Usage:
 *   npm run backup
 *   node scripts/backup-marcha.js
 *   node scripts/backup-marcha.js --dry-run   (no files written)
 *
 * Required env vars (in .env.backup.local):
 *   SUPABASE_URL              Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY Full-access key, bypasses RLS
 *
 * Optional env vars:
 *   BACKUP_OUTPUT_DIR           Default: ./backups
 *   BACKUP_CREATE_ZIP           Default: true
 *   BACKUP_KEEP_FOLDER_AFTER_ZIP Default: false
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const DRY_RUN = process.argv.includes("--dry-run");

if (DRY_RUN) {
  console.log("[backup] DRY-RUN mode — no files will be written.\n");
}

// ---------------------------------------------------------------------------
// Load .env.backup.local (minimal parser, no external deps)
// ---------------------------------------------------------------------------
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const env = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key) env[key] = val;
  }
  return env;
}

const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env.backup.local");
const envVars = loadEnvFile(envPath);

// Merge into process.env (file values take precedence over existing env)
for (const [k, v] of Object.entries(envVars)) {
  if (!process.env[k]) process.env[k] = v;
}

// ---------------------------------------------------------------------------
// Validate required environment variables — abort if missing
// ---------------------------------------------------------------------------
const REQUIRED_VARS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v] || process.env[v].trim() === "");
  if (missing.length > 0) {
    console.error("╔══════════════════════════════════════════════════════════╗");
    console.error("║  Backup aborted — required environment variables missing ║");
    console.error("╚══════════════════════════════════════════════════════════╝");
    console.error("");
    console.error("Missing variables:");
    for (const v of missing) console.error(`  ✗  ${v}`);
    console.error("");
    console.error(`Expected location: ${envPath}`);
    console.error("Copy .env.backup.example → .env.backup.local and fill in values.");
    process.exit(1);
  }
}

validateEnv();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUTPUT_DIR = path.resolve(projectRoot, process.env.BACKUP_OUTPUT_DIR || "./backups");
const CREATE_ZIP = (process.env.BACKUP_CREATE_ZIP || "true").toLowerCase() !== "false";
const KEEP_FOLDER = (process.env.BACKUP_KEEP_FOLDER_AFTER_ZIP || "false").toLowerCase() === "true";

// Tables to back up (in dependency order: events first, FKs after)
const TABLES = [
  "events",
  "social_queue",
  "social_caption_usage",
  "event_analytics",
  "qr_tracking",
];

const STORAGE_BUCKET = "event-images";
const ROW_LIMIT = 10000; // max rows per table fetch (Supabase max via Range header)

// ---------------------------------------------------------------------------
// Timestamp + output folder
// ---------------------------------------------------------------------------
function isoTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  );
}

const timestamp = isoTimestamp();
const backupDir = path.join(OUTPUT_DIR, timestamp);
const storageDir = path.join(backupDir, "storage", STORAGE_BUCKET);

// ---------------------------------------------------------------------------
// HTTP helper (native fetch, Node 18+)
// ---------------------------------------------------------------------------
async function supabaseGet(endpoint, extraHeaders = {}) {
  const url = `${SUPABASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Range: `0-${ROW_LIMIT - 1}`,
      "Range-Unit": "items",
      Prefer: "count=exact",
      ...extraHeaders,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${endpoint} → HTTP ${res.status}: ${body}`);
  }
  return res;
}

async function supabasePost(endpoint, body, extraHeaders = {}) {
  const url = `${SUPABASE_URL}${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${endpoint} → HTTP ${res.status}: ${text}`);
  }
  return res;
}

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------
function ensureDir(dir) {
  if (!DRY_RUN) fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  if (DRY_RUN) return;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function writeBuffer(filePath, buffer) {
  if (DRY_RUN) return;
  fs.writeFileSync(filePath, buffer);
}

// ---------------------------------------------------------------------------
// Step 1 — Export tables
// ---------------------------------------------------------------------------
async function exportTable(tableName) {
  process.stdout.write(`  Exporting ${tableName} ... `);
  const res = await supabaseGet(`/rest/v1/${tableName}?select=*`);
  const rows = await res.json();
  const count = Array.isArray(rows) ? rows.length : 0;
  const filePath = path.join(backupDir, `${tableName}.json`);
  writeJson(filePath, rows);
  console.log(`${count} rows`);
  return { table: tableName, rows: count, file: `${tableName}.json` };
}

// ---------------------------------------------------------------------------
// Step 2 — Export storage bucket
// ---------------------------------------------------------------------------
async function listStorageObjects(prefix = "", accumulator = []) {
  const res = await supabasePost(`/storage/v1/object/list/${STORAGE_BUCKET}`, {
    prefix,
    limit: 1000,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });
  const items = await res.json();
  if (!Array.isArray(items)) return accumulator;

  for (const item of items) {
    if (item.id === null) {
      // Folder — recurse
      await listStorageObjects(`${prefix}${item.name}/`, accumulator);
    } else {
      accumulator.push(`${prefix}${item.name}`);
    }
  }
  return accumulator;
}

async function downloadStorageFile(objectPath) {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${objectPath}`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Storage download failed: ${objectPath} → HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function exportStorage() {
  console.log(`\n  Listing objects in bucket "${STORAGE_BUCKET}" ...`);
  let objects = [];
  try {
    objects = await listStorageObjects();
  } catch (err) {
    console.warn(`  Warning: could not list storage objects — ${err.message}`);
    return { bucket: STORAGE_BUCKET, files: 0, errors: 1 };
  }

  console.log(`  Found ${objects.length} file(s). Downloading ...`);
  ensureDir(storageDir);

  let downloaded = 0;
  let errors = 0;
  for (const objectPath of objects) {
    process.stdout.write(`    ↓ ${objectPath} ... `);
    try {
      const buf = await downloadStorageFile(objectPath);
      const dest = path.join(storageDir, objectPath);
      ensureDir(path.dirname(dest));
      writeBuffer(dest, buf);
      console.log(`${(buf.length / 1024).toFixed(1)} KB`);
      downloaded++;
    } catch (err) {
      console.warn(`FAILED — ${err.message}`);
      errors++;
    }
  }

  return { bucket: STORAGE_BUCKET, files: downloaded, errors };
}

// ---------------------------------------------------------------------------
// Step 3 — Write manifest
// ---------------------------------------------------------------------------
function writeManifest(tableResults, storageResult) {
  const manifest = {
    created_at: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    dry_run: DRY_RUN,
    tables: tableResults,
    storage: storageResult,
  };
  writeJson(path.join(backupDir, "backup-manifest.json"), manifest);
  return manifest;
}

// ---------------------------------------------------------------------------
// Step 4 — ZIP
// ---------------------------------------------------------------------------
function createZip() {
  const zipName = `backup_${timestamp}.zip`;
  const zipPath = path.join(OUTPUT_DIR, zipName);
  console.log(`\n  Creating ZIP: ${zipName} ...`);
  if (!DRY_RUN) {
    execSync(`zip -r "${zipPath}" "${timestamp}"`, { cwd: OUTPUT_DIR, stdio: "pipe" });
    if (!KEEP_FOLDER) {
      fs.rmSync(backupDir, { recursive: true, force: true });
      console.log("  Removed uncompressed folder.");
    }
  }
  const sizeKb = DRY_RUN ? 0 : Math.round(fs.statSync(zipPath).size / 1024);
  console.log(`  ZIP saved: ${zipPath} (${sizeKb} KB)`);
  return zipPath;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  GoMarcha — Supabase Backup                  ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`  Timestamp : ${timestamp}`);
  console.log(`  Target    : ${DRY_RUN ? "(dry-run, no output)" : backupDir}`);
  console.log(`  Supabase  : ${SUPABASE_URL}`);
  console.log(`  ZIP       : ${CREATE_ZIP}`);
  console.log("");

  ensureDir(backupDir);

  // --- Tables ---
  console.log("Tables:");
  const tableResults = [];
  for (const table of TABLES) {
    try {
      const result = await exportTable(table);
      tableResults.push(result);
    } catch (err) {
      console.warn(`  WARNING: ${table} failed — ${err.message}`);
      tableResults.push({ table, rows: 0, error: err.message });
    }
  }

  // --- Storage ---
  console.log("\nStorage:");
  const storageResult = await exportStorage();

  // --- Manifest ---
  writeManifest(tableResults, storageResult);
  console.log("\n  Manifest written.");

  // --- ZIP ---
  if (CREATE_ZIP && !DRY_RUN) {
    createZip();
  }

  // --- Summary ---
  const totalRows = tableResults.reduce((s, t) => s + (t.rows || 0), 0);
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  Backup complete                             ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`  Tables     : ${tableResults.length} (${totalRows} total rows)`);
  console.log(`  Storage    : ${storageResult.files} files, ${storageResult.errors} errors`);
  if (!DRY_RUN) {
    console.log(`  Output     : ${CREATE_ZIP ? path.join(OUTPUT_DIR, `backup_${timestamp}.zip`) : backupDir}`);
  }

  if (tableResults.some((t) => t.error) || storageResult.errors > 0) {
    console.warn("\n  WARNING: some exports had errors — check output above.");
    process.exit(2); // Non-zero but distinguishable from hard abort (exit 1)
  }
}

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  process.exit(1);
});
