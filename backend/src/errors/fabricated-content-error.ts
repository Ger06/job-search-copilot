export class FabricatedContentError extends Error {
  constructor(reason: string) {
    super(`Contenido inventado detectado: ${reason}`);
    this.name = "FabricatedContentError";
  }
}
