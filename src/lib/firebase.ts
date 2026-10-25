import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBT6HBkUtlteBliP1pnjcDl_skZjHEiv1c",
  authDomain: "expedition-14546.firebaseapp.com",
  projectId: "expedition-14546",
  storageBucket: "expedition-14546.firebasestorage.app",
  messagingSenderId: "134464708973",
  appId: "1:134464708973:web:b2381bcded1b20ba167a64",
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
  const phone = window.matchMedia("(max-width: 560px)").matches;
  if (phone) {
    await signInWithRedirect(auth, provider);
    return;
  }
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    if (code === "auth/popup-blocked") {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw error;
  }
}
