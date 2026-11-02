import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import cors from "cors";

import { config } from "./config/env.js";
import { prisma } from "./database/client.js";
import { authRouter } from "./modules/auth/routes.js";
import { requireTrustedOrigin } from "./modules/auth/session.js";
import { HttpError } from "./modules/shared/errors.js";
import { cvsRouter } from "./modules/cvs/routes.js";
import { templatesRouter } from "./modules/templates/routes.js";
import { logger } from "./utils/logger.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: config.webOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  }),
);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(request) {
        return {
          id: request.id,
          method: request.method,
          url: request.url,
        };
      },
      res(response) {
        return {
          statusCode: response.statusCode,
        };
      },
    },
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/v1/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.get("/api/v1/ready", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.status(200).json({ status: "ready" });
  } catch (error) {
    logger.error({ err: error }, "Readiness check failed");
    response.status(503).json({ status: "not_ready" });
  }
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/cvs", requireTrustedOrigin, cvsRouter);
app.use("/api/v1/templates", templatesRouter);

app.use((_request, response) => {
  response.status(404).json({
    error: { code: "NOT_FOUND", message: "The requested resource was not found." },
  });
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    void next;
    if (error instanceof HttpError) {
      response.status(error.statusCode).json({
        error: { code: error.code, message: error.message },
      });
      return;
    }

    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json({
        error: { code: "INVALID_JSON", message: "Request body must be valid JSON." },
      });
      return;
    }

    logger.error({ err: error }, "Unhandled API request error");
    response.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
    });
  },
);
