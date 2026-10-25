import { missionByDate } from "../data/curriculum";
import type { Attempt } from "../data/types";
import { difficultyText, formatDuration, koreanDate, won } from "./format";

const width = 1200;
const height = 630;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export async function shareImage(attempt: Attempt) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들지 못했어요.");

  const day = missionByDate(attempt.date)?.day;
  const font = "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif";

  ctx.fillStyle = "#F2F4F6";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, 48, 48, 1104, 534, 40);
  ctx.fill();

  ctx.fillStyle = "#3182F6";
  roundRect(ctx, 96, 96, 72, 72, 20);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(114, 116, 36, 8);
  ctx.fillRect(114, 132, 28, 8);
  ctx.fillRect(114, 148, 18, 8);

  ctx.fillStyle = "#3182F6";
  ctx.font = `700 28px ${font}`;
  ctx.textBaseline = "middle";
  ctx.fillText("dailyquiz", 188, 132);

  ctx.fillStyle = "#191F28";
  ctx.font = `800 72px ${font}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(day ? `${day}일차` : koreanDate(attempt.date), 96, 268);

  ctx.fillStyle = "#6B7684";
  ctx.font = `600 32px ${font}`;
  ctx.fillText(koreanDate(attempt.date), 96, 322);

  ctx.fillStyle = "#4E5968";
  ctx.font = `700 36px ${font}`;
  ctx.fillText(attempt.subject, 96, 400);
  ctx.font = `600 28px ${font}`;
  ctx.fillStyle = "#6B7684";
  ctx.fillText(`난이도 ${difficultyText(attempt.difficulty)} · ${attempt.difficultyLabel}`, 96, 448);

  ctx.textAlign = "right";
  ctx.fillStyle = "#191F28";
  ctx.font = `800 92px ${font}`;
  ctx.fillText(won(attempt.reward), 1080, 300);
  ctx.fillStyle = "#4E5968";
  ctx.font = `700 34px ${font}`;
  ctx.fillText(`${attempt.correctCount}/${attempt.maxStages}단계 성공`, 1080, 360);
  ctx.fillText(formatDuration(attempt.durationMs), 1080, 408);
  ctx.textAlign = "left";

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("이미지를 만들지 못했어요."))), "image/png");
  });
  return blob;
}
