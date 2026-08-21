export type DraftBullet = {
  text: string;
};

export type DraftWorkExperience = {
  company: string;
  role: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null; // "YYYY-MM-DD" | null
  bullets: DraftBullet[];
};

export type CVParseResult = {
  workExperiences: DraftWorkExperience[];
};
