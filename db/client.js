import pg from "pg";

const { Pool } = pg;

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error(
    "DATABASE_URL is not set. Please export DATABASE_URL before starting the app.",
  );
}

const buildPoolConfig = () => {
  let connectionString = rawConnectionString;
  const poolConfig = {};

  // If ssl params exist in the URL, pg can replace the ssl object from config.
  // We strip URL-level ssl params so explicit config below remains effective.
  try {
    const parsedUrl = new URL(rawConnectionString);
    const sslParams = ["sslmode", "sslcert", "sslkey", "sslrootcert"];
    const hasSslParam = sslParams.some((param) =>
      parsedUrl.searchParams.has(param),
    );

    if (hasSslParam) {
      sslParams.forEach((param) => parsedUrl.searchParams.delete(param));
      connectionString = parsedUrl.toString();
    }
  } catch {
    // Keep the original connection string if URL parsing fails.
  }

  poolConfig.connectionString = connectionString;

  // Useful for managed Postgres providers with self-signed/intermediate cert chains.
  if (process.env.PG_SSL_REJECT_UNAUTHORIZED === "false") {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  return poolConfig;
};

const pool = new Pool(buildPoolConfig());

export const query = (text, params) => pool.query(text, params);
export const closePool = () => pool.end();
