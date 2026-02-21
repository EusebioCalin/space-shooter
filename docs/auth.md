# Authentication & Authorization — Space Madness

This document covers every auth-related decision in the project: how users sign in, how scores are protected, how the database is locked down, and what the known limitations are.

---

## 1. Technology Stack

| Concern                 | Tool                                       |
| ----------------------- | ------------------------------------------ |
| Identity provider       | Supabase Auth (Google OAuth)               |
| Browser SDK             | `@supabase/supabase-js` with anon key      |
| Server-side API         | Vercel serverless functions (`/api/*`)     |
| Score protection        | HMAC-signed session tokens (server secret) |
| Database access control | Supabase Row Level Security (RLS)          |

---

## 2. Supabase Credentials — Two Keys, Two Contexts

There are two Supabase keys with very different levels of trust.

### Anon Key (`VITE_SUPABASE_ANON_KEY`)

- Bundled into the browser app (visible to anyone who opens DevTools)
- Used **only** by the Supabase browser SDK to handle OAuth sign-in/sign-out and session management
- Subject to Row Level Security — the database enforces what it can and cannot access
- **Cannot** write to `leaderboard` or `game_sessions` directly (RLS blocks it)

### Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)

- Lives **only** in the Vercel environment (`.env`, never shipped to the browser)
- Used by the server-side API functions (`/api/*`)
- **Bypasses RLS entirely** — can read and write any table
- Never exposed to the client under any circumstances

```
Browser                        Vercel API (server)
──────────────────────         ──────────────────────────────
VITE_SUPABASE_ANON_KEY    vs   SUPABASE_SERVICE_ROLE_KEY
Subject to RLS            vs   Bypasses RLS
OAuth + session reads     vs   game_sessions + leaderboard writes
```

---

## 3. User Authentication — Google OAuth Redirect Flow

The app uses a **browser redirect flow** (not a popup). This is the only login option.

### Why redirect and not popup?

PWAs on mobile often block popups. A full-page redirect is more reliable across all platforms.

### Sign-in steps

```
1. User taps "Sign in with Google" (in LoginScene)
         │
         ▼
2. App saves PendingAuthState to sessionStorage
   { returnTo, score?, sessionId?, sessionToken? }
         │
         ▼
3. supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: window.location.origin })
   → Browser navigates away. App is destroyed.
         │
         ▼
4. Google shows consent screen
         │
         ▼
5. Google redirects back to: https://yourapp.com/#access_token=...
         │
         ▼
6. BootScene.handleStartup() runs on app restart
   - consumePendingAuthState() reads + deletes the sessionStorage entry
   - getSession() reads the Supabase session from the URL hash
         │
         ├─ No username yet → UsernameScene (first-time only)
         ├─ returnTo === 'game-over' → saveScore() → MenuScene
         └─ returnTo === 'leaderboard' → LeaderboardScene
```

### PendingAuthState

Because the browser navigates away during OAuth, all state that needs to survive the redirect is serialised to `sessionStorage` before leaving:

```typescript
interface PendingAuthState {
  returnTo: "leaderboard" | "game-over";
  score?: number; // the score to save after sign-in
  sessionId?: string; // game session to submit with the score
  sessionToken?: string;
}
```

`sessionStorage` is used (not `localStorage`) because it is automatically cleared when the tab is closed, avoiding stale state across future visits.

### First-time login — UsernameScene

On the very first sign-in, `user.user_metadata.custom_username` is absent. `BootScene` detects this and routes to `UsernameScene` before completing the pending action (saving the score or viewing the leaderboard). The username is stored in Supabase Auth user metadata via `supabase.auth.updateUser({ data: { custom_username } })`.

---

## 4. Scene Flow — All Cases

```
App Start
   └─ BootScene
         ├─ No pending state → MenuScene
         ├─ Pending state + no session (OAuth cancelled) → MenuScene
         ├─ Pending state + session + no username → UsernameScene
         │     ├─ returnTo=game-over → saveScore() → MenuScene
         │     └─ returnTo=leaderboard → LeaderboardScene
         ├─ Pending state + session + returnTo=game-over → saveScore() → MenuScene
         └─ Pending state + session + returnTo=leaderboard → LeaderboardScene

MenuScene
   ├─ PLAY → GameScene
   └─ LEADERBOARD
         ├─ Authenticated → LeaderboardScene
         └─ Guest → LoginScene (returnTo=leaderboard)
               ├─ Sign in → OAuth flow (above)
               └─ Continue as Guest → LeaderboardScene

GameScene
   ├─ Pause → Resume (session kept) | Quit to Menu
   │                                       └─ abandonGameSession() → session deleted → MenuScene
   └─ Game Over
         ├─ Authenticated → saveScore() auto → MenuScene / Restart
         └─ Guest → "Save Score" button → LoginScene (returnTo=game-over, score, sessionId, sessionToken)
```

---

## 5. Score Submission — The Session Mechanism

The leaderboard write path goes entirely through server-side API functions. The browser never touches the Supabase URL directly for score submission.

### Why a session mechanism?

Without it, anyone could call `/api/submit-score` with an arbitrary score. The session token proves the request originated from a game that the server itself started.

### Step-by-step flow

```
GameScene.create()
   └─ POST /api/start-session  (with optional Bearer JWT)
         └─ Server creates a row in game_sessions:
            { id: randomHex(16), user_id, started_at }
         └─ Server computes sessionToken = HMAC-SHA256(sessionId, GAME_SESSION_SECRET)
         └─ Returns { sessionId, sessionToken } to the client
               │
               │  (game is played)
               │
GameScene.showGameOver()  — lives = 0
   └─ POST /api/submit-score  (with Bearer JWT + sessionId + sessionToken)
         └─ Server verifies JWT → identifies user
         └─ Server verifies HMAC(sessionId) === sessionToken
         └─ Server fetches session row → checks not expired (TTL: 30 min)
         └─ Server checks score plausibility
         └─ Server DELETEs the session row  (single-use)
         └─ Server upserts leaderboard (only if new personal best)
```

