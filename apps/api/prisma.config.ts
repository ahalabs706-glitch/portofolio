import { resolve } from "node:path";

import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({ path: resolve(import.meta.dirname, "../../.env") });

const databaseUrl =
  process.env.DATABASE_URL ??
  (process.argv.includes("generate")
    ? "postgresql://devfolio:local-development-only@localhost:5432/devfolio"
    : env("DATABASE_URL"));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
