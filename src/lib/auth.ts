import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

export interface PendingAuthState {
  returnTo: 'leaderboard' | 'game-over';
  score?: number;
}

const PENDING_KEY = 'pending_auth_state';

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

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithGoogle(state: PendingAuthState): Promise<void> {
  savePendingAuthState(state);
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function saveScore(score: number): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const user = session.user;
  const username =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Player';

  const { error } = await supabase.from('leaderboard').insert({
    user_id: user.id,
    username,
    score,
  });
  if (error) throw error;
}

export async function getLeaderboard(): Promise<{ username: string; score: number }[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('username, score')
    .order('score', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}
