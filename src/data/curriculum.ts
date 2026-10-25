import raw from "./curriculum.json";
import type { Curriculum, Mission } from "./types";

export const curriculum = raw as Curriculum;

export function missionByDate(date: string): Mission | null {
  const index = dayOffset(curriculum.startDate, date);
  if (index < 0 || index >= curriculum.missions.length) return null;
  const mission = curriculum.missions[index];
  return mission.date === date ? mission : null;
}

export function dayOffset(start: string, date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [y0, m0, d0] = start.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y0, m0 - 1, d0)) / 86400000);
}
