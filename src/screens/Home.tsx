import { useEffect } from "react";
import { curriculum, missionByDate } from "../data/curriculum";
import type { Attempt, Mission } from "../data/types";
import { difficultyText, koreanDate, monthTitle, won } from "../lib/format";
import { cardStatus } from "../lib/kst";
import { loadRun } from "../lib/run";

const groups: { title: string; items: Mission[] }[] = [];
for (const mission of curriculum.missions) {
  const title = monthTitle(mission.date);
  const last = groups[groups.length - 1];
  if (!last || last.title !== title) groups.push({ title, items: [mission] });
  else last.items.push(mission);
}

export function Home({
  name,
  photo,
  uid,
  today,
  attempts,
  onOpen,
  onResult,
  onShare,
  onSignOut,
  onToast,
}: {
  name: string;
  photo: string;
  uid: string;
  today: string;
  attempts: Record<string, Attempt>;
  onOpen: (date: string) => void;
  onResult: (date: string) => void;
  onShare: (attempt: Attempt) => void;
  onSignOut: () => void;
  onToast: (message: string) => void;
}) {
  const todayMission = missionByDate(today);
  const todayAttempt = todayMission ? attempts[todayMission.date] : undefined;
  const running = todayMission ? loadRun(uid, todayMission.date) : null;
  const doneCount = curriculum.missions.filter((mission) => attempts[mission.date]).length;

  useEffect(() => {
    if (!todayMission || todayMission.day <= 3) return;
    document.getElementById(`day-${todayMission.date}`)?.scrollIntoView({ block: "center" });
  }, [todayMission]);

  function openRow(mission: Mission) {
    const status = cardStatus(mission.date, today, Boolean(attempts[mission.date]));
    if (status === "locked") {
      onToast(`${koreanDate(mission.date)} 0시에 열려요`);
      return;
    }
    if (status === "missed") {
      onToast("이 미션은 자정에 종료됐어요");
      return;
    }
    if (status === "done") onResult(mission.date);
    else onOpen(mission.date);
  }

  return (
    <main className="page">
      <header className="home-head">
        <div>
          <p className="eyebrow">매일 0시 오픈</p>
          <h1>하루 작업기억</h1>
          <p className="hello">{name}님, 오늘도 한 단계만 올라가요.</p>
        </div>
        {photo ? <img className="avatar" src={photo} alt="" referrerPolicy="no-referrer" /> : <div className="avatar fallback">{name.slice(0, 1)}</div>}
      </header>
      <div className="home-body">
        {todayMission ? (
          <section className="hero">
            <div className="row-line">
              <span className="badge blue">오늘 · {todayMission.day}일차</span>
              <span className="badge grey">{todayMission.phase}</span>
            </div>
            <p className="quiet">{koreanDate(todayMission.date)}</p>
            <h2>{todayMission.title}</h2>
            <p className="lead">{todayMission.lead}</p>
            <p className="meta">
              난이도 {difficultyText(todayMission.difficulty)} · {todayMission.difficultyLabel}
            </p>
            {todayAttempt ? (
              <>
                <p className="money">{won(todayAttempt.reward)}</p>
                <p className="meta">
                  {todayAttempt.correctCount}/5단계 · {todayAttempt.subject}
                </p>
                <div className="split">
                  <button type="button" className="btn secondary" onClick={() => onResult(todayMission.date)}>
                    결과 보기
                  </button>
                  <button type="button" className="btn" onClick={() => onShare(todayAttempt)}>
                    결과 공유하기
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="btn" onClick={() => onOpen(todayMission.date)}>
                {running ? "이어서 풀기" : "오늘 미션 시작하기"}
              </button>
            )}
          </section>
        ) : (
          <section className="hero">
            <h2>400일 과정을 마쳤어요</h2>
            <p className="lead">기록해 둔 결과지는 아래 카드에서 다시 볼 수 있어요.</p>
          </section>
        )}
        <div className="section-head">
          <h3>전체 미션</h3>
          <span>
            {doneCount}/{curriculum.days}일 완료
          </span>
        </div>
        {groups.map((group) => (
          <section key={group.title}>
            <h4 className="month">{group.title}</h4>
            {group.items.map((mission) => {
              const attempt = attempts[mission.date];
              const status = cardStatus(mission.date, today, Boolean(attempt));
              return (
                <button
                  key={mission.id}
                  id={`day-${mission.date}`}
                  type="button"
                  className={`row ${status}`}
                  onClick={() => openRow(mission)}
                >
                  <span className="day">{mission.day}일</span>
                  <span className="grow">
                    <span className="title">{mission.subject}</span>
                    <span className="sub">
                      {koreanDate(mission.date)} · 난이도 {difficultyText(mission.difficulty)}
                    </span>
                  </span>
                  <span className={`badge ${status === "done" ? "green" : status === "open" ? "blue" : status === "missed" ? "red" : "grey"}`}>
                    {status === "done" ? won(attempt.reward) : status === "open" ? "오늘" : status === "missed" ? "종료" : "예정"}
                  </span>
                </button>
              );
            })}
          </section>
        ))}
        <button type="button" className="text-btn" onClick={onSignOut}>
          로그아웃
        </button>
      </div>
    </main>
  );
}
