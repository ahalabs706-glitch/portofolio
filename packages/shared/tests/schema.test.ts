import { describe, expect, it } from "vitest";

import {
  createEmptyCvData,
  cvDataSchema,
  cvWriteSchema,
  loginSchema,
  registerSchema,
} from "../src/index.js";

describe("shared request schemas", () => {
  it("creates an empty CV that passes the shared data contract", () => {
    expect(cvDataSchema.parse(createEmptyCvData())).toEqual(createEmptyCvData());
  });

  it("rejects malformed or unsupported CV content", () => {
    const data = createEmptyCvData();
    expect(
      cvDataSchema.safeParse({
        ...data,
        personal: { ...data.personal, email: "not-an-email" },
      }).success,
    ).toBe(false);
    expect(cvWriteSchema.safeParse({ template: "unknown", data }).success).toBe(false);
  });

  it("accepts only HTTP(S) profile URLs", () => {
    const data = createEmptyCvData();
    expect(
      cvDataSchema.safeParse({
        ...data,
        personal: { ...data.personal, website: "javascript:alert(1)" },
      }).success,
    ).toBe(false);
    expect(
      cvDataSchema.safeParse({
        ...data,
        personal: { ...data.personal, website: "https://example.com" },
      }).success,
    ).toBe(true);
  });

  it("enforces registration password strength without changing login compatibility", () => {
    expect(
      registerSchema.safeParse({
        email: "ada@example.com",
        password: "short",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        email: "ada@example.com",
        password: "long-enough-password",
      }).success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({
        email: "ada@example.com",
        password: "short",
      }).success,
    ).toBe(true);
  });
});
