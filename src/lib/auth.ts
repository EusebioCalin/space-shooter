import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";

export interface PendingAuthState {
  returnTo: "leaderboard" | "game-over";
  score?: number;
  sessionId?: string;
  sessionToken?: string;
}

const PENDING_KEY = "pending_auth_state";

export function savePendingAuthState(state: PendingAuthState): void {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(state));
}

export function consumePendingAuthState(): PendingAuthState | null {
  const raw = sessionStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PENDING_KEY);
  try {
    return JSON.parse(raw) as PendingAuthState;
  } catch {
    return null;
  }
}

export function getUsernameFromMetadata(user: User): string {
  return (
    (user.user_metadata?.custom_username as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Player"
  );
}

export async function setCustomUsername(username: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { custom_username: username },
  });
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithGoogle(state: PendingAuthState): Promise<void> {
  savePendingAuthState(state);
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function startGameSession(): Promise<{
  sessionId: string;
  sessionToken: string;
}> {
  const session = await getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch("/api/start-session", { method: "POST", headers });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to start game session");
  }
  return res.json() as Promise<{ sessionId: string; sessionToken: string }>;
}

export async function abandonGameSession(
  sessionId: string,
  sessionToken: string,
): Promise<void> {
  await fetch("/api/abandon-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, sessionToken }),
  }).catch(() => {}); // fire-and-forget
}

export async function saveScore(
  score: number,
  sessionId: string,
  sessionToken: string,
): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch("/api/submit-score", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ score, sessionId, sessionToken }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to save score");
  }
}

export async function getLeaderboard(): Promise<
  { username: string; score: number }[]
> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("username, score")
    .order("score", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}
