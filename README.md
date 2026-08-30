# מטבעות זהב (Booster)

משחק עידוד לילדים: מטבעות זהב עם תמונות, סל, ומדבקות פרס.

Live: [booster.grok.me](https://booster.grok.me/)

## הרצה מקומית

```bash
npm install
npm run dev
```

האפליקציה עולה על פורט 8080.

## מה יש בפנים

- **הילדים** — שם + תמונה (גלריה, מצלמה, או דיוקן מצויר)
- **המשחק** — הטלת מטבע לסל
- **בחירת פרסים** — מדבקות במחיר 1–3 מטבעות
- **מאגר הפרסים** — העלאת כמה תמונות ביחד, או ייבוא חבילת zip
- **אלבום** — המדבקות שנקנו לכל ילד
- השמירה מקומית (IndexedDB), עם ייצוא/ייבוא JSON

קוד המסכים העיקרי: [`src/components/app.tsx`](src/components/app.tsx)  
מצב המשחק: [`src/lib/store.ts`](src/lib/store.ts)

## גרסאות

כל דחיפה ל־`master` מריצה GitHub Action שמ:

1. קובעת את סוג העלייה לפי הקומיטים מאז התג האחרון
   - `feat:` → minor (1.0.0 → 1.1.0)
   - `feat!:` או `BREAKING CHANGE` → major
   - כל השאר → patch
2. מעדכנת את `version` ב־`package.json`
3. יוצרת תג (`v1.2.3`) ו־GitHub Release עם הערות שינוי

אפשר גם להריץ ידנית: **Actions → Release → Run workflow** ולבחור patch / minor / major.

קומיטים של סוכנים: השתמשו ב־[Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`) כדי שהגרסה תקפוץ נכון.

## מבנה

```
src/components/   UI והמשחק
src/lib/          store, פרסים, תמונות, שמירה
public/prizes     מדבקות מובנות
public/avatars    דיוקנאות מצוירים
.github/workflows CI + שחרור גרסה
```
