import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const hash = await bcrypt.hash("timpuri2026!", 12);
  await sql`
    INSERT INTO users (name, email, password, role)
    VALUES ('Petrus Luhtaniemi', 'petrus@luhtaniemi.fi', ${hash}, 'johto')
    ON CONFLICT (email) DO UPDATE SET password = ${hash}, role = 'johto'
  `;
  console.log("✓ Käyttäjä luotu: Petrus Luhtaniemi (johto)");
}

main().catch((err) => { console.error(err); process.exit(1); });
