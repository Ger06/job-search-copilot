import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  extractTextFromFile,
  generateCvForApplication,
  getJson,
  postFormData,
  postJson,
  updateApplicationStatus,
} from "../backend-client";

// Fake localStorage in memoria — no hay jsdom en este proyecto (entorno de
// test es Node puro), así que se stubea igual que fetch, no se usa el real.
function createFakeLocalStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createFakeLocalStorage());
});

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

describe("getJson", () => {
  it("devuelve el body parseado en el camino feliz", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: "1" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getJson<{ id: string }[]>("/some-path");

    expect(result).toEqual([{ id: "1" }]);
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(options?.method ?? "GET").toBe("GET");
  });

  it("lanza ApiError con el mensaje de {error} cuando la respuesta no es ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Not Found",
      json: async () => ({ error: "No encontrado" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getJson("/some-path")).rejects.toThrow(new ApiError("No encontrado"));
  });
});

describe("updateApplicationStatus", () => {
  it("envía un PATCH con el nuevo status y devuelve la Application actualizada", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "app-1", status: "enviada" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await updateApplicationStatus("app-1", "enviada");

    expect(result).toEqual({ id: "app-1", status: "enviada" });
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/applications/app-1/status");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body as string)).toEqual({ status: "enviada" });
  });
});

describe("generateCvForApplication", () => {
  it("envía un POST sin body relevante y devuelve la Application actualizada", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "app-1", fitScore: 0.8 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateCvForApplication("app-1");

    expect(result).toEqual({ id: "app-1", fitScore: 0.8 });
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/applications/app-1/generate-cv");
    expect(options.method).toBe("POST");
  });

  it("lanza ApiError con el mensaje del guardrail si falla con 422", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Unprocessable Entity",
      json: async () => ({ error: "Contenido inventado detectado: email" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateCvForApplication("app-1")).rejects.toThrow(
      new ApiError("Contenido inventado detectado: email"),
    );
  });
});

describe("header X-Session-Id", () => {
  it("postJson manda X-Session-Id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await postJson("/some-path", {});

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)["X-Session-Id"]).toEqual(expect.any(String));
    expect((options.headers as Record<string, string>)["X-Session-Id"].length).toBeGreaterThan(0);
  });

  it("getJson manda X-Session-Id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await getJson("/some-path");

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)["X-Session-Id"]).toEqual(expect.any(String));
  });

  it("patchJson (vía updateApplicationStatus) manda X-Session-Id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await updateApplicationStatus("app-1", "enviada");

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)["X-Session-Id"]).toEqual(expect.any(String));
  });

  it("postFormData manda X-Session-Id pero NO Content-Type (el browser tiene que setear el boundary solo)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await postFormData("/some-path", new FormData());

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["X-Session-Id"]).toEqual(expect.any(String));
    expect(headers["Content-Type"]).toBeUndefined();
  });

  it("usa el mismo id de sesión entre requests distintos (persistido en localStorage)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await postJson("/some-path", {});
    await getJson("/other-path");

    const [, firstOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    const [, secondOptions] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect((firstOptions.headers as Record<string, string>)["X-Session-Id"]).toBe(
      (secondOptions.headers as Record<string, string>)["X-Session-Id"],
    );
  });
});
