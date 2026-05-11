import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const dir = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(dir, "../src/db/migrations");

const client = new pg.Client({ connectionString: url });
await client.connect();
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder });
  console.log("migrations applied successfully");
} finally {
  await client.end();
}
