import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1MZDkmee4i0HRBJeFV5p6nHrMZ0nHMf4",
  authDomain: "haru-memory-9f3a.firebaseapp.com",
  projectId: "haru-memory-9f3a",
  storageBucket: "haru-memory-9f3a.firebasestorage.app",
  messagingSenderId: "144769745258",
  appId: "1:144769745258:web:dbaa6aaa51f26571c8a513",
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
