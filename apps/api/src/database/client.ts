import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { config } from "../config/env.js";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: config.databaseUrl }),
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
