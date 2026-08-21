import Link from "next/link";
import { notFound } from "next/navigation";
import { getJson } from "@/lib/backend-client";
import type { Application } from "@/lib/application";
import type { JobDescription } from "@/lib/job-description";
import type { SavedCV } from "@/lib/saved-cv";

export default async function ApplicationDetailPage(props: PageProps<"/applications/[id]">) {
  const { id } = await props.params;

  const [applications, jobDescriptions] = await Promise.all([
    getJson<Application[]>("/applications"),
    getJson<JobDescription[]>("/job-descriptions"),
  ]);

  const application = applications.find((a) => a.id === id);
  if (!application) {
    notFound();
  }

  const jobDescription = jobDescriptions.find((jd) => jd.id === application.jobDescriptionId);
  const savedCV = application.savedCvId ? await getJson<SavedCV>(`/saved-cvs/${application.savedCvId}`) : null;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-12">
      <div>
        <Link href="/applications" className="text-sm text-primary underline-offset-4 hover:underline">
          ← Volver a postulaciones
        </Link>
      </div>

      <div>
        <h1 className="text-2xl">
          {jobDescription?.company ?? "—"} — {jobDescription?.role ?? "—"}
        </h1>
        <p className="text-muted-foreground">Estado: {application.status}</p>
      </div>

      {!savedCV && (
        <p className="text-muted-foreground">Todavía no se generó un CV para esta postulación.</p>
      )}

      {savedCV && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">CV generado</p>
            <pre className="min-h-40 rounded-xl border border-border bg-card p-4 font-mono text-xs whitespace-pre-wrap text-foreground">
              {savedCV.content}
            </pre>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Carta de presentación</p>
            <pre className="min-h-40 rounded-xl border border-border bg-card p-4 font-mono text-xs whitespace-pre-wrap text-foreground">
              {savedCV.coverLetterContent}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}
