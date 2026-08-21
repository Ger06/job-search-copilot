import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { FileExtractionError } from "../errors/file-extraction-error.js";

export type SupportedFileType = "pdf" | "docx";

const MIN_EXTRACTED_TEXT_LENGTH = 50;

export function detectFileType(filename: string): SupportedFileType | undefined {
  const extension = filename.toLowerCase().split(".").pop();
  if (extension === "pdf") return "pdf";
  if (extension === "docx") return "docx";
  return undefined;
}

async function extractRawText(buffer: Buffer, fileType: SupportedFileType): Promise<string> {
  if (fileType === "pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractTextFromFile(buffer: Buffer, fileType: SupportedFileType): Promise<string> {
  let text: string;
  try {
    text = await extractRawText(buffer, fileType);
  } catch (error) {
    if (error instanceof FileExtractionError) throw error;
    throw new FileExtractionError("No pudimos leer este archivo — ¿está corrupto o dañado?");
  }

  if (text.trim().length < MIN_EXTRACTED_TEXT_LENGTH) {
    throw new FileExtractionError(
      "No pudimos extraer texto de este archivo. Si es un PDF escaneado (una imagen sin texto seleccionable), pegá el texto a mano.",
    );
  }

  return text;
}
