import type { StageResult } from "../data/types";

export type RunState = {
  startedAt: number;
  done: StageResult[];
};

function key(uid: string, date: string) {
  return `dq-run:${uid}:${date}`;
}

export function loadRun(uid: string, date: string): RunState | null {
  const raw = localStorage.getItem(key(uid, date));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RunState;
    if (typeof parsed.startedAt !== "number" || !Array.isArray(parsed.done)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveRun(uid: string, date: string, run: RunState) {
  localStorage.setItem(key(uid, date), JSON.stringify(run));
}

export function clearRun(uid: string, date: string) {
  localStorage.removeItem(key(uid, date));
}
