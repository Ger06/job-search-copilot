import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractTextFromFile } from "../extract-text-from-file.js";
import { FileExtractionError } from "../../errors/file-extraction-error.js";

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "__fixtures__");

function readFixture(name: string): Buffer {
  return readFileSync(path.join(fixturesDir, name));
}

describe("extractTextFromFile", () => {
  it("extrae el texto de un PDF real y contiene el contenido esperado", async () => {
    const text = await extractTextFromFile(readFixture("sample-cv.pdf"), "pdf");

    expect(text).toContain("Beta Inc - Backend Engineer - 2020 a 2022");
    expect(text).toContain("Reduje el tiempo de build en un 40 por ciento");
  });

  it("extrae el texto de un DOCX real y contiene el contenido esperado", async () => {
    const text = await extractTextFromFile(readFixture("sample-cv.docx"), "docx");

    expect(text).toContain("Beta Inc - Backend Engineer - 2020 a 2022");
    expect(text).toContain("Reduje el tiempo de build en un 40 por ciento");
  });

  it("lanza FileExtractionError si el texto extraído está por debajo del umbral", async () => {
    await expect(extractTextFromFile(readFixture("empty.pdf"), "pdf")).rejects.toThrow(FileExtractionError);
  });

  it("lanza FileExtractionError si el archivo está corrupto y no se puede parsear", async () => {
    const garbage = Buffer.from("esto no es un pdf ni un docx válido, es basura");

    await expect(extractTextFromFile(garbage, "pdf")).rejects.toThrow(FileExtractionError);
  });
});
