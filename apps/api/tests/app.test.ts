import { randomUUID } from "node:crypto";

import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    session: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
    cv: {
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("../src/database/client.js", () => ({ prisma: mocks.prisma }));

import { createEmptyCvData } from "@devfolio/shared";

import { app } from "../src/app.js";

const userId = "3260b9dd-2d41-47d2-8e92-fccde3d5db19";
const cvId = "c5026be0-4b9b-40ae-9b05-65d7515093a8";
const csrfToken = "test-csrf-token-012345678901234567890123456789012345";
const origin = "http://localhost:5173";

function sessionCookie(response: request.Response) {
  const cookies = response.headers["set-cookie"] as string[] | undefined;
  const cookie = cookies?.find((value) => value.startsWith("devfolio_session="));
  expect(cookie).toBeDefined();
  return cookie!.split(";")[0]!;
}

function setupSession() {
  mocks.prisma.session.findFirst.mockResolvedValue({
    id: randomUUID(),
    userId,
    tokenHash: "a".repeat(64),
    csrfToken,
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    user: { id: userId, email: "ada@example.com" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
  mocks.prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
    Promise.all(operations),
  );
  mocks.prisma.user.findUnique.mockResolvedValue(null);
  mocks.prisma.user.create.mockResolvedValue({
    id: userId,
    email: "ada@example.com",
  });
  mocks.prisma.session.create.mockResolvedValue({ id: randomUUID() });
  mocks.prisma.session.delete.mockResolvedValue({});
  mocks.prisma.session.deleteMany.mockResolvedValue({ count: 0 });
  mocks.prisma.cv.findMany.mockResolvedValue([]);
  mocks.prisma.cv.count.mockResolvedValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("health endpoints", () => {
  it("reports liveness without requiring database access", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(mocks.prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it("reports a generic not-ready response when the database is unavailable", async () => {
    mocks.prisma.$queryRaw.mockRejectedValueOnce(
      new Error("sensitive database diagnostic"),
    );

    const response = await request(app).get("/api/v1/ready");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "not_ready" });
    expect(JSON.stringify(response.body)).not.toContain("sensitive database diagnostic");
  });
});

describe("authentication", () => {
  it("validates registration and stores only an Argon2id password hash", async () => {
    const invalid = await request(app)
      .post("/api/v1/auth/register")
      .set("Origin", origin)
      .send({ email: "not-an-email", password: "short" });
    expect(invalid.status).toBe(400);

    const response = await request(app)
      .post("/api/v1/auth/register")
      .set("Origin", origin)
      .send({ email: "ADA@EXAMPLE.COM", password: "correct-horse-battery-staple" });

    expect(response.status).toBe(201);
    expect(response.body.data.user).toEqual({ id: userId, email: "ada@example.com" });
    expect(response.body.data).not.toHaveProperty("passwordHash");
    const createdUser = mocks.prisma.user.create.mock.calls[0]![0];
    expect(createdUser.data.email).toBe("ada@example.com");
    expect(createdUser.data.passwordHash).toMatch(/^\$argon2id\$/);
    const cookie = sessionCookie(response);
    const cookieValue = cookie.split("=")[1];
    const sessionArgs = mocks.prisma.session.create.mock.calls[0]![0];
    expect(sessionArgs.data.tokenHash).not.toBe(cookieValue);
    expect(sessionArgs.data.tokenHash).toMatch(/^[a-f\d]{64}$/);
    const cookieHeader = response.headers["set-cookie"]?.[0];
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader!).toContain("HttpOnly");
    expect(cookieHeader!).toContain("SameSite=Lax");
  });

  it("uses the same generic failure for unknown users and bad passwords", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .set("Origin", origin)
      .send({ email: "missing@example.com", password: "a-valid-password" });

    expect(response.status).toBe(401);
    expect(response.body.error).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
    });
  });

  it("requires a trusted origin for registration", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .set("Origin", "https://attacker.example")
      .send({ email: "ada@example.com", password: "correct-horse-battery-staple" });

    expect(response.status).toBe(403);
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
  });

  it("requires authentication and CSRF verification for session mutations", async () => {
    const unauthenticated = await request(app).get("/api/v1/cvs");
    expect(unauthenticated.status).toBe(401);

    setupSession();
    const login = await request(app)
      .post("/api/v1/auth/register")
      .set("Origin", origin)
      .send({ email: "ada@example.com", password: "correct-horse-battery-staple" });
    const cookie = sessionCookie(login);

    const me = await request(app).get("/api/v1/auth/me").set("Cookie", cookie);
    expect(me.status).toBe(200);
    expect(me.body.data.csrfToken).toBe(csrfToken);

    const blockedLogout = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookie);
    expect(blockedLogout.status).toBe(403);

    const logout = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookie)
      .set("X-CSRF-Token", csrfToken);
    expect(logout.status).toBe(204);
    expect(mocks.prisma.session.delete).toHaveBeenCalled();
  });
});

describe("CV API authorization", () => {
  it("does not reveal another user's CV and scopes reads by owner", async () => {
    setupSession();
    mocks.prisma.cv.findFirst.mockResolvedValue(null);
    const response = await request(app)
      .get(`/api/v1/cvs/${cvId}`)
      .set("Cookie", "devfolio_session=opaque-test-session");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("CV_NOT_FOUND");
    expect(mocks.prisma.cv.findFirst).toHaveBeenCalledWith({
      where: { id: cvId, userId },
    });
  });

  it("validates CV payloads and binds created CVs to the authenticated user", async () => {
    setupSession();
    const data = createEmptyCvData();
    const createdAt = new Date();
    mocks.prisma.cv.create.mockImplementation(({ data: input }) =>
      Promise.resolve({
        id: cvId,
        userId: input.userId,
        template: input.template,
        data: input.data,
        createdAt,
        updatedAt: createdAt,
      }),
    );
    const cookie = "devfolio_session=opaque-test-session";

    const invalid = await request(app)
      .post("/api/v1/cvs")
      .set("Cookie", cookie)
      .set("X-CSRF-Token", csrfToken)
      .send({ template: "unknown", data });
    expect(invalid.status).toBe(400);

    const blocked = await request(app)
      .post("/api/v1/cvs")
      .set("Cookie", cookie)
      .send({ template: "modern", data });
    expect(blocked.status).toBe(403);

    const created = await request(app)
      .post("/api/v1/cvs")
      .set("Cookie", cookie)
      .set("X-CSRF-Token", csrfToken)
      .send({ template: "modern", data });

    expect(created.status).toBe(201);
    expect(created.body.data.id).toBe(cvId);
    expect(mocks.prisma.cv.create.mock.calls[0]![0].data.userId).toBe(userId);
  });

  it("lists CVs only for the authenticated owner with pagination metadata", async () => {
    setupSession();
    mocks.prisma.cv.findMany.mockResolvedValue([]);
    mocks.prisma.cv.count.mockResolvedValue(0);
    const response = await request(app)
      .get("/api/v1/cvs?page=2&limit=10")
      .set("Cookie", "devfolio_session=opaque-test-session");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [],
      pagination: { page: 2, limit: 10, total: 0, pages: 0 },
    });
    expect(mocks.prisma.cv.findMany.mock.calls[0]![0].where.userId).toBe(userId);
  });
});

describe("templates API", () => {
  it("exposes the supported A4 templates without authentication", async () => {
    const response = await request(app).get("/api/v1/templates");

    expect(response.status).toBe(200);
    expect(response.body.data.map((template: { id: string }) => template.id)).toEqual([
      "modern",
      "ats",
      "developer",
    ]);
  });
});
