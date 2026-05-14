import { config } from "dotenv";
config({ path: ".env.local" });
import { Pool } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    const files = ["0001_init.sql"];
    for (const file of files) {
      const query = readFileSync(join(process.cwd(), "migrations", file), "utf-8");
      await client.query(query);
      console.log(`✓ ${file}`);
    }
    console.log("Migration complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => { console.error(err); process.exit(1); });
