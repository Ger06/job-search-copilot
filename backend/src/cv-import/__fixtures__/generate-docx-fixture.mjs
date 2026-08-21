// Script descartable para generar sample-cv.docx (usa el paquete `docx`
// instalado temporalmente con --no-save, mammoth solo necesita LEER
// .docx, no queda como dependencia del proyecto). Se corre una sola vez;
// el .docx resultante queda commiteado.
import { writeFileSync } from "node:fs";
import { Document, Packer, Paragraph } from "docx";

const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph("Beta Inc - Backend Engineer - 2020 a 2022"),
        new Paragraph("Reduje el tiempo de build en un 40 por ciento"),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(new URL("./sample-cv.docx", import.meta.url), buffer);
console.log("sample-cv.docx generado");
