import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { createHmac, randomBytes } from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function signSession(sessionId: string): string {
  return createHmac("sha256", process.env.GAME_SESSION_SECRET!)
    .update(sessionId)
    .digest("hex");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optionally extract user_id from JWT (guests allowed)
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const jwt = authHeader.slice(7);
    const { data } = await supabase.auth.getUser(jwt);
    userId = data.user?.id ?? null;
  }

  // Per-user rate limit: max 50 sessions in 24h
  if (userId) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("started_at", since);

    if ((count ?? 0) >= 50) {
      return res
        .status(429)
        .json({ error: "Session limit exceeded — try again tomorrow" });
    }
  }

  // Create session row
  const sessionId = randomBytes(16).toString("hex");
  const { error } = await supabase.from("game_sessions").insert({
    id: sessionId,
    user_id: userId,
    started_at: new Date().toISOString(),
  });

  if (error) {
    console.error("start-session insert error:", error);
    return res.status(500).json({ error: "Failed to create session" });
  }

  const sessionToken = signSession(sessionId);
  return res.status(200).json({ sessionId, sessionToken });
}
