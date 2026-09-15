# Shul Seats — מערכת בחירת מקומות

מערכת לבחירת מקומות בבית המדרש: 112 גברים + 68 נשים, מפה מאוחדת, כניסת Google למתפללים, לוח בקרה לגבאי.

## התקנה מקומית

### 1. משתני סביבה

העתק `.env.example` ל-`.env.local` ומלא את כל המפתחות.

### 2. Supabase

1. [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**
2. הרץ את `supabase/migrations/001_init.sql`
3. **Settings → API** — העתק URL + anon key + service_role key

### 3. Seed (פעם אחת)

```bash
npm run seed
```

| פקודה | מה עושה |
|--------|---------|
| `npm run seed` | מושבים + מנהלים — **בטוח**, מדלג אם כבר קיים |
| `npm run sync:blocked` | מסנכרן חסימות מהמפה — **בטוח** |
| `npm run seed:force` | **מוחק כל ההזמנות** — רק לפני go-live |

סיסמת מנהל: `ShulSeats2026!` (או `ADMIN_INITIAL_PASSWORD` ב-env)

### 4. הפעלה

```bash
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000)

### 5. בדיקת מערכת

```bash
npm run health
```

כל הבדיקות חייבות ✓ לפני עלייה לאוויר.

---

## מסלולים

| URL | תיאור |
|-----|--------|
| `/` | דף הבית + QR |
| `/map` | מפת בית המדרש (גברים + נשים) |
| `/my-seats` | המקומות שלי |
| `/admin/login` | כניסת גבאי |
| `/admin` | לוח בקרה + מפת שליטה |
| `/api/health` | בדיקת חיבור (Supabase + Google) |

---

## עלייה לאוויר (Production)

**localhost לא מתאים למאות משתמשים.** ראה [DEPLOY.md](./DEPLOY.md) להוראות Vercel + Google OAuth.

### איפה נשמרים הנתונים

| נתון | מיקום |
|------|--------|
| הזמנות | Supabase → `reservations` |
| משתמשים | Supabase → `users` |
| מיקומי מושבים | Supabase → `seats` |
| מפה (layout) | `src/data/layout.ts` (בקוד) |

---

## מבנה פרויקט

```
src/
  app/map/          — מפה למתפללים
  app/admin/        — גבאי
  components/       — SeatMap, Header, WorshipperNav
  lib/              — auth, seats, reservation-store
  data/layout.ts    — מיקומי 180 מושבים
supabase/migrations — סכמת DB
scripts/            — seed, health, layout
```
