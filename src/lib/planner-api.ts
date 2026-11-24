import { tribunalGroups } from "@/lib/tribunal-catalog";
import {selectPlannerSubjects,topicsForSubject,isWritingSubject,scopeOptions,subjectDefinition,topicOverrideKey,topicOverridesForSubject,type TopicOverrides,type TopicOverride,type TribunalData,type TribunalTopic,type TopicScope,type ProgressCategory} from "@/lib/tribunal-subject-source";
import { localDateStr, addDaysStr } from "./dates";
import { supabase } from "@/integrations/supabase/external-client";
import { idCanonicoAssunto, idsOriginaisDoAssunto } from "@/lib/edital-topic-equivalence";

export type Profile = {
  id: string; display_name: string | null; xp: number; streak_days: number;
  last_study_date: string | null; weekly_goal_hours: number; weekly_goal_questions: number;
  exam_name: string | null; exam_date: string | null; pages_per_hour: number | null; minutes_per_question: number | null;
  review_intervals?: number[] | null;
  exam_logo_url?: string | null;
  exam_logo_bb_url?: string | null;
  avatar_url?: string | null;
};
export type Subject = {
  tribunal_data?:TribunalData|null;
  topic_overrides?:TopicOverrides;
  id: string; name: string; ord: number; pages: number; pages_read: number; total_questions: number; weight: number; color: string;
  study_status?: string; maintenance_weekly_questions_goal?: number; maintenance_questions_this_week?: number;
  planned_hours_per_week?: number; exam_questions?: number; min_questions?: number;
  video_minutes_total?: number; video_minutes_watched?: number;
};


/** Comunica mudanças também às outras abas do navegador do mesmo usuário. */
export async function announcePlannerProgress() {
  try {
    const { data } = await supabase.auth.getUser();
    if (data.user) window.localStorage.setItem(`o-plano:progress:${data.user.id}`, String(Date.now()));
  } catch { /* O cache da aba atual continua sendo invalidado pelo React Query. */ }
}

/** Grava marcadores idempotentes de conclusão, com zero minutos para não inflar métricas. */
export async function markEditalTopicsStudied(subjectId: string, topicIds: number[]): Promise<void> {
  const ids = [...new Set(topicIds.map(idCanonicoAssunto))];
  if (!ids.length) return;
  const {data:auth}=await supabase.auth.getUser();
  if(!auth.user)throw new Error("Sessão expirada.");
  const selected=(await getSubjects()).find(s=>s.id===subjectId);
  const topics=topicsForSubject(selected,"bnb").filter(a=>ids.includes(a.id));
  if(topics.length!==ids.length)throw new Error("Assunto fora do catálogo de tribunais.");
  for(const a of topics){
    const {data:existing,error:readError}=await supabase.from("study_sessions").select("id").eq("user_id",auth.user.id).eq("edital_assunto_id",a.id).eq("task","Conclusão manual").limit(1);
    if(readError)throw readError;
    if(existing?.length)continue;
    const {error}=await supabase.from("study_sessions").insert({user_id:auth.user.id,subject_id:subjectId,edital_assunto_id:a.id,session_date:localDateStr(),kind:"questoes",minutes:0,pages_read:0,questions_done:0,questions_correct:0,task:"Conclusão manual",lesson:a.topico_central});
    if(error&&error.code!=="23505")throw error;
  }
}

export async function getProfile(): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").maybeSingle();
  return data as any;
}

export async function getSubjects(): Promise<Subject[]> {
  const [{data,error},auth]=await Promise.all([supabase.from("subjects").select("*").order("ord"),supabase.auth.getUser()]);
  if(error)throw error;
  if(auth.error||!auth.data.user)throw new Error("Não foi possível carregar os assuntos da sua conta. Verifique a sessão e tente novamente.");
  const metadata=auth.data.user.user_metadata??{};
  const rows=((data??[]) as Subject[]).map(s=>({...s,topic_overrides:topicOverridesForSubject(metadata,s.id)}));
  return selectPlannerSubjects(rows,"bnb");
}

export async function getCycle() {
  const { data } = await supabase
    .from("cycle_slots")
    .select("*, subject:subjects(*)")
    .order("ord");
  return data ?? [];
}

export async function getTodaySessions(date: string) {
  const { data } = await supabase.from("study_sessions").select("*, subject:subjects(*)").eq("session_date", date).order("created_at", { ascending: false });
  return data ?? [];
}

export async function getSessionsBetween(from: string, to: string) {
  const { data } = await supabase.from("study_sessions").select("*, subject:subjects(id,name,color)").gte("session_date", from).lte("session_date", to);
  return data ?? [];
}

