export class FileExtractionError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "FileExtractionError";
  }
}
