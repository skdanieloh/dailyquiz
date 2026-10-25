import type { Attempt } from "../data/types";
import { difficultyText, formatDuration, koreanDate, kstClock, won } from "./format";

export function shareText(attempt: Attempt) {
  const stages = attempt.stages
    .map((stage, index) => `${index + 1}단계 ${stage.correct ? "성공" : "실패"} · ${stage.summary}`)
    .join("\n");
  return [
    "하루 작업기억",
    koreanDate(attempt.date),
    "",
    `${attempt.subject} · ${attempt.title}`,
    `${attempt.phase} · 난이도 ${difficultyText(attempt.difficulty)} (${attempt.difficultyLabel})`,
    "",
    `결과 ${attempt.correctCount}/${attempt.maxStages}단계`,
    `보상 ${won(attempt.reward)}`,
    `시간 ${formatDuration(attempt.durationMs)} (${kstClock(attempt.startedAt)}–${kstClock(attempt.completedAt)})`,
    "",
    "과정",
    stages,
    "",
    "만점은 1,000원, 모두 틀려도 500원이에요.",
    "결과지를 받은 부모님이 자녀에게 이 금액을 지급해 주세요.",
  ].join("\n");
}

export async function shareSummary(attempt: Attempt) {
  const text = shareText(attempt);
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "하루 작업기억 결과", text });
      return "shared" as const;
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") return "aborted" as const;
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied" as const;
}
