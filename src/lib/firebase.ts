import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAmFmRWavFntsWD_Nqw4-WUVawZxb_VwW4",
  authDomain: "harudailyquiz.web.app",
  projectId: "project-96ef3536-5162-4778-830",
  storageBucket: "project-96ef3536-5162-4778-830.firebasestorage.app",
  messagingSenderId: "857792059086",
  appId: "1:857792059086:web:60f5f4bda26b99331a229f",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = "ko";
export const db = getFirestore(app);

export function authMessage(code: string) {
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return "로그인이 취소됐어요.";
  }
  if (code === "auth/unauthorized-domain") return "이 주소에서는 구글 로그인을 쓸 수 없어요.";
  if (code === "auth/network-request-failed") return "네트워크 연결을 확인해 주세요.";
  return "구글 로그인에 실패했어요. 다시 시도해 주세요.";
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const sameSite = window.location.hostname === "harudailyquiz.web.app";
  if (sameSite) {
    await signInWithRedirect(auth, provider);
    return;
  }
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw error;
  }
}
