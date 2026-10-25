import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import type { Attempt } from "./data/types";
import { missionByDate } from "./data/curriculum";
import { auth, authMessage, db, signInWithGoogle } from "./lib/firebase";
import { useKstToday } from "./lib/useKstToday";
import { asAttempt, saveAttempt, saveProfile } from "./lib/records";
import { shareSummary, shareText } from "./lib/share";
import { Gate } from "./screens/Gate";
import { Home } from "./screens/Home";
import { Login } from "./screens/Login";
import { Mission } from "./screens/Mission";
import { Result } from "./screens/Result";

type Route =
  | { name: "home" }
  | { name: "mission"; date: string }
  | { name: "result"; date: string; fresh?: Attempt };

function useMobile() {
  const query = "(max-width: 560px)";
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return mobile;
}

export default function App() {
  const mobile = useMobile();
  const today = useKstToday();
  const [preview, setPreview] = useState(() => import.meta.env.DEV && sessionStorage.getItem("dq-preview") === "1");
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(preview);
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [remote, setRemote] = useState<Record<string, Attempt>>({});
  const [localAttempts, setLocalAttempts] = useState<Record<string, Attempt>>(() => {
    if (!import.meta.env.DEV) return {};
    try {
      const raw = localStorage.getItem("dq-preview-attempts");
      return raw ? (JSON.parse(raw) as Record<string, Attempt>) : {};
    } catch {
      return {};
    }
  });
  const [route, setRoute] = useState<Route>({ name: "home" });
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const toastTimer = useRef(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setReady(true);
    });
    getRedirectResult(auth).catch((error: { code?: string }) => {
      setAuthError(authMessage(error.code ?? ""));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || preview) return;
    void saveProfile(user.uid, {
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
    }).catch(() => undefined);
  }, [user, preview]);

  useEffect(() => {
    if (!user || preview) return;
    return onSnapshot(collection(db, "dailyquiz", user.uid, "attempts"), (snapshot) => {
      const next: Record<string, Attempt> = {};
      snapshot.forEach((item) => {
        const attempt = asAttempt(item.id, item.data());
        if (attempt) next[attempt.date] = attempt;
      });
      setRemote(next);
    });
  }, [user, preview]);

  function showToast(message: string) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  async function share(attempt: Attempt) {
    try {
      const result = await shareSummary(attempt);
      if (result === "copied") showToast("결과지를 복사했어요. 부모님께 붙여 넣어 보내 주세요.");
      if (result === "shared" || result === "copied" || result === "aborted") return;
    } catch {
      // 공유 시트가 없으면 결과지 원문을 직접 보여 준다.
    }
    setSheet(shareText(attempt));
  }

  async function save(attempt: Attempt) {
    if (import.meta.env.DEV && preview) {
      const next = { ...localAttempts, [attempt.date]: attempt };
      setLocalAttempts(next);
      localStorage.setItem("dq-preview-attempts", JSON.stringify(next));
      return;
    }
    if (!user) throw new Error("로그인이 필요해요.");
    await saveAttempt(user.uid, attempt);
  }

  if (!mobile) return <Gate />;
  if (!ready) return <div className="center">불러오는 중</div>;

  const person = preview
    ? { uid: "preview", name: "미리보기", photo: "" }
    : user
      ? { uid: user.uid, name: user.displayName || "회원", photo: user.photoURL || "" }
      : null;
  const attempts = preview ? localAttempts : remote;

  if (!person) {
    return (
      <>
        <Login
          busy={busy}
          error={authError}
          onGoogle={() => {
            setBusy(true);
            setAuthError(null);
            void signInWithGoogle()
              .catch((error: { code?: string }) => setAuthError(authMessage(error.code ?? "")))
              .finally(() => setBusy(false));
          }}
          onPreview={
            import.meta.env.DEV
              ? () => {
                  sessionStorage.setItem("dq-preview", "1");
                  setPreview(true);
                  setReady(true);
                }
              : null
          }
        />
        {toast ? <div className="toast">{toast}</div> : null}
      </>
    );
  }

  let screen = (
    <Home
      name={person.name}
      photo={person.photo}
      uid={person.uid}
      today={today}
      attempts={attempts}
      onOpen={(date) => setRoute({ name: "mission", date })}
      onResult={(date) => setRoute({ name: "result", date })}
      onShare={(attempt) => void share(attempt)}
      onSignOut={() => {
        if (preview) {
          sessionStorage.removeItem("dq-preview");
          setPreview(false);
          setRoute({ name: "home" });
          return;
        }
        void signOut(auth);
        setRoute({ name: "home" });
      }}
      onToast={showToast}
    />
  );

  if (route.name === "mission") {
    const mission = missionByDate(route.date);
    screen = mission ? (
      <Mission
        mission={mission}
        uid={person.uid}
        onExit={() => setRoute({ name: "home" })}
        onSave={save}
        onFinished={(attempt) => setRoute({ name: "result", date: attempt.date, fresh: attempt })}
      />
    ) : (
      screen
    );
  }

  if (route.name === "result") {
    const attempt = attempts[route.date] ?? route.fresh;
    screen = attempt ? (
      <Result
        mission={missionByDate(attempt.date)}
        attempt={attempt}
        onHome={() => setRoute({ name: "home" })}
        onShare={() => void share(attempt)}
      />
    ) : (
      screen
    );
  }

  return (
    <>
      {screen}
      {toast ? <div className="toast">{toast}</div> : null}
      {sheet ? (
        <div className="overlay" role="presentation" onClick={() => setSheet(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="share-title">결과지</h2>
            <p className="lead">글을 길게 눌러 복사한 뒤 부모님께 보내 주세요.</p>
            <textarea readOnly value={sheet} onFocus={(event) => event.currentTarget.select()} />
            <button type="button" className="btn" onClick={() => setSheet(null)}>
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
