import { z } from "zod";

const requiredText = (label: string, maximum = 240) =>
  z.string().trim().min(1, `${label} is required`).max(maximum);
const optionalText = (maximum = 4000) => z.string().max(maximum);
const optionalUrl = z
  .string()
  .trim()
  .refine((value) => {
    if (value === "" || !URL.canParse(value)) return value === "";
    return ["https:", "http:"].includes(new URL(value).protocol);
  }, "Enter a valid http or https URL");

export const cvTemplateSchema = z.enum(["modern", "ats", "developer"]);
export type CvTemplate = z.infer<typeof cvTemplateSchema>;

export const cvDataSchema = z.object({
  personal: z.object({
    fullName: requiredText("Full name", 120),
    title: optionalText(120),
    email: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || z.email().safeParse(value).success,
        "Enter a valid email",
      ),
    phone: optionalText(80),
    location: optionalText(120),
    website: optionalUrl,
    linkedIn: optionalUrl,
    github: optionalUrl,
    photoUrl: optionalUrl,
    summary: optionalText(2000),
  }),
  experience: z
    .array(
      z.object({
        company: optionalText(160),
        role: optionalText(160),
        employmentType: optionalText(80),
        location: optionalText(120),
        startDate: optionalText(40),
        endDate: optionalText(40),
        current: z.boolean(),
        responsibilities: optionalText(3000),
        achievements: optionalText(3000),
        technologies: optionalText(500),
      }),
    )
    .max(100),
  education: z
    .array(
      z.object({
        institution: optionalText(180),
        degree: optionalText(160),
        field: optionalText(160),
        startDate: optionalText(40),
        endDate: optionalText(40),
        description: optionalText(1500),
      }),
    )
    .max(100),
  skills: z
    .array(
      z.object({
        name: optionalText(100),
        category: optionalText(100),
        proficiency: optionalText(40),
      }),
    )
    .max(200),
  projects: z
    .array(
      z.object({
        name: optionalText(160),
        description: optionalText(2000),
        technologies: optionalText(500),
        repositoryUrl: optionalUrl,
        demoUrl: optionalUrl,
      }),
    )
    .max(100),
  certifications: z
    .array(
      z.object({
        name: optionalText(180),
        issuer: optionalText(160),
        issueDate: optionalText(40),
        expirationDate: optionalText(40),
        credentialUrl: optionalUrl,
      }),
    )
    .max(100),
  optionalSections: z.object({
    skills: z.boolean(),
    certifications: z.boolean(),
    languages: z.boolean(),
    awards: z.boolean(),
    publications: z.boolean(),
    volunteer: z.boolean(),
  }),
  languages: z.array(optionalText(100)).max(100),
  awards: z.array(optionalText(300)).max(100),
  publications: z.array(optionalText(300)).max(100),
  volunteer: z.array(optionalText(300)).max(100),
});

export type CvData = z.infer<typeof cvDataSchema>;

export const registerSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(12).max(128),
});

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

export const cvWriteSchema = z.object({
  template: cvTemplateSchema,
  data: cvDataSchema,
});

export interface CvDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  template: CvTemplate;
  data: CvData;
}

export function createEmptyCvData(): CvData {
  return {
    personal: {
      fullName: "Untitled CV",
      title: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedIn: "",
      github: "",
      photoUrl: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    optionalSections: {
      skills: true,
      certifications: true,
      languages: false,
      awards: false,
      publications: false,
      volunteer: false,
    },
    languages: [],
    awards: [],
    publications: [],
    volunteer: [],
  };
}
