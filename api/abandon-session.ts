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

  const { sessionId, sessionToken } = req.body as {
    sessionId?: unknown;
    sessionToken?: unknown;
  };

  if (typeof sessionId !== "string" || typeof sessionToken !== "string") {
    return res.status(400).json({ error: "Missing sessionId or sessionToken" });
  }

  if (!verifySessionToken(sessionId, sessionToken)) {
    return res.status(401).json({ error: "Invalid session token" });
  }

  await supabase.from("game_sessions").delete().eq("id", sessionId);

  return res.status(200).json({ ok: true });
}
