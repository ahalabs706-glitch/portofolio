import { describe, expect, it } from "vitest";

import { createEmptyCvData, cvDataSchema } from "./model.js";

describe("CV data validation", () => {
  it("accepts a complete draft with a name and optional content", () => {
    const data = createEmptyCvData();
    data.personal.fullName = "Ada Lovelace";
    data.personal.email = "ada@example.com";
    data.experience.push({
      company: "Analytical Engines",
      role: "Mathematician",
      employmentType: "Full-time",
      location: "London",
      startDate: "1842-01",
      endDate: "",
      current: false,
      responsibilities: "Published notes",
      achievements: "Described an early algorithm",
      technologies: "Mathematics",
    });

    expect(cvDataSchema.safeParse(data).success).toBe(true);
  });

  it("rejects a missing name, malformed email, or invalid link", () => {
    const data = createEmptyCvData();
    data.personal.fullName = "";
    data.personal.email = "not-an-email";
    data.personal.website = "not a URL";

    const result = cvDataSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toEqual(
        expect.arrayContaining([
          "personal.fullName",
          "personal.email",
          "personal.website",
        ]),
      );
    }
  });

  it("rejects executable URL protocols", () => {
    const data = createEmptyCvData();
    data.personal.fullName = "Ada Lovelace";
    data.personal.website = "javascript:alert(1)";

    expect(cvDataSchema.safeParse(data).success).toBe(false);
  });
});
