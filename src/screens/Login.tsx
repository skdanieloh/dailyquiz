function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.03l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

export function Login({
  busy,
  error,
  onGoogle,
  onPreview,
}: {
  busy: boolean;
  error: string | null;
  onGoogle: () => void;
  onPreview: (() => void) | null;
}) {
  return (
    <main className="login">
      <div className="mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h1>하루퀴즈</h1>
      <p className="lead">하루에 한 번, 작업기억을 조금씩 키워요. 오늘의 카드는 0시에 열리고 자정에 닫혀요.</p>
      <ul className="points">
        <li>400일 과정이 하루씩 어려워져요.</li>
        <li>만점 1,000원, 모두 틀려도 500원. 단계마다 100원씩 달라요.</li>
        <li>결과지를 부모님께 공유하면 부모님이 자녀에게 지급해요.</li>
      </ul>
      <button type="button" className="btn google" disabled={busy} onClick={onGoogle}>
        <GoogleMark />
        {busy ? "연결하는 중" : "Google로 계속하기"}
      </button>
      {error ? <p className="error">{error}</p> : null}
      {onPreview ? (
        <button type="button" className="text-btn" onClick={onPreview}>
          개발용 미리보기
        </button>
      ) : null}
    </main>
  );
}
