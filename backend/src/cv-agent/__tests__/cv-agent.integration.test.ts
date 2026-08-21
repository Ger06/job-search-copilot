import { describe, expect, it } from "vitest";
import { generateTailoredCV } from "../cv-agent-service.js";
import { createJobDescription } from "../../job-descriptions/job-description-service.js";
import { InMemoryJobDescriptionRepository } from "../../job-descriptions/in-memory-job-description-repository.js";
import { createWorkExperience } from "../../work-experiences/work-experience-service.js";
import { InMemoryWorkExperienceRepository } from "../../work-experiences/in-memory-work-experience-repository.js";
import { createBullet } from "../../bullets/bullet-service.js";
import { InMemoryBulletRepository } from "../../bullets/in-memory-bullet-repository.js";
import type { Bullet } from "../../bullets/bullet.js";
import type { BulletRepository } from "../../bullets/bullet-repository.js";
import { InMemorySavedCVRepository } from "../../saved-cvs/in-memory-saved-cv-repository.js";
import { LocalEmbeddingProvider } from "../../ports/local-embedding-provider.js";
import { GroqLLMProvider } from "../../ports/groq-llm-provider.js";
import { FabricatedContentError } from "../../errors/fabricated-content-error.js";
import type { EmbeddingProvider } from "../../ports/embedding-provider.js";
import type { LLMProvider } from "../../ports/llm-provider.js";

function createFakeEmbeddingProvider(vector: number[] = [0.1, 0.2, 0.3]): EmbeddingProvider {
  return {
    async embed() {
      return vector;
    },
  };
}

function createFakeLLMProviderReturning(firstCallContent: string): LLMProvider {
  let callIndex = 0;
  return {
    async generate() {
      const content = callIndex === 0 ? firstCallContent : "CONTENIDO DE LA COVER LETTER";
      callIndex += 1;
      return content;
    },
  };
}

// Wrapper de solo-lectura sobre BulletRepository que registra, para cada
// llamada real a findByWorkExperienceId (la que hace la tool del agente),
// qué work_experience_id se pidió y qué bullets se le devolvieron al LLM.
// Sirve para verificar en los evals qué se llamó y qué texto fuente tuvo
// disponible el modelo, sin tocar cv-agent-service.ts.
class RecordingBulletRepository implements BulletRepository {
  readonly calls: { workExperienceId: string; bullets: Bullet[] }[] = [];

  constructor(private readonly inner: BulletRepository) {}

  create(bullet: Bullet): Promise<Bullet> {
    return this.inner.create(bullet);
  }

  findById(id: string): Promise<Bullet | undefined> {
    return this.inner.findById(id);
  }

  list(): Promise<Bullet[]> {
    return this.inner.list();
  }

  async findByWorkExperienceId(workExperienceId: string): Promise<Bullet[]> {
    const bullets = await this.inner.findByWorkExperienceId(workExperienceId);
    this.calls.push({ workExperienceId, bullets });
    return bullets;
  }
}

function extractNumbers(text: string): string[] {
  return text.match(/\d+(\.\d+)?%?/g) ?? [];
}

