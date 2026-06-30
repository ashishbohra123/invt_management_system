import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config/env.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.."
);

export async function ensureDatabase(): Promise<void> {
  const adminPool = new pg.Pool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: "postgres",
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    max: 1,
    connectionTimeoutMillis: 3000,
  });

  try {
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.DB_NAME]
    );
    if (result.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE "${config.DB_NAME}"`);
      console.log(`[db] Created database: ${config.DB_NAME}`);
    }
  } finally {
    await adminPool.end();
  }

  const sqlPath = path.resolve(projectRoot, "src/db/init.sql");
  if (!fs.existsSync(sqlPath)) {
    console.warn(`[db] init.sql not found at ${sqlPath}, skipping schema sync`);
    return;
  }

  const sql = fs.readFileSync(sqlPath, "utf-8");

  const pool = new pg.Pool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    max: 1,
    connectionTimeoutMillis: 3000,
  });

  try {
    await pool.query(sql);
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT ''`
    );
    console.log("[db] Schema synchronized");
  } finally {
    await pool.end();
  }
}
