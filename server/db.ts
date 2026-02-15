import { drizzle } from "drizzle-orm/node-mssql";
import sql from "mssql";
import * as schema from "@shared/schema";

export const pool = process.env.DATABASE_URL
    ? await sql.connect(process.env.DATABASE_URL)
    : null;

export const db = pool ? drizzle(pool, { schema }) : null;