describe("generateTailoredCV — evals con Groq real (integración)", () => {
  it(
    "cubre todas las WorkExperience, no inventa números, y persiste el SavedCV",
    async () => {
      const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
      const jobDescription = await createJobDescription(
        {
          company: "Acme Corp",
          role: "Backend Engineer",
          rawText:
            "Buscamos un Backend Engineer con experiencia optimizando pipelines de CI/CD y liderando equipos de desarrollo.",
        },
        jobDescriptionRepository,
      );

      const workExperienceRepository = new InMemoryWorkExperienceRepository();
      const backendExperience = await createWorkExperience(
        { company: "Beta Inc", role: "Backend Engineer", startDate: new Date("2020-03-01"), order: 1 },
        workExperienceRepository,
      );
      const frontendExperience = await createWorkExperience(
        { company: "Gamma LLC", role: "Frontend Developer", startDate: new Date("2022-06-01"), order: 2 },
        workExperienceRepository,
      );

      const embeddingProvider = new LocalEmbeddingProvider();
      const innerBulletRepository = new InMemoryBulletRepository();
      await createBullet(
        { text: "Reduje el tiempo de build en 40% optimizando el pipeline de CI", workExperienceId: backendExperience.id },
        innerBulletRepository,
        workExperienceRepository,
        embeddingProvider,
      );
      await createBullet(
        { text: "Lideré un equipo de 5 personas en la migración a microservicios", workExperienceId: backendExperience.id },
        innerBulletRepository,
        workExperienceRepository,
        embeddingProvider,
      );
      await createBullet(
        { text: "Mejoré el Lighthouse score de 62 a 95 en la landing principal", workExperienceId: frontendExperience.id },
        innerBulletRepository,
        workExperienceRepository,
        embeddingProvider,
      );
      await createBullet(
        { text: "Reduje el bundle size en 30% con code splitting", workExperienceId: frontendExperience.id },
        innerBulletRepository,
        workExperienceRepository,
        embeddingProvider,
      );

      const bulletRepository = new RecordingBulletRepository(innerBulletRepository);
      const savedCVRepository = new InMemorySavedCVRepository();
      const llmProvider = new GroqLLMProvider();

      const { savedCV } = await generateTailoredCV(
        jobDescription.id,
        { jobDescriptionRepository, workExperienceRepository, bulletRepository, savedCVRepository },
        embeddingProvider,
        llmProvider,
      );

      // Eval 1 — cobertura: la tool se llamó al menos una vez por cada WorkExperience.
      const calledWorkExperienceIds = new Set(bulletRepository.calls.map((call) => call.workExperienceId));
      expect(calledWorkExperienceIds.has(backendExperience.id)).toBe(true);
      expect(calledWorkExperienceIds.has(frontendExperience.id)).toBe(true);

      // Eval 2 — honestidad: cada número en content/coverLetterContent aparece
      // en la fuente permitida (bullets devueltos por la tool + fechas de las
      // WorkExperience + texto de la vacante + la fecha actual, que una
      // cover letter puede legítimamente incluir en su encabezado), nunca
      // inventado por el modelo.
      const bulletsUsedText = bulletRepository.calls.flatMap((call) => call.bullets.map((bullet) => bullet.text)).join(" ");
      const allowedSource = [
        bulletsUsedText,
        backendExperience.startDate.toISOString(),
        frontendExperience.startDate.toISOString(),
        jobDescription.rawText,
        new Date().toISOString(),
      ].join(" ");

      for (const number of [...extractNumbers(savedCV.content), ...extractNumbers(savedCV.coverLetterContent)]) {
        expect(allowedSource.includes(number)).toBe(true);
      }

      // Eval 3 — sanidad estructural.
      expect(savedCV.content.length).toBeGreaterThan(0);
      expect(savedCV.coverLetterContent.length).toBeGreaterThan(0);
      expect(savedCV.content).not.toBe(savedCV.coverLetterContent);

      // Eval 4 — persistencia end-to-end.
      expect(await savedCVRepository.findById(savedCV.id)).toEqual(savedCV);
    },
    60000,
  );
});

describe("generateTailoredCV — guardrail anti-identidad-inventada", () => {
  it("bloquea la generación y no persiste nada si el content tiene un email inventado", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createJobDescription(
      { company: "Acme Corp", role: "Backend Engineer", rawText: "Buscamos un Backend Engineer con experiencia en Node.js" },
      jobDescriptionRepository,
    );
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    await createWorkExperience(
      { company: "Beta Inc", role: "Backend Engineer", startDate: new Date("2020-03-01"), order: 1 },
      workExperienceRepository,
    );
    const bulletRepository = new InMemoryBulletRepository();
    const savedCVRepository = new InMemorySavedCVRepository();
    const embeddingProvider = createFakeEmbeddingProvider();
    const llmProvider = createFakeLLMProviderReturning("Contactame a juan.perez@email.com");

    await expect(
      generateTailoredCV(
        jobDescription.id,
        { jobDescriptionRepository, workExperienceRepository, bulletRepository, savedCVRepository },
        embeddingProvider,
        llmProvider,
      ),
    ).rejects.toThrow(FabricatedContentError);

    expect(await savedCVRepository.list()).toEqual([]);
  });
});
