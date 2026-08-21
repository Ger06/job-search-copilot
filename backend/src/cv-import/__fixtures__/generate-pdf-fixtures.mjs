// Script descartable para generar sample-cv.pdf y empty.pdf a mano (PDF
// permite un content stream de texto plano sin ninguna librería). Se
// corre una sola vez; los .pdf resultantes quedan commiteados.
import { writeFileSync } from "node:fs";

function buildPdf(contentStream) {
  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  objects[3] =
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[5] = `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 1; i <= 5; i++) {
    offsets[i] = Buffer.byteLength(pdf, "latin1");
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "latin1");

  pdf += "xref\n0 6\n";
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += "trailer\n<< /Size 6 /Root 1 0 R >>\n";
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

const sampleContent = [
  "BT /F1 10 Tf 72 700 Td (Beta Inc - Backend Engineer - 2020 a 2022) Tj ET",
  "BT /F1 10 Tf 72 680 Td (Reduje el tiempo de build en un 40 por ciento) Tj ET",
].join("\n");
writeFileSync(new URL("./sample-cv.pdf", import.meta.url), buildPdf(sampleContent));

const emptyContent = "BT /F1 10 Tf 72 700 Td (hi) Tj ET";
writeFileSync(new URL("./empty.pdf", import.meta.url), buildPdf(emptyContent));

console.log("fixtures generadas");
