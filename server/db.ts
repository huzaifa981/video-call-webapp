import { drizzle } from "drizzle-orm/node-mssql";
import sql from "mssql";
import * as schema from "@shared/schema";

let pool: sql.ConnectionPool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

const initDb = async () => {
    if (!process.env.DATABASE_URL) return null;
    if (pool) return db;

    pool = await sql.connect(process.env.DATABASE_URL);
    db = drizzle(pool, { schema });
    return db;
};

// Initialize on module load
if (process.env.DATABASE_URL) {
    initDb().catch(console.error);
}

export { db, pool, initDb };
