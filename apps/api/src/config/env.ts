const port = Number(process.env.PORT ?? 4000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const webOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => {
    try {
      return new URL(origin.trim()).origin;
    } catch {
      throw new Error("WEB_ORIGIN must be a comma-separated list of valid absolute URLs");
    }
  });

const trustProxy = Number(process.env.TRUST_PROXY ?? 0);

if (!Number.isInteger(trustProxy) || trustProxy < 0) {
  throw new Error("TRUST_PROXY must be a non-negative integer (number of proxy hops)");
}

export const config = {
  port,
  databaseUrl,
  trustProxy,
  webOrigins,
  cookieSecure: process.env.NODE_ENV === "production",
  nodeEnv: process.env.NODE_ENV ?? "development",
};
