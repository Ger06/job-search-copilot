import Groq from "groq-sdk";

try {
  process.loadEnvFile();
} catch {
  // .env no existe (ej. en CI) — las env vars ya están seteadas por otro medio
}

const groqApiKey = process.env["GROQ_API_KEY"];

if (!groqApiKey) {
  throw new Error("Falta GROQ_API_KEY en las variables de entorno");
}

export const groq = new Groq({ apiKey: groqApiKey });
