import fs from "fs";
import path from "path";

// Update this filename if your src/db/index.ts points to a different .db file name
const DB_FILE_NAME = "sqlite.db";

async function backupDatabase() {
  const rootDir = process.cwd();
  const dbPath = path.join(rootDir, DB_FILE_NAME);
  const backupDir = path.join(rootDir, "backups");

  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database file not found at: ${dbPath}`);
    console.info("Check src/db/index.ts to verify your SQLite filename.");
    process.exit(1);
  }

  // Create backups/ directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Generate timestamped filename: e.g., sqlite-backup-2026-11-13T06-28-00.db
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupFileName = `sqlite-backup-${timestamp}.db`;
  const backupPath = path.join(backupDir, backupFileName);

  // Copy main SQLite database file
  fs.copyFileSync(dbPath, backupPath);

  // Also copy WAL / SHM files if SQLite WAL mode is enabled
  for (const ext of ["-wal", "-shm"]) {
    const journalPath = `${dbPath}${ext}`;
    if (fs.existsSync(journalPath)) {
      fs.copyFileSync(journalPath, `${backupPath}${ext}`);
    }
  }

  console.log(
    `✅ Database backed up successfully to: backups/${backupFileName}`,
  );
}

backupDatabase();
