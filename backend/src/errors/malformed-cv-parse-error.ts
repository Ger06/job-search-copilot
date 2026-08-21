export class MalformedCVParseError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "MalformedCVParseError";
  }
}
