const port = Number(process.env.PORT ?? 4000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
let parsedWebOrigin: URL;
try {
  parsedWebOrigin = new URL(webOrigin);
} catch {
  throw new Error("WEB_ORIGIN must be a valid absolute URL");
}

export const config = {
  port,
  databaseUrl,
  webOrigin: parsedWebOrigin.origin,
  cookieSecure: process.env.NODE_ENV === "production",
  nodeEnv: process.env.NODE_ENV ?? "development",
};
