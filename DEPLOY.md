# עלייה לאוויר — Vercel + Google OAuth

## 1. GitHub

```bash
git add .
git commit -m "Prepare for production"
git push origin main
```

## 2. Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → Import מה-GitHub
2. **Environment Variables** — העתק מ-`.env.local`:

| Variable | הערה |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
| `SUPABASE_SERVICE_ROLE_KEY` | |
| `GOOGLE_CLIENT_ID` | |
| `GOOGLE_CLIENT_SECRET` | |
| `AUTH_SECRET` | **חדש!** הרץ: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AUTH_URL` | `https://YOUR-PROJECT.vercel.app` |

3. **Deploy**

## 3. Google Cloud Console

[console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client:

**Authorized JavaScript origins:**
```
https://YOUR-PROJECT.vercel.app
```

**Authorized redirect URIs:**
```
https://YOUR-PROJECT.vercel.app/api/auth/callback/google
```

> שמור `http://localhost:3000/...` רק לפיתוח מקומי.

## 4. אימות

1. פתח `https://YOUR-PROJECT.vercel.app/api/health` — `"ok": true`
2. כניסה Google → `/map` → שמור מקום → רענן
3. `/admin/login` → מפת שליטה מראה תפוסים

## 5. QR למתפללים

דף הבית מציג QR אוטומטית לפי הדומיין — אחרי deploy פשוט שלחו את הקישור.

## בעיות נפוצות

| בעיה | פתרון |
|------|--------|
| "בעיית הגדרת שרת" בכניסה | `AUTH_URL` + redirect URI ב-Google |
| מקומות לא נשמרים | `/api/health` — Supabase חייב ok |
| seed:force בטעות | **מחק הכל** — שחזר מגיבוי Supabase אם יש |
