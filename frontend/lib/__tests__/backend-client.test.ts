import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, extractTextFromFile, postJson } from "../backend-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postJson", () => {
  it("devuelve el body parseado en el camino feliz", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: "world" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await postJson<{ hello: string }>("/some-path", { a: 1 });

    expect(result).toEqual({ hello: "world" });
  });

  it("lanza ApiError con el mensaje de {error} cuando la respuesta no es ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Unprocessable Entity",
      json: async () => ({ error: "Contenido inventado detectado: email" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(postJson("/some-path", {})).rejects.toThrow(
      new ApiError("Contenido inventado detectado: email"),
    );
  });

  it("usa un fallback legible si el body de error no es JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
      json: async () => {
        throw new Error("body no es JSON");
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(postJson("/some-path", {})).rejects.toThrow(new ApiError("Internal Server Error"));
  });

  it("lanza ApiError con un mensaje legible si fetch falla por red", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(postJson("/some-path", {})).rejects.toThrow(ApiError);
  });
});

describe("extractTextFromFile", () => {
  it("envía el archivo como FormData y devuelve el texto extraído", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: "Beta Inc - Backend Engineer" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["contenido"], "cv.pdf", { type: "application/pdf" });

    const result = await extractTextFromFile(file);

    expect(result).toEqual({ text: "Beta Inc - Backend Engineer" });
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.method).toBe("POST");
  });

  it("lanza ApiError con el mensaje de {error} si la extracción falla", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Unprocessable Entity",
      json: async () => ({ error: "No pudimos extraer texto de este archivo." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["contenido"], "cv.pdf", { type: "application/pdf" });

    await expect(extractTextFromFile(file)).rejects.toThrow(new ApiError("No pudimos extraer texto de este archivo."));
  });
});
