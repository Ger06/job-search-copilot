import { Router } from "express";
import multer from "multer";
import { parseCVText } from "./parse-cv-text.js";
import { confirmParsedCV } from "./confirm-parsed-cv.js";
import { detectFileType, extractTextFromFile } from "./extract-text-from-file.js";
import type { CVParseResult, DraftWorkExperience } from "./cv-parse-result.js";
import type { WorkExperienceRepository } from "../work-experiences/work-experience-repository.js";
import type { BulletRepository } from "../bullets/bullet-repository.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import type { LLMProvider } from "../ports/llm-provider.js";
import { requireNullableString, requireObject, requireString, ValidationError } from "../http/validation.js";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (detectFileType(file.originalname) === undefined) {
      callback(new ValidationError("Tipo de archivo no soportado: solo .pdf o .docx"));
      return;
    }
    callback(null, true);
  },
});

function parseDraftWorkExperience(value: unknown, index: number): DraftWorkExperience {
  const path = `workExperiences[${index}]`;
  const record = requireObject(value);
  const bulletsValue = record["bullets"];
  if (!Array.isArray(bulletsValue)) {
    throw new ValidationError(`${path}.bullets debe ser un array`);
  }

  return {
    company: requireString(value, "company"),
    role: requireString(value, "role"),
    startDate: requireString(value, "startDate"),
    endDate: requireNullableString(value, "endDate"),
    bullets: bulletsValue.map((bulletValue, bulletIndex) => {
      requireObject(bulletValue);
      return { text: requireString(bulletValue, "text") };
    }),
  };
}

function parseCVParseResultBody(body: unknown): CVParseResult {
  const record = requireObject(body);
  const workExperiencesValue = record["workExperiences"];
  if (!Array.isArray(workExperiencesValue)) {
    throw new ValidationError("workExperiences debe ser un array");
  }

  return {
    workExperiences: workExperiencesValue.map((value, index) => parseDraftWorkExperience(value, index)),
  };
}

export function createCvImportRouter(deps: {
  workExperienceRepository: WorkExperienceRepository;
  bulletRepository: BulletRepository;
  embeddingProvider: EmbeddingProvider;
  llmProvider: LLMProvider;
}): Router {
  const router = Router();

  router.post("/cv-import/parse", async (req, res, next) => {
    try {
      const rawText = requireString(req.body, "rawText");

      const draft = await parseCVText(rawText, deps.llmProvider);

      res.status(200).json(draft);
    } catch (error) {
      next(error);
    }
  });

  router.post("/cv-import/extract-text", upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        throw new ValidationError("Falta el archivo a subir (campo 'file')");
      }
      // fileFilter ya garantiza que el nombre tiene una extensión soportada.
      const fileType = detectFileType(req.file.originalname)!;

      const text = await extractTextFromFile(req.file.buffer, fileType);

      res.status(200).json({ text });
    } catch (error) {
      next(error);
    }
  });

  router.post("/cv-import/confirm", async (req, res, next) => {
    try {
      const draft = parseCVParseResultBody(req.body);

      const result = await confirmParsedCV(
        draft,
        { workExperienceRepository: deps.workExperienceRepository, bulletRepository: deps.bulletRepository },
        deps.embeddingProvider,
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
