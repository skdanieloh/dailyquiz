import type { Attempt, Mission } from "../data/types";
import { difficultyText, formatDuration, koreanDate, kstClock, won } from "../lib/format";
import { kstDate } from "../lib/kst";
import { rewardOf, STAGE_COUNT } from "../lib/reward";

export function Result({
  mission,
  attempt,
  onHome,
  onShare,
}: {
  mission: Mission | null;
  attempt: Attempt;
  onHome: () => void;
  onShare: () => void;
}) {
  return (
    <main className="page">
      <header className="topbar">
        <button type="button" className="icon-btn" aria-label="홈으로" onClick={onHome}>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>{attempt.date === kstDate() ? "오늘의 결과" : "지난 결과"}</h1>
        <span />
      </header>
      <div className="home-body">
        <section className="hero">
          <p className="quiet">{koreanDate(attempt.date)}</p>
          <p className="money">{won(attempt.reward)}</p>
          <p className="lead">
            {attempt.correctCount}/{attempt.maxStages}단계 성공 · {formatDuration(attempt.durationMs)}
          </p>
          <p className="meta">
            {attempt.subject} · 난이도 {difficultyText(attempt.difficulty)} ({attempt.difficultyLabel})
          </p>
          <p className="quiet">
            {kstClock(attempt.startedAt)} 시작 · {kstClock(attempt.completedAt)} 완료
            {mission ? ` · ${mission.phase}` : ""}
          </p>
          <div className="scale">
            {Array.from({ length: STAGE_COUNT + 1 }, (_, step) => (
              <div key={step} className={step === attempt.correctCount ? "on" : ""}>
                <b>{won(rewardOf(step)).replace("원", "")}</b>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </section>
        <h3 className="section-label">과정</h3>
        <ol className="process">
          {attempt.stages.map((stage, index) => (
            <li key={`${stage.summary}-${index}`} className={stage.correct ? "ok" : "no"}>
              <span className="badge">{index + 1}단계 {stage.correct ? "성공" : "실패"}</span>
              <p>{stage.summary}</p>
            </li>
          ))}
        </ol>
        <p className="quiet pay-note">
          이 금액은 앱이 결제하지 않아요. 결과지를 부모님께 공유하면 부모님이 자녀에게 지급해요.
        </p>
      </div>
      <div className="dock">
        <button type="button" className="btn" onClick={onShare}>
          결과 공유하기
        </button>
      </div>
    </main>
  );
}
