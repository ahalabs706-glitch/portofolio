import { app } from "./app.js";
import { config } from "./config/env.js";
import { prisma } from "./database/client.js";
import { logger } from "./utils/logger.js";

const server = app.listen(config.port, "0.0.0.0", () => {
  logger.info({ port: config.port }, "API server started");
});

let isShuttingDown = false;

const shutdown = (signal: string) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  logger.info({ signal }, "API shutdown requested");

  server.close((error) => {
    if (error) {
      logger.error({ err: error }, "Failed to close HTTP server");
      process.exitCode = 1;
    }

    void prisma.$disconnect().then(
      () => {
        logger.info("API shutdown complete");
      },
      (databaseError: unknown) => {
        logger.error({ err: databaseError }, "Failed to disconnect database client");
        process.exitCode = 1;
      },
    );
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
