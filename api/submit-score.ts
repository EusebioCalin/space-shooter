import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function verifySessionToken(sessionId: string, token: string): boolean {
  const expected = createHmac("sha256", process.env.GAME_SESSION_SECRET!)
    .update(sessionId)
    .digest("hex");
  // Constant-time comparison
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require authentication
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const jwt = authHeader.slice(7);
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData.user) {
    return res.status(401).json({ error: "Invalid token" });
  }
  const user = userData.user;

  // Validate request body
  const { score, sessionId, sessionToken } = req.body as {
    score?: unknown;
    sessionId?: unknown;
    sessionToken?: unknown;
  };

  if (
    typeof score !== "number" ||
    typeof sessionId !== "string" ||
    typeof sessionToken !== "string"
  ) {
    return res.status(400).json({
      error: "Missing required fields: score, sessionId, sessionToken",
    });
  }

  if (score < 0 || !Number.isInteger(score)) {
    return res.status(400).json({ error: "Invalid score" });
  }

  // Layer 2: Verify HMAC token
  if (!verifySessionToken(sessionId, sessionToken)) {
    return res.status(401).json({ error: "Invalid session token" });
  }

  // Layer 2: Fetch session and check not expired
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id, user_id, started_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    return res.status(401).json({ error: "Session not found" });
  }

  const startedAt = new Date(session.started_at).getTime();
  const elapsedMs = Date.now() - startedAt;
  const TTL_MS = 30 * 60 * 1000; // 30 minutes
  if (elapsedMs > TTL_MS) {
    await supabase.from("game_sessions").delete().eq("id", sessionId);
    return res.status(401).json({ error: "Session expired" });
  }

  // Layer 3: Score plausibility check (500 pts/sec ceiling)
  const elapsedSeconds = elapsedMs / 1000;
  const maxAllowedScore = Math.ceil(elapsedSeconds * 500);
  if (score > maxAllowedScore) {
    return res.status(400).json({ error: "Score exceeds plausibility limit" });
  }

  // Delete session (single-use — replay attempts will get "Session not found")
  await supabase.from("game_sessions").delete().eq("id", sessionId);

  // Upsert leaderboard (only keep personal best)
  const { data: existing } = await supabase
    .from("leaderboard")
    .select("score")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing && score <= existing.score) {
    return res
      .status(200)
      .json({ saved: false, reason: "Not a new personal best" });
  }

  const username: string =
    (user.user_metadata?.custom_username as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Player";

  const { error: upsertError } = await supabase
    .from("leaderboard")
    .upsert({ user_id: user.id, username, score }, { onConflict: "user_id" });

  if (upsertError) {
    console.error("leaderboard upsert error:", upsertError);
    return res.status(500).json({ error: "Failed to save score" });
  }

  return res.status(200).json({ saved: true });
}
