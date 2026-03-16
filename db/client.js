import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Please export DATABASE_URL before starting the app.",
  );
}

const pool = new Pool({ connectionString });

export const query = (text, params) => pool.query(text, params);
export const closePool = () => pool.end();
