type StudyTime = {
  minutes?: number | null;
  session_date?: string | null;
  subject_id?: string | null;
};

// Session minutes are the source of truth for every modality, including video.
export function sumStudyMinutes(sessions: readonly StudyTime[]): number {
  return sessions.reduce((total, session) => total + (session.minutes ?? 0), 0);
}

export function studyMinutesBy(sessions: readonly StudyTime[], field: "session_date" | "subject_id"): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const session of sessions) {
    const key = session[field];
    if (key) totals[key] = (totals[key] ?? 0) + (session.minutes ?? 0);
  }
  return totals;
}