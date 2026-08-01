import { readFile } from "node:fs/promises";
import { randomBytes, scryptSync } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedFile = path.resolve(__dirname, "../seeds/0001_seed.sql");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = new Pool({ connectionString: databaseUrl });

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
}

async function run() {
  const client = await pool.connect();

  try {
    const sql = await readFile(seedFile, "utf8");
    await client.query(sql);
    const bootstrapPassword = process.env.AUTH_BOOTSTRAP_PASSWORD;
    const rawUsers = process.env.AUTH_BOOTSTRAP_USERS ?? "";

    if (bootstrapPassword && rawUsers.trim()) {
      for (const record of rawUsers.split(",").map((item) => item.trim()).filter(Boolean)) {
        const [username, role, displayName] = record.split(":");
        await client.query(
          `
            INSERT INTO admin_users (
              id, branch_id, username, display_name, password_hash, role, is_active
            )
            VALUES (
              gen_random_uuid(),
              '11111111-1111-1111-1111-111111111111',
              $1,
              $2,
              $3,
              $4,
              TRUE
            )
            ON CONFLICT (username) DO UPDATE
            SET
              display_name = EXCLUDED.display_name,
              password_hash = EXCLUDED.password_hash,
              role = EXCLUDED.role,
              is_active = TRUE
          `,
          [
            username,
            displayName || username,
            hashPassword(bootstrapPassword),
            role,
          ],
        );
      }
    }
    console.log("Applied seed: 0001_seed.sql");
  } finally {
    client.release();
    await pool.end();
  }
}

void run();
