import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mssql",
  dbCredentials: {
    host: "localhost",
    user: "sa",
    password: "password",
    database: "SimpleConnect",
    options: {
      encrypt: true,
      trustServerCertificate: true
    }
  },
  strict: true,
  verbose: true,
});