### What each layer protects against

| Layer                          | Attack prevented                                                    |
| ------------------------------ | ------------------------------------------------------------------- |
| Bearer JWT required            | Anonymous submission — must be a signed-in user                     |
| HMAC session token             | Forged sessions — token can only be produced by the server          |
| TTL check (30 min)             | Holding a session open indefinitely to game the plausibility window |
| Plausibility check | Wildly inflated scores                                              |
| Session deleted after use      | Replay attacks — submitting the same session twice                  |

### Session lifecycle

```
start-session  →  row created in game_sessions
      │
      ├─ Game ends normally (lives = 0)  →  submit-score  →  row DELETED
      ├─ User quits via pause menu       →  abandon-session  →  row DELETED
      └─ Session expires (> 30 min)      →  submit-score rejects + row DELETED
```

Sessions are always deleted, never updated. There is no `used` flag. If a session row does not exist, the request is rejected — this is both the "expired" and "already used" protection.

### Known limitation

The session token is returned to the client in plaintext at session start. A technically sophisticated user could:

1. Call `POST /api/start-session` with their own JWT → receive `sessionId` + `sessionToken`
2. Wait up to 30 minutes
3. Call `POST /api/submit-score` with any score ≤ `elapsed_seconds × 500`

After 30 minutes this allows a maximum of `1800 × 500 = 900,000` points. This cannot be fully prevented without a server-authoritative game simulation. For a hobby leaderboard, the plausibility ceiling is considered an acceptable trade-off.

---

## 6. Database Access Control (RLS)

### `leaderboard`

| Operation       | Who             | How                                                                              |
| --------------- | --------------- | -------------------------------------------------------------------------------- |
| SELECT          | Anyone (public) | RLS policy: allow all reads                                                      |
| INSERT / UPDATE | Server only     | Via service role key (bypasses RLS). No permissive policies for anon/user roles. |

Leaderboard reads go directly from the browser via the Supabase SDK (anon key). Leaderboard writes only happen through `/api/submit-score`.

### `game_sessions`

| Operation | Who             | How                                                    |
| --------- | --------------- | ------------------------------------------------------ |
| SELECT    | Nobody (direct) | RLS enabled, zero policies → all direct access blocked |
| INSERT    | Server only     | Via service role key                                   |
| DELETE    | Server only     | Via service role key                                   |

RLS is enabled with **no policies**. This means any request using the anon key or a user JWT is rejected outright. The service role key used by the API bypasses this entirely.

### `user_preferences`

| Operation | Who        | How                                |
| --------- | ---------- | ---------------------------------- |
| SELECT    | Owner only | RLS policy: `auth.uid() = user_id` |
| INSERT    | Owner only | RLS policy: `auth.uid() = user_id` |
| UPDATE    | Owner only | RLS policy: `auth.uid() = user_id` |

This table is accessed directly from the browser SDK (no API route needed). RLS enforces that each user can only read and write their own row.

### Summary table

| Table              | Direct client access | RLS     | Policies                        |
| ------------------ | -------------------- | ------- | ------------------------------- |
| `leaderboard`      | SELECT only          | Enabled | Public select; no insert/update |
| `game_sessions`    | None                 | Enabled | None (full lockdown)            |
| `user_preferences` | Read + write own row | Enabled | Owner select / insert / update  |

---

## 7. API Endpoints Reference

All endpoints live under `/api/` and run as Vercel serverless functions using the service role key.

### `POST /api/start-session`

Creates a new game session.

- **Auth**: Optional. If a valid Bearer JWT is provided, the session is linked to that user for rate-limiting purposes.
- **Rate limit**: 50 sessions per user per 24-hour window (counts active/unused sessions only, since used sessions are deleted).
- **Returns**: `{ sessionId, sessionToken }`

### `POST /api/submit-score`

Submits a score at game over.

- **Auth**: Required. Bearer JWT must identify a valid Supabase user.
- **Body**: `{ score, sessionId, sessionToken }`
- **Validates**: JWT, HMAC token, session existence, TTL, plausibility ceiling.
- **Side effect**: Deletes the session row. Upserts leaderboard if new personal best.

### `POST /api/abandon-session`

Deletes a session when the user quits mid-game via the pause menu.

- **Auth**: Not required. The `sessionToken` (HMAC proof) is sufficient to prove ownership.
- **Body**: `{ sessionId, sessionToken }`
- **Side effect**: Deletes the session row immediately.

---

## 8. Environment Variables

| Variable                    | Where                | Purpose                                   |
| --------------------------- | -------------------- | ----------------------------------------- |
| `VITE_SUPABASE_URL`         | Browser (bundled)    | Supabase project URL for the browser SDK  |
| `VITE_SUPABASE_ANON_KEY`    | Browser (bundled)    | Supabase anon key for the browser SDK     |
| `SUPABASE_URL`              | Server only (`.env`) | Supabase project URL for API routes       |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (`.env`) | Bypasses RLS — never expose to the client |
| `GAME_SESSION_SECRET`       | Server only (`.env`) | HMAC secret for signing session tokens    |

`VITE_*` variables are intentionally public — they only grant access to what RLS allows. The three server-only variables must never appear in client-side code or be committed to the repository.
