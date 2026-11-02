import { Algorithm, hash, hashSync, verify } from "@node-rs/argon2";
import { Prisma } from "@prisma/client";

import { prisma } from "../../database/client.js";
import { HttpError } from "../shared/errors.js";
import { createSession } from "./session.js";

const passwordHashOptions = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};
const dummyPasswordHash = hashSync("devfolio-unknown-user-password", passwordHashOptions);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function register(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    throw new HttpError(
      409,
      "EMAIL_IN_USE",
      "An account with this email already exists.",
    );
  }
  const passwordHash = await hash(password, passwordHashOptions);

  let user;
  try {
    user = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash },
      select: { id: true, email: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(
        409,
        "EMAIL_IN_USE",
        "An account with this email already exists.",
      );
    }
    throw error;
  }

  return { user, session: await createSession(user.id) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });

  const validPassword = user
    ? await verify(user.passwordHash, password)
    : await verify(dummyPasswordHash, password);

  if (!user || !validPassword) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  return {
    user: { id: user.id, email: user.email },
    session: await createSession(user.id),
  };
}

export async function logout(sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } });
}
