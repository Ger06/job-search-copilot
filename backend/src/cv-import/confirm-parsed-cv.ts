import type { CVParseResult } from "./cv-parse-result.js";
import type { WorkExperience } from "../work-experiences/work-experience.js";
import type { WorkExperienceRepository } from "../work-experiences/work-experience-repository.js";
import { createWorkExperience } from "../work-experiences/work-experience-service.js";
import type { Bullet } from "../bullets/bullet.js";
import type { BulletRepository } from "../bullets/bullet-repository.js";
import { createBullet } from "../bullets/bullet-service.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import { validateNoDuplicateWorkExperiences } from "./validate-no-duplicate-work-experiences.js";

export async function confirmParsedCV(
  draft: CVParseResult,
  repositories: { workExperienceRepository: WorkExperienceRepository; bulletRepository: BulletRepository },
  embeddingProvider: EmbeddingProvider,
): Promise<{ workExperiences: WorkExperience[]; bullets: Bullet[] }> {
  await validateNoDuplicateWorkExperiences(draft, repositories.workExperienceRepository);

  const workExperiences: WorkExperience[] = [];
  const bullets: Bullet[] = [];

  for (const [index, draftWorkExperience] of draft.workExperiences.entries()) {
    const workExperience = await createWorkExperience(
      {
        company: draftWorkExperience.company,
        role: draftWorkExperience.role,
        startDate: new Date(draftWorkExperience.startDate),
        ...(draftWorkExperience.endDate !== null ? { endDate: new Date(draftWorkExperience.endDate) } : {}),
        order: index + 1,
      },
      repositories.workExperienceRepository,
    );
    workExperiences.push(workExperience);

    for (const draftBullet of draftWorkExperience.bullets) {
      const bullet = await createBullet(
        { text: draftBullet.text, workExperienceId: workExperience.id },
        repositories.bulletRepository,
        repositories.workExperienceRepository,
        embeddingProvider,
      );
      bullets.push(bullet);
    }
  }

  return { workExperiences, bullets };
}
