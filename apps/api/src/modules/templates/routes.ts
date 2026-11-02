import { Router } from "express";

export const templatesRouter = Router();

templatesRouter.get("/", (_request, response) => {
  response.json({
    data: [
      { id: "modern", name: "Modern Professional", paper: "A4" },
      { id: "ats", name: "Minimal ATS-Friendly", paper: "A4" },
      { id: "developer", name: "Developer Portfolio", paper: "A4" },
    ],
  });
});
