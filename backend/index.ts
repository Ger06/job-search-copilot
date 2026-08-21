import { createApp } from "./src/app.js";
import { WorkExperienceRepositorySupabase } from "./src/work-experiences/work-experience-repository-supabase.js";
import { BulletRepositorySupabase } from "./src/bullets/bullet-repository-supabase.js";
import { JobDescriptionRepositorySupabase } from "./src/job-descriptions/job-description-repository-supabase.js";
import { SavedCVRepositorySupabase } from "./src/saved-cvs/saved-cv-repository-supabase.js";
import { ApplicationRepositorySupabase } from "./src/applications/application-repository-supabase.js";
import { LocalEmbeddingProvider } from "./src/ports/local-embedding-provider.js";
import { GroqLLMProvider } from "./src/ports/groq-llm-provider.js";

const app = createApp({
  workExperienceRepository: new WorkExperienceRepositorySupabase(),
  bulletRepository: new BulletRepositorySupabase(),
  jobDescriptionRepository: new JobDescriptionRepositorySupabase(),
  savedCVRepository: new SavedCVRepositorySupabase(),
  applicationRepository: new ApplicationRepositorySupabase(),
  embeddingProvider: new LocalEmbeddingProvider(),
  llmProvider: new GroqLLMProvider(),
});

const PORT = process.env["PORT"] || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
