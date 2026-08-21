export type ApplicationStatus = "pendiente" | "enviada" | "entrevista" | "rechazada" | "oferta";

export type Application = {
  id: string;
  jobDescriptionId: string;
  savedCvId: string | null;
  status: ApplicationStatus;
  recruiter: string | null;
  portal: string | null;
  salaryRequested: string | null;
  fitScore: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};
