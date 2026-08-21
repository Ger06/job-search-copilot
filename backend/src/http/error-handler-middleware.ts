import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { NotFoundError } from "../errors/not-found-error.js";
import { DuplicateError } from "../errors/duplicate-error.js";
import { FabricatedContentError } from "../errors/fabricated-content-error.js";
import { IncompleteCoverageError } from "../errors/incomplete-coverage-error.js";
import { MalformedCVParseError } from "../errors/malformed-cv-parse-error.js";
import { FileExtractionError } from "../errors/file-extraction-error.js";
import { ValidationError } from "./validation.js";

function multerErrorMessage(err: InstanceType<typeof multer.MulterError>): string {
  if (err.code === "LIMIT_FILE_SIZE") {
    return "El archivo supera el tamaño máximo permitido (5MB).";
  }
  return "No se pudo procesar el archivo subido.";
}

function isBodyParseError(err: unknown): err is SyntaxError {
  return err instanceof SyntaxError && "body" in err;
}

export const errorHandlerMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof DuplicateError) {
    res.status(409).json({ error: err.message });
    return;
  }
  if (
    err instanceof FabricatedContentError ||
    err instanceof IncompleteCoverageError ||
    err instanceof MalformedCVParseError ||
    err instanceof FileExtractionError
  ) {
    res.status(422).json({ error: err.message });
    return;
  }
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: multerErrorMessage(err) });
    return;
  }
  if (err instanceof ValidationError || isBodyParseError(err)) {
    res.status(400).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Error interno" });
};
