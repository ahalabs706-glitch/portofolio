import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";

import {
  cvDataSchema,
  cvWriteSchema,
  type CvDocument,
  type CvTemplate,
} from "@devfolio/shared";

import { prisma } from "../../database/client.js";
import { HttpError } from "../shared/errors.js";
import { requireCsrf, requireSession } from "../auth/session.js";
import { validateBody } from "../shared/validation.js";

export const cvsRouter = Router();

const uuidSchema = z.string().uuid();
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

function parseId(value: string | string[] | undefined) {
  const parsed = uuidSchema.safeParse(value);
  if (!parsed.success)
    throw new HttpError(400, "INVALID_ID", "CV identifier is invalid.");
  return parsed.data;
}

function serializeCv(cv: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  template: CvTemplate;
  data: unknown;
}): CvDocument {
  return {
    id: cv.id,
    createdAt: cv.createdAt.toISOString(),
    updatedAt: cv.updatedAt.toISOString(),
    template: cv.template,
    data: cvDataSchema.parse(cv.data),
  };
}

cvsRouter.use(requireSession);

cvsRouter.get("/", async (request, response, next) => {
  try {
    const pagination = paginationSchema.safeParse(request.query);
    if (!pagination.success) {
      throw new HttpError(
        400,
        "PAGINATION_INVALID",
        "Pagination parameters are invalid.",
      );
    }

    const { page, limit } = pagination.data;
    const [items, total] = await prisma.$transaction([
      prisma.cv.findMany({
        where: { userId: request.authSession!.user.id },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cv.count({ where: { userId: request.authSession!.user.id } }),
    ]);

    response.json({
      data: items.map(serializeCv),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

cvsRouter.post(
  "/",
  requireCsrf,
  validateBody(cvWriteSchema),
  async (request, response, next) => {
    try {
      const cv = await prisma.cv.create({
        data: {
          userId: request.authSession!.user.id,
          template: request.body.template,
          data: request.body.data,
        },
      });
      response.status(201).json({ data: serializeCv(cv) });
    } catch (error) {
      next(error);
    }
  },
);

cvsRouter.get("/:id", async (request, response, next) => {
  try {
    const cv = await prisma.cv.findFirst({
      where: {
        id: parseId(request.params.id),
        userId: request.authSession!.user.id,
      },
    });
    if (!cv) throw new HttpError(404, "CV_NOT_FOUND", "CV was not found.");
    response.json({ data: serializeCv(cv) });
  } catch (error) {
    next(error);
  }
});

cvsRouter.put(
  "/:id",
  requireCsrf,
  validateBody(cvWriteSchema),
  async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      const existing = await prisma.cv.findFirst({
        where: { id, userId: request.authSession!.user.id },
        select: { id: true },
      });
      if (!existing) throw new HttpError(404, "CV_NOT_FOUND", "CV was not found.");

      const updated = await prisma.cv.updateMany({
        where: { id, userId: request.authSession!.user.id },
        data: { template: request.body.template, data: request.body.data },
      });
      if (updated.count === 0)
        throw new HttpError(404, "CV_NOT_FOUND", "CV was not found.");
      const cv = await prisma.cv.findFirst({
        where: { id, userId: request.authSession!.user.id },
      });
      if (!cv) throw new HttpError(404, "CV_NOT_FOUND", "CV was not found.");
      response.json({ data: serializeCv(cv) });
    } catch (error) {
      next(error);
    }
  },
);

cvsRouter.delete("/:id", requireCsrf, async (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    const deleted = await prisma.cv.deleteMany({
      where: { id, userId: request.authSession!.user.id },
    });
    if (deleted.count === 0)
      throw new HttpError(404, "CV_NOT_FOUND", "CV was not found.");
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

cvsRouter.post("/:id/duplicate", requireCsrf, async (request, response, next) => {
  try {
    const source = await prisma.cv.findFirst({
      where: {
        id: parseId(request.params.id),
        userId: request.authSession!.user.id,
      },
    });
    if (!source) throw new HttpError(404, "CV_NOT_FOUND", "CV was not found.");

    const duplicateData = cvDataSchema.parse(source.data);
    const duplicate = await prisma.cv.create({
      data: {
        id: randomUUID(),
        userId: request.authSession!.user.id,
        template: source.template,
        data: duplicateData,
      },
    });
    response.status(201).json({ data: serializeCv(duplicate) });
  } catch (error) {
    next(error);
  }
});
