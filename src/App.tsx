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
  const [redirectDone, setRedirectDone] = useState(preview);
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
  const [sheet, setSheet] = useState<{ text: string; imageUrl: string } | null>(null);
  const toastTimer = useRef(0);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (next) => {
      if (!active) return;
      setUser(next);
      setReady(true);
    });
    getRedirectResult(auth)
      .then((result) => {
        if (!active) return;
        if (result?.user) setUser(result.user);
      })
      .catch((error: { code?: string }) => {
        if (active) setAuthError(authMessage(error.code ?? ""));
      })
      .finally(() => {
        if (active) setRedirectDone(true);
      });
    return () => {
      active = false;
      unsubscribe();
    };
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

  function closeSheet() {
    setSheet((current) => {
      if (current) URL.revokeObjectURL(current.imageUrl);
      return null;
    });
  }

  async function share(attempt: Attempt) {
    try {
      const result = await shareSummary(attempt);
      if (result.kind === "shared" || result.kind === "aborted") return;
      setSheet((current) => {
        if (current) URL.revokeObjectURL(current.imageUrl);
        return { text: result.text, imageUrl: URL.createObjectURL(result.blob) };
      });
    } catch {
      setSheet({ text: shareText(attempt), imageUrl: "" });
    }
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
  if (!ready || !redirectDone) return <div className="center">불러오는 중</div>;

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
        <div className="overlay" role="presentation" onClick={closeSheet}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="share-title">결과 카드</h2>
            <p className="lead">이미지를 길게 눌러 부모님께 보내 주세요.</p>
            {sheet.imageUrl ? <img className="share-card" src={sheet.imageUrl} alt="점수, 일차, 보상금이 적힌 결과 카드" /> : null}
            <textarea readOnly value={sheet.text} onFocus={(event) => event.currentTarget.select()} />
            <button type="button" className="btn" onClick={closeSheet}>
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
