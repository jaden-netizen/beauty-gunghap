import { supabase } from "./supabase";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// ── OAuth (추후 구현) ────────────────────────────
export const signInWithKakao = async () => {
  // TODO: Supabase Kakao OAuth 설정 후 구현
  // return supabase.auth.signInWithOAuth({ provider: "kakao", options: { redirectTo: window.location.origin + "/analyze" } });
};

export const signInWithGoogle = async () => {
  // TODO: Supabase Google OAuth 설정 후 구현
  // return supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/analyze" } });
};
