# Nutri Planner (Node.js + Express + PostgreSQL)

Kompletná full-stack aplikácia pripravená pre VS Code aj deploy na Render.com.

## Funkcie

- JWT login systém (cookie) + role `user` / `admin`
- PostgreSQL tabuľky:
  - `users`
  - `profiles`
  - `meal_plans`
- Admin panel na `/admin` (iba pre admina)
- Kalorická kalkulačka (BMI, ideálna váha, kalórie, makrá)
- Generovanie týždenného jedálnička (7 dní × raňajky/obed/večera, 2 varianty)
- Moderné UI (Tailwind + vlastné CSS animácie)

## Štruktúra projektu

```text
.
├─ database/
│  └─ schema.sql
├─ public/
│  ├─ css/styles.css
│  ├─ js/login.js
│  ├─ js/app.js
│  ├─ js/admin.js
│  ├─ login.html
│  ├─ app.html
│  └─ admin.html
├─ src/
│  ├─ middleware/
│  ├─ routes/
│  ├─ utils/
│  ├─ db.js
│  └─ server.js
├─ .env.example
├─ package.json
└─ render.yaml
```

## Lokálne spustenie

1. Nainštaluj závislosti:

```bash
npm install
```

2. Skopíruj `.env.example` na `.env` a vyplň hodnoty:

```bash
copy .env.example .env
```

3. Spusť server:

```bash
npm run dev
```

4. Otvor:

`http://localhost:3000`

## SQL schéma

Tabuľky sa vytvoria automaticky pri štarte servera cez `database/schema.sql`.

## Admin prístup

Admin aj demo user sa seedujú pri štarte servera podľa:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `DEMO_USER_EMAIL`
- `DEMO_USER_PASSWORD`

Predvolené demo:

- `admin@example.com`
- `admin123456`
- `user@example.com`
- `user123456`

## Registrácia používateľa

Na login stránke je prepínač **Prihlásenie / Registrácia**. Nový účet sa vytvorí cez API a používateľ sa hneď prihlási.

## Deploy na Render.com

### Možnosť A: cez `render.yaml` (Blueprint)

1. Pushni projekt na GitHub.
2. V Renderi klikni **New +** → **Blueprint**.
3. Vyber repo.
4. Render automaticky vytvorí:
   - Web service (`nutri-planner-app`)
   - PostgreSQL databázu (`nutri-planner-db`)
5. Po deployi otvor URL aplikácie.

### Možnosť B: manuálne

1. Vytvor PostgreSQL databázu v Renderi.
2. Vytvor nový **Web Service** z GitHub repo.
3. Nastav:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Nastav ENV:
   - `NODE_ENV=production`
   - `DATABASE_URL` (z Render DB)
   - `JWT_SECRET` (silný random string)
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `DEMO_USER_EMAIL`
   - `DEMO_USER_PASSWORD`

## Poznámky

- Pri prvom spustení musí byť databáza dostupná.
- API endpointy sú pod `/api/*`.
- Stránka `/admin` je chránená rolou `admin`.
