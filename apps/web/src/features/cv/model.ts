import {
  createEmptyCvData,
  cvDataSchema,
  type CvData,
  type CvDocument,
  type CvTemplate,
} from "@devfolio/shared";

export { createEmptyCvData };
export { cvDataSchema };
export type { CvData, CvDocument, CvTemplate };

export const templateNames: Record<CvTemplate, string> = {
  modern: "Modern Professional",
  ats: "Minimal ATS-Friendly",
  developer: "Developer Portfolio",
};
