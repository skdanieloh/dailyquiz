import { doc, setDoc, Timestamp, type DocumentData } from "firebase/firestore";
import type { Attempt } from "../data/types";
import { db } from "./firebase";

function toIso(value: unknown) {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

export function asAttempt(id: string, data: DocumentData): Attempt | null {
  if (!Array.isArray(data.stages) || typeof data.correctCount !== "number") return null;
  return {
    date: typeof data.date === "string" ? data.date : id,
    missionId: String(data.missionId ?? ""),
    type: String(data.type ?? ""),
    phase: String(data.phase ?? ""),
    subject: String(data.subject ?? ""),
    title: String(data.title ?? ""),
    difficulty: Number(data.difficulty ?? 0),
    difficultyLabel: String(data.difficultyLabel ?? ""),
    correctCount: data.correctCount,
    maxStages: 5,
    reward: Number(data.reward ?? 0),
    startedAt: toIso(data.startedAt),
    completedAt: toIso(data.completedAt),
    durationMs: Number(data.durationMs ?? 0),
    stages: data.stages.map((stage: { correct?: boolean; summary?: string }) => ({
      correct: Boolean(stage.correct),
      summary: String(stage.summary ?? ""),
    })),
  };
}

export async function saveAttempt(uid: string, attempt: Attempt) {
  await setDoc(doc(db, "dailyquiz", uid, "attempts", attempt.date), {
    date: attempt.date,
    missionId: attempt.missionId,
    type: attempt.type,
    phase: attempt.phase,
    subject: attempt.subject,
    title: attempt.title,
    difficulty: attempt.difficulty,
    difficultyLabel: attempt.difficultyLabel,
    correctCount: attempt.correctCount,
    maxStages: attempt.maxStages,
    reward: attempt.reward,
    startedAt: Timestamp.fromDate(new Date(attempt.startedAt)),
    completedAt: Timestamp.fromDate(new Date(attempt.completedAt)),
    durationMs: attempt.durationMs,
    stages: attempt.stages,
  });
}

export async function saveProfile(uid: string, profile: { displayName: string; email: string; photoURL: string }) {
  await setDoc(
    doc(db, "dailyquiz", uid),
    {
      displayName: profile.displayName,
      email: profile.email,
      photoURL: profile.photoURL,
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );
}
