import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CvPreview } from "./CvPreview.js";
import { createEmptyCvData, type CvTemplate } from "./model.js";

describe("CV templates", () => {
  it.each(["modern", "ats", "developer"] as CvTemplate[])(
    "renders the %s template as readable CV content",
    (template) => {
      const data = createEmptyCvData();
      data.personal.fullName = "Ada Lovelace";
      data.personal.title = "Computing Pioneer";
      data.personal.summary = "A thoughtful mathematician and writer.";
      data.experience.push({
        company: "Analytical Engines",
        role: "Mathematician",
        employmentType: "Research",
        location: "London",
        startDate: "1842-01",
        endDate: "1843-01",
        current: false,
        responsibilities: "Published detailed notes",
        achievements: "Described an early algorithm",
        technologies: "Mathematics",
      });

      const { container } = render(<CvPreview document={{ template, data }} />);

      expect(screen.getByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
      expect(screen.getByText("Mathematician")).toBeInTheDocument();
      expect(container.querySelector(`.cv-template-${template}`)).toBeInTheDocument();
    },
  );
});
