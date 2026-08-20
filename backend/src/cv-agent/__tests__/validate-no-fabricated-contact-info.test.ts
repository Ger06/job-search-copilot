import { describe, expect, it } from "vitest";
import { validateNoFabricatedContactInfo } from "../validate-no-fabricated-contact-info.js";
import { FabricatedContentError } from "../../errors/fabricated-content-error.js";

describe("validateNoFabricatedContactInfo", () => {
  it("lanza FabricatedContentError si el texto contiene un patrón de email", () => {
    expect(() => validateNoFabricatedContactInfo("Contactame a juan.perez@email.com para más información")).toThrow(
      FabricatedContentError,
    );
  });

  it("lanza FabricatedContentError si el texto contiene un patrón de teléfono", () => {
    expect(() => validateNoFabricatedContactInfo("Podés llamarme al +34 600 123 456")).toThrow(FabricatedContentError);
  });

  it("no lanza nada con un CV normal sin esos patrones", () => {
    const content = `# Currículum Vitae

## Experiencia Laboral

### Backend Engineer — Beta Inc
- Reduje el tiempo de build en 40% optimizando el pipeline de CI.
- Lideré un equipo de 5 personas en la migración a microservicios.`;

    expect(() => validateNoFabricatedContactInfo(content)).not.toThrow();
  });
});
