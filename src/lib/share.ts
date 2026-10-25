import type { Attempt } from "../data/types";
import { difficultyText, formatDuration, koreanDate, kstClock, won } from "./format";
import { shareImage } from "./shareCard";

export function shareText(attempt: Attempt) {
  const stages = attempt.stages
    .map((stage, index) => `${index + 1}단계 ${stage.correct ? "성공" : "실패"} · ${stage.summary}`)
    .join("\n");
  return [
    "dailyquiz",
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
  const blob = await shareImage(attempt);
  const file = new File([blob], `dailyquiz-${attempt.date}.png`, { type: "image/png" });
  if (typeof navigator.share === "function") {
    const withFile = { files: [file], title: "dailyquiz 결과", text };
    const imageOnly = { files: [file], title: "dailyquiz 결과" };
    try {
      if (navigator.canShare?.(withFile)) {
        await navigator.share(withFile);
        return { kind: "shared" } as const;
      }
      if (navigator.canShare?.(imageOnly)) {
        await navigator.share(imageOnly);
        return { kind: "shared" } as const;
      }
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") return { kind: "aborted" } as const;
    }
  }
  return { kind: "card", text, blob } as const;
}
