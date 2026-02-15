import "dotenv/config";
import sql from "mssql";

async function test() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    try {
        const conn = await sql.connect(process.env.DATABASE_URL!);
        console.log("Connected successfully!");
        await conn.close();
    } catch (err) {
        console.error("Connection failed:", err);
    }
}

test();
