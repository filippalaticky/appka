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

## Účty a prístup

Aplikácia **nemá verejnú registráciu**. Účty vznikajú výhradne pri štarte servera
z environment premenných, takže cudzí účet nemá ako pribudnúť.

| Premenné | Rola | Min. dĺžka hesla |
|---|---|---|
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin | 12 |
| `USER1_EMAIL` / `USER1_PASSWORD` | user | 8 |
| `USER2_EMAIL` / `USER2_PASSWORD` | user | 8 |

- **Zmena hesla** = prepísať premennú a spustiť redeploy. Zmena okamžite
  zneplatní všetky existujúce prihlásenia daného účtu.
- **Účet, ktorý nie je v premenných, sa pri štarte zabanuje.** Ban je vratný —
  v admin paneli sa dá zrušiť a dáta ostávajú zachované.
- Rola `admin` patrí vždy len účtu z `ADMIN_EMAIL`. Ak sa premenná zmení,
  pôvodnému adminovi sa práva odoberú.

## Admin prístup

Admin účet sa pri štarte servera vytvorí (alebo aktualizuje) podľa premenných
`ADMIN_EMAIL` a `ADMIN_PASSWORD`. Heslá **nikdy nie sú v kóde ani v repozitári** —
nastavujú sa výhradne cez environment premenné.

Pravidlá:

- V produkcii sú `ADMIN_EMAIL` aj `ADMIN_PASSWORD` **povinné**. Bez nich sa server
  zámerne nespustí, aby nikdy nenabehol s predvídateľným heslom.
- `ADMIN_PASSWORD` musí mať aspoň 12 znakov.
- Demo účet (`DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`) sa vytvára **len vo vývoji**.
  V produkcii sa ignoruje.
- Zmena admin hesla zneplatní všetky existujúce prihlásenia.

Pri deployi cez `render.yaml` sú `ADMIN_EMAIL` a `ADMIN_PASSWORD` označené ako
`sync: false` — Render si ich vypýta v dashboarde a neukladá do repozitára.

## Registrácia používateľa

Registrácia **neexistuje** a endpoint `/api/auth/register` vracia 404. Login stránka
obsahuje výhradne prihlasovací formulár. Účty sa pridávajú cez environment premenné
(pozri sekciu *Účty a prístup*), takže cudzí účet nemá ako vzniknúť.

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
