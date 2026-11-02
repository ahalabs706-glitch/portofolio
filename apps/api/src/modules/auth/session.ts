import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import type { NextFunction, Request, Response } from "express";
import { parse, serialize } from "cookie";

import { config } from "../../config/env.js";
import { prisma } from "../../database/client.js";
import { HttpError } from "../shared/errors.js";

export const sessionCookieName = "devfolio_session";
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthenticatedSession {
  id: string;
  csrfToken: string;
  user: AuthenticatedUser;
}

declare module "express-serve-static-core" {
  interface Request {
    authSession?: AuthenticatedSession;
  }
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax" as const,
    path: "/api/v1",
    maxAge,
  };
}

export function setSessionCookie(response: Response, token: string, maxAgeMs: number) {
  response.append(
    "Set-Cookie",
    serialize(sessionCookieName, token, cookieOptions(Math.floor(maxAgeMs / 1000))),
  );
}

export function clearSessionCookie(response: Response) {
  response.append(
    "Set-Cookie",
    serialize(sessionCookieName, "", { ...cookieOptions(0), expires: new Date(0) }),
  );
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hash(token),
      csrfToken,
      expiresAt,
    },
  });
  return { token, csrfToken, expiresAt, id: session.id };
}

export async function requireSession(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const token = parse(request.headers.cookie ?? "")[sessionCookieName];
    if (!token) throw new HttpError(401, "UNAUTHENTICATED", "Sign in to continue.");

    const session = await prisma.session.findFirst({
      where: { tokenHash: hash(token), expiresAt: { gt: new Date() } },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!session) throw new HttpError(401, "UNAUTHENTICATED", "Sign in to continue.");

    request.authSession = {
      id: session.id,
      csrfToken: session.csrfToken,
      user: session.user,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireCsrf(request: Request, _response: Response, next: NextFunction) {
  const provided = request.get("x-csrf-token");
  const expected = request.authSession?.csrfToken;
  if (!provided || !expected) {
    next(new HttpError(403, "CSRF_INVALID", "Request verification failed."));
    return;
  }

  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  if (
    providedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(providedBytes, expectedBytes)
  ) {
    next(new HttpError(403, "CSRF_INVALID", "Request verification failed."));
    return;
  }
  next();
}

export function requireTrustedOrigin(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const origin = request.get("origin");
  if (origin && origin !== config.webOrigin) {
    next(new HttpError(403, "ORIGIN_INVALID", "Request origin is not allowed."));
    return;
  }
  next();
}

export const sessionLifetimeSeconds = Math.floor(sessionLifetimeMs / 1000);
export const sessionTokenHash = hash;
