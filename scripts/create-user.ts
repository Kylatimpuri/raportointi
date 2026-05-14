import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import * as readline from "readline";

const sql = neon(process.env.DATABASE_URL!);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

async function main() {
  console.log("--- Uuden käyttäjän luonti ---\n");
  const name     = await ask("Nimi: ");
  const email    = await ask("Sähköposti: ");
  const password = await ask("Salasana: ");
  const roleRaw  = await ask("Rooli (1=myyja, 2=johto): ");
  rl.close();

  const roleMap: Record<string, string> = { "1": "myyja", "2": "johto" };
  const role = roleMap[roleRaw.trim()];
  if (!role) { console.error("Virheellinen rooli."); process.exit(1); }

  const hash = await bcrypt.hash(password, 12);
  await sql`
    INSERT INTO users (name, email, password, role)
    VALUES (${name}, ${email}, ${hash}, ${role})
    ON CONFLICT (email) DO UPDATE SET name = ${name}, password = ${hash}, role = ${role}
  `;
  console.log(`\n✓ Käyttäjä luotu: ${name} <${email}> (${role})`);
}

main().catch((err) => { console.error(err); process.exit(1); });
