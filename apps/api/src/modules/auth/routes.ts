import { Router } from "express";
import rateLimit from "express-rate-limit";

import { loginSchema, registerSchema } from "@devfolio/shared";

import { prisma } from "../../database/client.js";
import { validateBody } from "../shared/validation.js";
import { login, logout, register } from "./service.js";
import {
  clearSessionCookie,
  createSession,
  requireCsrf,
  requireSession,
  requireTrustedOrigin,
  sessionLifetimeSeconds,
  setSessionCookie,
} from "./session.js";

export const authRouter = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication attempts. Try again later.",
    },
  },
});

function sendAuthenticated(
  response: import("express").Response,
  result: Awaited<ReturnType<typeof login>>,
  statusCode = 200,
) {
  setSessionCookie(response, result.session.token, sessionLifetimeSeconds * 1000);
  response.status(statusCode).json({
    data: { user: result.user, csrfToken: result.session.csrfToken },
  });
}

authRouter.post(
  "/register",
  authRateLimit,
  requireTrustedOrigin,
  validateBody(registerSchema),
  async (request, response, next) => {
    try {
      const result = await register(request.body.email, request.body.password);
      sendAuthenticated(response, result, 201);
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  "/login",
  authRateLimit,
  requireTrustedOrigin,
  validateBody(loginSchema),
  async (request, response, next) => {
    try {
      const result = await login(request.body.email, request.body.password);
      sendAuthenticated(response, result);
    } catch (error) {
      next(error);
    }
  },
);

authRouter.get("/me", requireSession, (request, response) => {
  response.json({
    data: {
      user: request.authSession!.user,
      csrfToken: request.authSession!.csrfToken,
    },
  });
});

authRouter.post(
  "/logout",
  requireSession,
  requireCsrf,
  async (request, response, next) => {
    try {
      await logout(request.authSession!.id);
      clearSessionCookie(response);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  "/refresh",
  requireSession,
  requireCsrf,
  async (request, response, next) => {
    try {
      await prisma.session.delete({ where: { id: request.authSession!.id } });
      const session = await createSession(request.authSession!.user.id);
      setSessionCookie(response, session.token, sessionLifetimeSeconds * 1000);
      response.json({
        data: {
          user: request.authSession!.user,
          csrfToken: session.csrfToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);