export async function getAllSessions() {
  const { data } = await supabase.from("study_sessions").select("*, subject:subjects(id,name,color)");
  return data ?? [];
}

export function getReviewIntervalDays(layer: number): number {
  switch (layer) {
    case 1: return 7;
    case 2: return 15;
    case 3: return 30;
    case 4: return 60;
    default: return 60;
  }
}

export function getReviewLayerLabel(layer: number): string {
  switch (layer) {
    case 1: return "Revisão de 7 dias";
    case 2: return "Revisão de 15 dias";
    case 3: return "Revisão de 30 dias";
    case 4: return "Revisão de 60 dias";
    default: return `Revisão (${layer})`;
  }
}

export async function getDueReviews(today: string) {
  const { data } = await supabase
    .from("reviews").select("*, subject:subjects(name,color,pages_read,study_status)")
    .eq("next_review_date", today).eq("done", false).order("next_review_date");
  const list = (data ?? []) as any[];
  const vistas = new Set<string>();
  return list.filter(r => {
    if (!r.subject) return false;
    if (r.edital_assunto_id == null) return true;
    const key = idCanonicoAssunto(r.edital_assunto_id) + ":" + r.layer;
    if (vistas.has(key)) return false; // preserva no DB, mas exibe só uma vez
    vistas.add(key);
    return true;
  });
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

export async function clearAllPendingReviews() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("no user");
  const { error } = await supabase.from("reviews").delete().eq("user_id", u.user.id).eq("done", false);
  if (error) throw error;
}

export async function getDueFlashcards(today: string) {
  const { data } = await supabase
    .from("flashcards").select("*, subject:subjects(name,color,pages_read,study_status)")
    .lte("next_review_date", today).order("next_review_date");
  const list = (data ?? []) as any[];
  return list.filter(c => c.subject && (c.subject.pages_read > 0 || c.subject.study_status === "active" || c.subject.study_status === "finalized"));
}

