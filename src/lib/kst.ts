export function kstDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function minutesUntilKstMidnight(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return 24 * 60 - (hour * 60 + minute);
}

export type CardStatus = "open" | "done" | "locked" | "missed";

export function cardStatus(date: string, today: string, completed: boolean): CardStatus {
  if (completed) return "done";
  if (date === today) return "open";
  if (date < today) return "missed";
  return "locked";
}
