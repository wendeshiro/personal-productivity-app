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
  let hostname = "";

  // If ssl params exist in the URL, pg can replace the ssl object from config.
  // We strip URL-level ssl params so explicit config below remains effective.
  try {
    const parsedUrl = new URL(rawConnectionString);
    hostname = parsedUrl.hostname;
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

  const isAivenHost = hostname.endsWith(".aivencloud.com");
  const forceSsl =
    process.env.PG_FORCE_SSL === "true" ||
    process.env.NODE_ENV === "production" ||
    isAivenHost;

  if (forceSsl) {
    // Aiven commonly requires SSL and may fail strict validation without custom CA setup.
    const rejectUnauthorized = isAivenHost
      ? process.env.PG_SSL_REJECT_UNAUTHORIZED === "true"
      : process.env.PG_SSL_REJECT_UNAUTHORIZED !== "false";

    poolConfig.ssl = { rejectUnauthorized };
  }

  return poolConfig;
};

const pool = new Pool(buildPoolConfig());

export const query = (text, params) => pool.query(text, params);
export const closePool = () => pool.end();