export async function getErrors() {
  const { data } = await supabase.from("errors").select("*, subject:subjects(name,color)").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAllReviews() {
  const { data } = await supabase
    .from("reviews")
    .select("*, subject:subjects(id, name, color, pages_read, study_status)")
    .order("created_at", { ascending: false });
  const all = (data ?? []) as any[];
  const vistas = new Set<string>();
  return all.filter(r => {
    if (r.done || r.edital_assunto_id == null) return true;
    const key = idCanonicoAssunto(r.edital_assunto_id) + ":" + r.layer;
    if (vistas.has(key)) return false;
    vistas.add(key);
    return true;
  });
}

export async function setSubjectStatus(id: string, status: "active" | "finalized" | "pending") {
  const { error } = await supabase.from("subjects").update({ study_status: status }).eq("id", id);
  if (error) throw error;
}

/** Conclusão explícita: preserva a posição e a carga do próximo bloco. */
export async function completeTribunalSubject(subjectId:string):Promise<string|null>{
 const {data:auth}=await supabase.auth.getUser();if(!auth.user)throw new Error("Sessão expirada.");
 const uid=auth.user.id;
 const subjects=await getSubjects();
 const current=subjects.find(s=>s.id===subjectId);
 if(!current||isWritingSubject(current))throw new Error("Selecione uma matéria objetiva.");
 if(current.study_status==="finalized")return null;
 if(current.study_status!=="active")throw new Error("A matéria precisa estar no ciclo ativo.");
 const ids=topicsForSubject(current,"bnb").map(a=>a.id);
 if(!ids.length)throw new Error("Matéria sem assuntos.");
 const {data:slots,error:slotErr}=await supabase.from("cycle_slots").select("*").eq("user_id",uid).order("ord");
 if(slotErr)throw slotErr;
 const slot=(slots??[]).find(s=>s.subject_id===subjectId);
 if(!slot)throw new Error("Matéria sem posição no ciclo.");
 const next=subjects.find(s=>s.study_status==="pending"&&!isWritingSubject(s));
 await markEditalTopicsStudied(subjectId,ids);
 const {error:currentErr}=await supabase.from("subjects").update({study_status:"finalized",planned_hours_per_week:0}).eq("id",subjectId).eq("user_id",uid);if(currentErr)throw currentErr;
 if(next){
  const {error}=await supabase.from("subjects").update({study_status:"active",planned_hours_per_week:slot.hours_per_cycle}).eq("id",next.id).eq("user_id",uid);if(error)throw error;
  const {error:moveErr}=await supabase.from("cycle_slots").update({subject_id:next.id,done_hours:0}).eq("id",slot.id).eq("user_id",uid);if(moveErr)throw moveErr;
 }else{
  const {error}=await supabase.from("cycle_slots").delete().eq("id",slot.id).eq("user_id",uid);if(error)throw error;
 }
 await announcePlannerProgress();return next?.name??null;
}

export async function logSession(input: {
  subject_id: string | null; kind: "leitura"|"questoes"|"revisao"|"redacao"|"flashcards";
  minutes: number; pages_read?: number; questions_done?: number; questions_correct?: number; notes?: string;
  topic?: string; edital_assunto_id?: number | null; is_lesson_finished?: boolean; is_subject_finished?: boolean;
  task?: string | null; lesson?: string | null; page_start?: number | null; page_end?: number | null;
  session_date?: string;
}) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("no user");
  // Always stamp the session with the user's LOCAL date — the DB default is UTC,
  // which pushes evening sessions (21h–24h em SP) para o dia seguinte.
  const today = input.session_date || localDateStr();
  const notesText = input.notes || input.topic || null;
  const { error } = await supabase.from("study_sessions").insert({
    subject_id: input.subject_id,
    kind: input.kind,
    minutes: input.minutes,
    pages_read: input.pages_read,
    questions_done: input.questions_done,
    questions_correct: input.questions_correct,
    notes: notesText,
    ...(input.edital_assunto_id != null ? { edital_assunto_id: idCanonicoAssunto(input.edital_assunto_id) } : {}),
    task: input.task ?? null,
    lesson: input.lesson ?? null,
    page_start: input.page_start ?? null,
    page_end: input.page_end ?? null,
    user_id: u.user.id,
    session_date: today,
  });
  if (error) throw error;
  // Bump gamification
  const prof = await getProfile();
  if (prof) {
    const yesterday = addDaysStr(-1);
    let streak = prof.streak_days;
    if (prof.last_study_date === today) {
      // same day
    } else if (prof.last_study_date === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }
    const xpGain = Math.max(1, Math.round(input.minutes / 5)) + (input.questions_correct ?? 0);
    await supabase.from("profiles").update({
      xp: prof.xp + xpGain,
      streak_days: streak,
      last_study_date: today,
    }).eq("id", u.user.id);
  }

  // Se a aula foi marcada como finalizada, agenda as 4 etapas de revisão: 7, 15, 30 e 60 dias
  if (input.subject_id && input.is_lesson_finished) {
    await scheduleLessonReviews(input.subject_id, input.topic || input.notes, input.edital_assunto_id);
  }

  // Status do ciclo muda somente por ação explícita; revisões não reativam matérias.
  if(input.subject_id && input.is_subject_finished===true)await completeTribunalSubject(input.subject_id);

  // Videoaula: abate os minutos assistidos do saldo da matéria
  if (input.subject_id && input.task === "Videoaula" && input.minutes > 0) {
    await adjustVideoWatched(input.subject_id, input.minutes);
  }

  // Increment pages_read on the subject when pages were read in this session
  if (input.subject_id && input.pages_read && input.pages_read > 0) {
    const { data: sub } = await supabase.from("subjects").select("pages_read, study_status, maintenance_questions_this_week").eq("id", input.subject_id).maybeSingle();
    if (sub) {
      await supabase.from("subjects").update({
        pages_read: (sub.pages_read ?? 0) + input.pages_read,
        // Also handle maintenance questions if finalized
        ...(sub.study_status === "finalized" && input.questions_done
          ? { maintenance_questions_this_week: (sub.maintenance_questions_this_week ?? 0) + input.questions_done }
          : {}),
      }).eq("id", input.subject_id);
    }
  } else if (input.subject_id && input.questions_done) {
    // If the subject is finalized, increment its maintenance questions this week
    const { data: sub } = await supabase.from("subjects").select("study_status, maintenance_questions_this_week").eq("id", input.subject_id).maybeSingle();
    if (sub && sub.study_status === "finalized") {
      await supabase.from("subjects").update({
        maintenance_questions_this_week: (sub.maintenance_questions_this_week ?? 0) + input.questions_done
      }).eq("id", input.subject_id);
    }
  }
}

