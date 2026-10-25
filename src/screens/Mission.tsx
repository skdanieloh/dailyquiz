import { useEffect, useState } from "react";
import type { Attempt, Mission as MissionType, StageResult } from "../data/types";
import { Session } from "../game/session";
import { difficultyText, formatClock, won } from "../lib/format";
import { kstDate, minutesUntilKstMidnight } from "../lib/kst";
import { rewardOf, STAGE_COUNT } from "../lib/reward";
import { clearRun, loadRun, saveRun, type RunState } from "../lib/run";

export function Mission({
  mission,
  uid,
  onExit,
  onSave,
  onFinished,
}: {
  mission: MissionType;
  uid: string;
  onExit: () => void;
  onSave: (attempt: Attempt) => Promise<void>;
  onFinished: (attempt: Attempt) => void;
}) {
  const [run, setRun] = useState<RunState | null>(null);
  const [mode, setMode] = useState<"intro" | "play" | "saving" | "error" | "expired">("intro");
  const [pending, setPending] = useState<Attempt | null>(null);
  const [leave, setLeave] = useState(false);
  const [now, setNow] = useState(Date.now());
  const existing = loadRun(uid, mission.date);
  const soon = minutesUntilKstMidnight() <= 20;

  useEffect(() => {
    if (mode !== "play") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [mode]);

  function begin() {
    if (kstDate() !== mission.date) {
      setMode("expired");
      return;
    }
    const next = existing ?? { startedAt: Date.now(), done: [] };
    if (!existing) saveRun(uid, mission.date, next);
    setRun(next);
    setMode("play");
  }

  async function complete(stages: StageResult[]) {
    if (!run) return;
    let started = new Date(run.startedAt);
    const completed = new Date();
    if (kstDate(completed) !== mission.date) {
      setMode("expired");
      return;
    }
    if (started.getTime() > completed.getTime()) started = completed;
    const correctCount = stages.filter((stage) => stage.correct).length;
    const attempt: Attempt = {
      date: mission.date,
      missionId: mission.id,
      type: mission.type,
      phase: mission.phase,
      subject: mission.subject,
      title: mission.title,
      difficulty: mission.difficulty,
      difficultyLabel: mission.difficultyLabel,
      correctCount,
      maxStages: 5,
      reward: rewardOf(correctCount),
      startedAt: started.toISOString(),
      completedAt: completed.toISOString(),
      durationMs: completed.getTime() - started.getTime(),
      stages,
    };
    setPending(attempt);
    setMode("saving");
    try {
      await onSave(attempt);
      clearRun(uid, mission.date);
      onFinished(attempt);
    } catch {
      setMode("error");
    }
  }

  async function retry() {
    if (!pending) return;
    setMode("saving");
    try {
      await onSave(pending);
      clearRun(uid, mission.date);
      onFinished(pending);
    } catch {
      setMode("error");
    }
  }

  if (mode === "expired") {
    return (
      <main className="login">
        <h1>오늘의 미션이 닫혔어요</h1>
        <p className="lead">자정이 지나 기록이 저장되지 않았어요. 새로운 카드는 오늘 0시에 열렸어요.</p>
        <button type="button" className="btn" onClick={onExit}>
          홈으로
        </button>
      </main>
    );
  }

  if (mode === "error" && pending) {
    return (
      <main className="login">
        <h1>기록을 저장하지 못했어요</h1>
        <p className="lead">
          {pending.correctCount}/5단계 · {won(pending.reward)} · 결과는 이 화면에 남아 있어요.
        </p>
        <button type="button" className="btn" onClick={() => void retry()}>
          다시 저장하기
        </button>
      </main>
    );
  }

  if (mode === "saving") {
    return (
      <main className="login">
        <h1>결과를 기록하고 있어요</h1>
      </main>
    );
  }

  if (mode === "play" && run) {
    return (
      <main className="play">
        <header className="topbar">
          <button type="button" className="icon-btn" aria-label="나가기" onClick={() => setLeave(true)}>
            <Chevron />
          </button>
          <h1>{mission.subject}</h1>
          <span className="timer">{formatClock(now - run.startedAt)}</span>
        </header>
        <Session
          mission={mission}
          initialDone={run.done}
          onTrial={(done) => {
            const next = { startedAt: run.startedAt, done };
            saveRun(uid, mission.date, next);
            setRun(next);
          }}
          onComplete={(stages) => void complete(stages)}
        />
        {leave ? (
          <div className="overlay" role="presentation">
            <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="leave-title">
              <h2 id="leave-title">미션을 나갈까요?</h2>
              <p className="lead">나간 뒤에도 시작한 시간은 이어지고, 오늘 자정에 카드가 닫혀요.</p>
              <div className="split">
                <button type="button" className="btn secondary" onClick={() => setLeave(false)}>
                  계속 풀기
                </button>
                <button type="button" className="btn" onClick={onExit}>
                  나가기
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <button type="button" className="icon-btn" aria-label="뒤로" onClick={onExit}>
          <Chevron />
        </button>
        <h1>{mission.day}일차</h1>
        <span />
      </header>
      <div className="home-body">
        <section className="hero">
          <div className="row-line">
            <span className="badge blue">{mission.subject}</span>
            <span className="badge grey">{mission.phase}</span>
          </div>
          <h2>{mission.title}</h2>
          <p className="lead">{mission.lead}</p>
          <p className="meta">
            난이도 {difficultyText(mission.difficulty)} · {mission.difficultyLabel}
          </p>
          <ol className="steps">
            {mission.steps.map((step, index) => (
              <li key={step}>
                <span className="num">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="scale" aria-label="보상 단계">
            {Array.from({ length: STAGE_COUNT + 1 }, (_, step) => (
              <div key={step}>
                <b>{won(rewardOf(step)).replace("원", "")}</b>
                <span>{step}단계</span>
              </div>
            ))}
          </div>
          <p className="quiet">맞힌 단계마다 100원. 0단계도 500원이에요.</p>
          {soon ? <p className="warn">자정까지 20분이 남지 않았어요. 지금 시작해도 자정이 지나면 저장되지 않아요.</p> : null}
        </section>
      </div>
      <div className="dock">
        <button type="button" className="btn" onClick={begin}>
          {existing ? "이어서 풀기" : "시작하기"}
        </button>
      </div>
    </main>
  );
}

function Chevron() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
