# AETHER

Premium music-synced Pomodoro PWA.

## Run

```bash
npm install
npm run dev
npm run build
```

## Spotify setup

1. Create an app at https://developer.spotify.com/dashboard
2. Add a Redirect URI (e.g. `http://localhost:5173/callback` or your deployed URL + `/callback`).
3. Copy the Client ID (no client secret needed).
4. In AETHER → Settings → Spotify, paste Client ID and Redirect URI, Save, then Connect.

Scopes requested: `user-read-currently-playing`, `user-read-playback-state`.

## Notes

- Frontend-only. Credentials stored in localStorage.
- Timer uses timestamp-based calculation to avoid drift.
- Offline app shell cached via service worker.
# aether-