export async function scheduleLessonReviews(subjectId: string, topic?: string, editalAssuntoId?: number | null) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("no user");
  const canonical = editalAssuntoId != null ? idCanonicoAssunto(editalAssuntoId) : null;
  const intervals = [
    {layer:1, days:7}, {layer:2, days:15},
    {layer:3, days:30}, {layer:4, days:60},
  ];

  let previstos = intervals;
  if (canonical != null) {
    // Impede ciclos de revisão duplicados do MESMO assunto cursado em bancos
    // diferentes, inclusive quando há histórico com IDs anteriores à unificação.
    const aliases = idsOriginaisDoAssunto(canonical);
    const {data: existentes, error: searchError} = await supabase.from("reviews")
      .select("layer,done").eq("user_id",u.user.id)
      .in("edital_assunto_id",aliases);
    if (searchError) throw searchError;
    const layersRegistradas = new Set((existentes ?? []).map(r => r.layer));
    previstos = intervals.filter(e => !layersRegistradas.has(e.layer));
  }
  if (!previstos.length) return;
  const inserts = previstos.map(({layer,days}) => ({
    user_id: u.user!.id, subject_id: subjectId, layer,
    next_review_date: addDaysStr(days),
    topic: topic?.trim() || null,
    ...(canonical != null ? {edital_assunto_id:canonical} : {}),
    done:false,
  }));
  // A trava SQL usa índice único parcial. Inserimos por camada para que uma
  // colisão simultânea (23505) não descarte as outras revisões do ciclo.
  for (const entry of inserts) {
    const { error } = await supabase.from("reviews").insert(entry);
    if (error && error.code !== "23505") throw error;
  }
}

export async function finalizeLesson(subjectId: string, topic?: string) {
  return scheduleLessonReviews(subjectId, topic);
}

export async function completeReview(reviewId: string, layer: number) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;

  // Busca dados da revisão para reagendar
  const existingReview = await supabase
    .from("reviews").select("subject_id, topic, layer, edital_assunto_id").eq("id", reviewId).maybeSingle();
  // Compatibilidade durante a publicação: revisão comum continua funcionando sem a migração.
  const fallbackReview = existingReview.error
    ? await supabase.from("reviews").select("subject_id, topic, layer").eq("id", reviewId).maybeSingle()
    : null;
  if (existingReview.error && fallbackReview?.error) throw fallbackReview.error;
  const rev = existingReview.error
    ? (fallbackReview?.data ? { ...fallbackReview.data, edital_assunto_id: null as number | null } : null)
    : existingReview.data;

  // Marca como concluída
  const { error: markError } = await supabase.from("reviews").update({ done: true, last_reviewed_at: new Date().toISOString() }).eq("id", reviewId);
  if (markError) throw markError;

  // Se é a revisão de 60 dias (layer 4) ou repetição, agenda a próxima para +60 dias
  if ((layer === 4 || rev?.layer === 4) && rev) {
    const { error: repeatError } = await supabase.from("reviews").insert({
      user_id: u.user.id,
      subject_id: rev.subject_id,
      layer: 4,
      next_review_date: addDaysStr(60),
      topic: rev.topic,
      ...(rev.edital_assunto_id != null ? { edital_assunto_id: idCanonicoAssunto(rev.edital_assunto_id) } : {}),
      done: false,
    });
    if (repeatError && repeatError.code !== "23505") throw repeatError;
  }
}

export async function reviewFlashcard(cardId: string, correct: boolean, box: number) {
  const nextBox = correct ? Math.min(box + 1, 5) : 1;
  const intervals = [1, 2, 4, 8, 16];
  const nextDate = addDaysStr(intervals[nextBox - 1]);
  await supabase.rpc; // no-op placeholder
  const { data: card } = await supabase.from("flashcards").select("times_reviewed, times_correct").eq("id", cardId).maybeSingle();
  await supabase.from("flashcards").update({
    box: nextBox,
    next_review_date: nextDate,
    last_reviewed_at: new Date().toISOString(),
    times_reviewed: (card?.times_reviewed ?? 0) + 1,
    times_correct: (card?.times_correct ?? 0) + (correct ? 1 : 0),
  }).eq("id", cardId);
}

export async function logError(input: {
  subject_id: string | null; topic?: string; banca?: string;
  question: string; correct_answer?: string; my_answer?: string; reason?: string;
  make_flashcard?: boolean; front?: string; back?: string;
}) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("no user");
  const { data: err, error } = await supabase.from("errors").insert({
    user_id: u.user.id,
    subject_id: input.subject_id, topic: input.topic, banca: input.banca,
    question: input.question, correct_answer: input.correct_answer,
    my_answer: input.my_answer, reason: input.reason,
  }).select().single();
  if (error) throw error;
  if (input.make_flashcard && input.front && input.back) {
    await supabase.from("flashcards").insert({
      user_id: u.user.id, subject_id: input.subject_id, error_id: err.id,
      front: input.front, back: input.back,
    });
  }
}

export async function updateError(id: string, patch: {
  subject_id?: string | null; topic?: string | null; banca?: string | null;
  question?: string; correct_answer?: string | null; my_answer?: string | null; reason?: string | null;
}) {
  const { error } = await supabase.from("errors").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteError(id: string) {
  const { error } = await supabase.from("errors").delete().eq("id", id);
  if (error) throw error;
}

export async function updateFlashcard(id: string, patch: { front?: string; back?: string; subject_id?: string | null }) {
  const { error } = await supabase.from("flashcards").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteFlashcard(id: string) {
  const { error } = await supabase.from("flashcards").delete().eq("id", id);
  if (error) throw error;
}

export async function getAllFlashcards() {
  const { data } = await supabase.from("flashcards").select("*, subject:subjects(name,color)").order("created_at", { ascending: false });
  return data ?? [];
}

export async function createFlashcard(input: { front: string; back: string; subject_id: string | null }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("no user");
  const { error } = await supabase.from("flashcards").insert({
    user_id: u.user.id, subject_id: input.subject_id, front: input.front, back: input.back,
  });
  if (error) throw error;
}

export async function updateSession(id: string, patch: {
  subject_id?: string | null; kind?: "leitura"|"questoes"|"revisao"|"redacao"|"flashcards";
  minutes?: number; pages_read?: number; questions_done?: number; questions_correct?: number; notes?: string | null;
  task?: string | null; lesson?: string | null; page_start?: number | null; page_end?: number | null; session_date?: string;
}) {
  // Videoaula: ajusta minutos assistidos pela diferença
  {
    const { data: ex } = await supabase.from("study_sessions").select("minutes, subject_id, task").eq("id", id).maybeSingle();
    if (ex) {
      const oldSub = ex.task === "Videoaula" ? ex.subject_id : null;
      const newTask = patch.task !== undefined ? patch.task : ex.task;
      const newSubId = patch.subject_id !== undefined ? patch.subject_id : ex.subject_id;
      const newSub = newTask === "Videoaula" ? newSubId : null;
      const newMin = patch.minutes ?? ex.minutes ?? 0;
      if (oldSub) await adjustVideoWatched(oldSub, -(ex.minutes ?? 0));
      if (newSub) await adjustVideoWatched(newSub, newMin);
    }
  }
  // If pages_read changed, adjust the subject's accumulated pages_read by the delta
  if (patch.pages_read !== undefined) {
    const { data: existing } = await supabase.from("study_sessions").select("pages_read, subject_id").eq("id", id).maybeSingle();
    if (existing) {
      const subjectId = patch.subject_id !== undefined ? patch.subject_id : existing.subject_id;
      const oldPages = existing.pages_read ?? 0;
      const newPages = patch.pages_read ?? 0;
      const delta = newPages - oldPages;
      if (delta !== 0 && subjectId) {
        const { data: sub } = await supabase.from("subjects").select("pages_read").eq("id", subjectId).maybeSingle();
        if (sub) {
          await supabase.from("subjects").update({
            pages_read: Math.max(0, (sub.pages_read ?? 0) + delta),
          }).eq("id", subjectId);
        }
      }
    }
  }
  const { error } = await supabase.from("study_sessions").update(patch).eq("id", id);
  if (error) throw error;
}

export async function adjustVideoWatched(subjectId: string, deltaMinutes: number) {
  if (!deltaMinutes) return;
  const { data: sub } = await (supabase.from("subjects") as any).select("video_minutes_watched").eq("id", subjectId).maybeSingle();
  if (!sub) return;
  await (supabase.from("subjects") as any).update({
    video_minutes_watched: Math.max(0, (sub.video_minutes_watched ?? 0) + deltaMinutes),
  }).eq("id", subjectId);
}

export async function deleteSession(id: string) {
  {
    const { data: ex } = await supabase.from("study_sessions").select("minutes, subject_id, task").eq("id", id).maybeSingle();
    if (ex && ex.subject_id && ex.task === "Videoaula") await adjustVideoWatched(ex.subject_id, -(ex.minutes ?? 0));
  }
  // Subtract this session's pages_read from the subject before deleting
  const { data: existing } = await supabase.from("study_sessions").select("pages_read, subject_id").eq("id", id).maybeSingle();
  if (existing && existing.subject_id && existing.pages_read && existing.pages_read > 0) {
    const { data: sub } = await supabase.from("subjects").select("pages_read").eq("id", existing.subject_id).maybeSingle();
    if (sub) {
      await supabase.from("subjects").update({
        pages_read: Math.max(0, (sub.pages_read ?? 0) - existing.pages_read),
      }).eq("id", existing.subject_id);
    }
  }
  const { error } = await supabase.from("study_sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function updateSubject(id: string, patch: {
  pages?: number; pages_read?: number; total_questions?: number; name?: string; color?: string; weight?: number;
  study_status?: string; maintenance_weekly_questions_goal?: number; maintenance_questions_this_week?: number;
  planned_hours_per_week?: number; exam_questions?: number; min_questions?: number;
  video_minutes_total?: number; video_minutes_watched?: number;
}) {
  const { error } = await (supabase.from("subjects") as any).update(patch).eq("id", id);
  if (error) throw error;
  if(patch.planned_hours_per_week!==undefined){
    const {error:slotError}=await supabase.from("cycle_slots").update({hours_per_cycle:patch.planned_hours_per_week}).eq("subject_id",id);
    if(slotError)throw slotError;
  }
  await announcePlannerProgress();
}

export async function createSubject(input: { name: string; color?: string; weight?: number; pages?: number; pages_read?: number; total_questions?: number; video_minutes_total?: number; video_minutes_watched?: number; planned_hours_per_week?:number; categories?:ProgressCategory[] }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("no user");
  const { data: existing } = await supabase.from("subjects").select("ord").order("ord", { ascending: false }).limit(1);
  const nextOrd = (existing && existing[0]?.ord ? existing[0].ord : 0) + 1;
  const definition=input.categories?.length?{number:await allocateTribunalId(),categories:input.categories,topics:[]}:undefined;
  const { data: created, error } = await (supabase.from("subjects") as any).insert({
    ...(definition?{tribunal_data:definition}:{}),
    user_id: u.user.id,
    name: input.name,
    video_minutes_total: input.video_minutes_total || 0,
    video_minutes_watched: input.video_minutes_watched || 0,
    color: input.color || "#0284C7",
    weight: input.weight || 2,
    planned_hours_per_week:input.planned_hours_per_week??0,
    pages: input.pages || 0,
    pages_read: input.pages_read || 0,
    total_questions: input.total_questions || 0,
    ord: nextOrd,
  }).select("id").single();
  if (error) throw error;
  await announcePlannerProgress();
  return created.id as string;
}

async function allocateTribunalId():Promise<number>{
 const {data,error}=await (supabase as any).rpc("planner_allocate_tribunal_id");
 if(error||!Number.isInteger(data))throw new Error("O cadastro editável precisa da migração do catálogo no Supabase.");
 return data;
}
async function writeTribunalDefinition(subject:Subject,next:TribunalData){
 if(!subject.tribunal_data)throw new Error("O cadastro editável precisa da migração do catálogo no Supabase.");
 const {data,error}=await (supabase as any).rpc("planner_update_tribunal_data",{p_subject_id:subject.id,p_expected:subject.tribunal_data,p_next:next});
 if(error)throw error;
 if(!data)throw new Error("A matéria não pôde ser atualizada: alteração concorrente ou permissão insuficiente (RLS). Atualize e tente novamente.");
 await announcePlannerProgress();
}
/** Somente ausência de estrutura autoriza o caminho compatível; nunca ignora RLS. */
function missingCatalogStructure(error:unknown):boolean{
 const e=error as {code?:string;message?:string};
 return ["PGRST202","PGRST204","42883","42703","42P01"].includes(e?.code??"");
}
export function tribunalTopicError(error:unknown):string{
 const e=error as {code?:string;message?:string;status?:number};
 if(e?.code==="42501"||e?.status===403||/row.level.security|permission denied/i.test(e?.message??""))return "O Supabase não permitiu a alteração (permissão/RLS). Verifique as permissões da sua conta. Nenhum histórico foi excluído.";
 if(e?.code==="23503"||/foreign key/i.test(e?.message??""))return "O assunto possui vínculos no banco (chave estrangeira). A alteração foi recusada; os registros históricos foram preservados.";
 if(e?.status===401||e?.code==="session_not_found")return "Sua sessão expirou. Entre novamente e tente salvar.";
 return e?.message||"Não foi possível alterar o assunto. Tente novamente.";
}
async function persistTopicOverride(subject:Subject,id:number,patch:TopicOverride):Promise<Subject>{
 // Auth API do mesmo Supabase: alteração persistente por conta, sem nova coluna/tabela.
 // Cada assunto tem sua própria chave para não sobrescrever edições de outros assuntos.
 // Metadados são usados somente para personalizar conteúdo, nunca para autorização.
 const key=topicOverrideKey(subject.id,id);
 const {data,error}=await supabase.auth.updateUser({data:{[key]:patch}});
 if(error)throw error;
 const saved=data.user?.user_metadata?.[key];
 if(!saved||("removed" in patch?saved.removed!==true:saved.title!==patch.title||saved.scope!==patch.scope))throw new Error("O banco não confirmou a gravação do assunto. Atualize a lista e tente novamente.");
 await announcePlannerProgress();
 return {...subject,topic_overrides:{...subject.topic_overrides,[String(id)]:patch}};
}
export async function changeTribunalTopic(subjectId:string,input:{id?:number;title?:string;scope?:TopicScope;remove?:boolean}):Promise<Subject>{
 const subject=(await getSubjects()).find(s=>s.id===subjectId);
 if(!subject)throw new Error("Matéria não encontrada ou sem acesso.");
 const current=subjectDefinition(subject);
 if(!current)throw new Error("Não foi possível carregar o catálogo da matéria.");
 if(input.id!==undefined&&!current.topics.some(t=>t.id===input.id))throw new Error("O assunto não está mais cadastrado.");
 if(input.remove&&input.id===undefined)throw new Error("Selecione o assunto.");
 const title=input.title?.trim();
 if(!input.remove&&(!title||!input.scope||!scopeOptions(subject).includes(input.scope)))throw new Error("Informe o assunto e um escopo válido.");

 if(input.id===undefined){
  // Adição mantém o mecanismo já existente de IDs únicos do catálogo migrado.
  if(!subject.tribunal_data)throw new Error("Adicionar um assunto novo requer a estrutura de cadastro. Editar e excluir os assuntos existentes já está disponível.");
  const topic:TribunalTopic={id:await allocateTribunalId(),title:title!,scope:input.scope!};
  const next={...subject.tribunal_data,topics:[...subject.tribunal_data.topics,topic]};
  await writeTribunalDefinition(subject,next);
  return {...subject,tribunal_data:next};
 }

 const id=input.id;
 const patch:TopicOverride=input.remove?{removed:true}:{title:title!,scope:input.scope!};
 // Catálogo já migrado: grava no próprio registro da matéria com controle de concorrência.
 // Uma personalização legada continua sendo editada na mesma chave, inclusive após a migração.
 if(subject.tribunal_data&&!subject.topic_overrides?.[String(id)]){
  const raw=subject.tribunal_data;
  const topics=input.remove?raw.topics.filter(t=>t.id!==id):raw.topics.map(t=>t.id===id?{...t,title:title!,scope:input.scope!}:t);
  const next={...raw,topics};
  try{
   await writeTribunalDefinition(subject,next);
   return {...subject,tribunal_data:next};
  }catch(error){
   if(!missingCatalogStructure(error))throw error;
  }
 }
 return persistTopicOverride(subject,id,patch);
}
export async function archiveTribunalSubject(subjectId:string){
 const subject=(await getSubjects()).find(s=>s.id===subjectId);
 if(!subject?.tribunal_data)throw new Error("A exclusão sincronizada precisa da migração do catálogo no Supabase.");
 await writeTribunalDefinition(subject,{...subject.tribunal_data,archived:true});
}
export async function deleteSubject(id: string) {
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw error;
}

export async function resetAllStudyData() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("no user");

  const uid = u.user.id;
  const fail = (label: string, error: any) => {
    if (error) throw new Error(`${label}: ${error.message ?? error}`);
  };

  // 1. Apaga todos os registros de estudo
  fail("sessões", (await supabase.from("study_sessions").delete().eq("user_id", uid)).error);
  fail("revisões", (await supabase.from("reviews").delete().eq("user_id", uid)).error);
  fail("flashcards", (await supabase.from("flashcards").delete().eq("user_id", uid)).error);
  fail("caderno de erros", (await supabase.from("errors").delete().eq("user_id", uid)).error);

  // 2. Zera o progresso do ciclo de estudos (horas feitas e planejadas por matéria)
  fail("ciclo", (await supabase.from("cycle_slots").update({ done_hours: 0, hours_per_cycle: 1 }).eq("user_id", uid)).error);

  // 3. Reseta páginas (totais e lidas), questões, horas semanais e status das matérias
  fail("matérias", (await supabase.from("subjects").update({
    pages: 0,
    pages_read: 0,
    video_minutes_watched: 0,
    total_questions: 0,
    exam_questions: 0,
    min_questions: 0,
    maintenance_questions_this_week: 0,
    planned_hours_per_week: 0,
    weight: 0,
    study_status: "pending",
  }).eq("user_id", uid)).error);

  // 4. Reseta gamificação e metas do perfil
  fail("perfil", (await supabase.from("profiles").update({
    xp: 0,
    streak_days: 0,
    last_study_date: null,
    weekly_goal_hours: 12,
    weekly_goal_questions: 100,
  }).eq("id", uid)).error);
  await ensureUserBootstrap(true);
  const {error:layoutError}=await supabase.auth.updateUser({data:{planner_cycle_layout_v1:null}});
  if(layoutError)throw layoutError;
}


export async function updateProfile(patch: { weekly_goal_hours?: number; weekly_goal_questions?: number; display_name?: string; exam_name?: string; exam_date?: string | null; review_intervals?: number[] }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("no user");
  try {
    const { error } = await supabase.from("profiles").update(patch).eq("id", u.user.id);
    if (error) {
      // If exam_date is a Postgres date column and "Pré-edital" causes type mismatch, fallback to null
      if (error.message && error.message.includes("date") && patch.exam_date === "Pré-edital") {
        const { error: fallbackErr } = await supabase.from("profiles").update({ ...patch, exam_date: null }).eq("id", u.user.id);
        if (fallbackErr) throw fallbackErr;
        return;
      }
      throw error;
    }
  } catch (e: any) {
    if (patch.exam_date === "Pré-edital") {
      const { error: fallbackErr } = await supabase.from("profiles").update({ ...patch, exam_date: null }).eq("id", u.user.id);
      if (fallbackErr) throw fallbackErr;
      return;
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Bootstrap: cria perfil + matérias + ciclo caso ainda não existam.
// Não depende de trigger no banco.
// ---------------------------------------------------------------------------
const PLAN_NAME="TJGO · Analista Administrativo | TJDFT · Técnico Administrativo";
export async function ensureUserBootstrap(forceInitialPlan=false):Promise<void>{
 const {data:auth}=await supabase.auth.getUser();const user=auth?.user;if(!user)return;
 const uid=user.id;
 const {data:prof,error:profileError}=await supabase.from("profiles").select("id,exam_name").eq("id",uid).maybeSingle();
 if(profileError)throw profileError;
 if(!prof){const {error}=await supabase.from("profiles").insert({id:uid,display_name:(user.user_metadata as any)?.display_name??(user.email??"").split("@")[0],exam_name:PLAN_NAME,exam_date:null,weekly_goal_hours:12} as any);if(error)throw error;}
 const {data:existing,error:subjectError}=await supabase.from("subjects").select("id,name,ord,study_status").eq("user_id",uid).order("ord");
 if(subjectError)throw subjectError;
 const byName=new Map((existing??[]).map(s=>[s.name,s]));
 const first=forceInitialPlan||user.user_metadata?.tribunal_plan_version!==1;
 if(!first)return;
 for(const [i,g] of tribunalGroups.entries()){
  const old=byName.get(g.name);
  const row={name:g.name,ord:i,planned_hours_per_week:g.hours,exam_questions:g.questions??0,weight:g.questions?Math.min(5,Math.max(1,Math.round((g.points??g.questions)/g.questions))):2,study_status:g.hours?"active":"pending"};
  if(old){if(first){const {error}=await (supabase.from("subjects") as any).update(row).eq("id",old.id).eq("user_id",uid);if(error)throw error;}continue;}
  const {data:created,error}=await (supabase.from("subjects") as any).insert({...row,user_id:uid,pages:0,pages_read:0,total_questions:0,color:["#16a34a","#2563eb","#d97706","#7c3aed","#0891b2"][i%5]}).select("id,name,ord,study_status").single();
  if(error)throw error;byName.set(g.name,created);
 }
 if(first){
  // Apenas substitui a programação do ciclo deste usuário. Histórico de sessões/revisões é preservado.
  const {error:del}=await supabase.from("cycle_slots").delete().eq("user_id",uid);if(del)throw del;
  // Um slot por matéria, com total semanal; a ordem das sessões é apresentada no Ciclo.
  const rows=tribunalGroups.filter(g=>g.hours).map((g,i)=>({user_id:uid,subject_id:byName.get(g.name)!.id,ord:i,hours_per_cycle:g.hours,done_hours:0}));
  const {error:slotError}=await supabase.from("cycle_slots").insert(rows as any);if(slotError)throw slotError;
  const {error:profileUpdate}=await supabase.from("profiles").update({exam_name:PLAN_NAME,weekly_goal_hours:12}).eq("id",uid);if(profileUpdate)throw profileUpdate;
  const {error:versionError}=await supabase.auth.updateUser({data:{tribunal_plan_version:1}});if(versionError)throw versionError;
 }
}
