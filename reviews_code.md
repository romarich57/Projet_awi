# Security Review Report

## Section 1: Executive summary
1) Cartographie initiale (backend): `/api/auth` (login/register/logout/refresh/verify/reset), `/api/users` (me + admin CRUD), `/api/upload` (avatar public, game-image auth), `/api/festivals` (public CRUD + allocations), `/api/games`, `/api/reservation`, `/api/zone-tarifaires`, `/api/zone-plan`, `/api/jeux_alloues`, `/api/workflow`, `/api/reservant`, `/api/editors`, `/api/mechanisms`.
2) Cartographie initiale (frontend pages): login/register/verify/reset, profile, admin users (list/create/detail), games (list/create/edit/detail), reservations, reservants, festivals, dashboard.
3) Auth flow: cookies HttpOnly+Secure+SameSite=Strict, access (15m) + refresh (7d), refresh endpoint issues, no CSRF token, no rotation.
4) Top risks: secrets committed, missing server-side RBAC across core routes, public festival CRUD and allocations, no CSRF protection, no rate limiting.
5) Immediate impact: any authenticated user (and in some cases unauthenticated) can create/update/delete business data; tokens and SMTP creds exposure if repo leaks.
6) Recommended urgent fixes: remove secrets from repo, add role middleware and ownership checks on all state-changing routes, add CSRF defenses, add rate limiting, rotate refresh tokens.
7) Dynamic analysis note: no live environment was executed here; findings based on static analysis and assumed normal deployment (Nginx proxy + backend HTTPS).
8) Testing gaps: no integration tests for authZ and CSRF; no automated dependency audit.
9) Residual risk: file uploads are public for avatars, enabling abuse without throttling.
10) Next steps: apply patches in Section 3, then run targeted tests in Section 5.

## Section 2: Tableau des vulnerabilites (tri par severite)
| ID | Severite | Zone | Impact | Exploit | Fix rapide ? | Lien vers details |
|----|----------|------|--------|---------|--------------|-------------------|
| V-01 | Critical | Secrets | Compromission totale (JWT/SMTP/admin) | Oui | Oui | Section 3.V-01 |
| V-02 | Critical | AuthZ (server) | BOLA/privilege escalation sur routes metier | Oui | Non | Section 3.V-02 |
| V-03 | Critical | Public routes | CRUD festival + allocations sans auth | Oui | Oui | Section 3.V-03 |
| V-04 | High | CSRF | Actions sensibles via cookies | Oui | Partiel | Section 3.V-04 |
| V-05 | High | Sessions | Refresh token non-rotable / non-revocable | Oui | Non | Section 3.V-05 |
| V-06 | High | Rate limiting | Brute force login/reset + upload abuse | Oui | Oui | Section 3.V-06 |
| V-07 | High | Uploads | Upload avatar public + pas de verif contenu | Oui | Partiel | Section 3.V-07 |
| V-08 | Medium | Logout | clearCookie sans options, tokens residuels | Oui | Oui | Section 3.V-08 |
| V-09 | Medium | Headers | CSP/HSTS/Permissions-Policy manquants | Oui | Oui | Section 3.V-09 |
| V-10 | Medium | Error leakage | Messages et details DB renvoyes | Oui | Oui | Section 3.V-10 |
| V-11 | Medium | JWT verify | pas de liste d'algos / pas de check user | Oui | Oui | Section 3.V-11 |
| V-12 | Low | User enum | login repond "user inconnu" vs "mdp" | Oui | Oui | Section 3.V-12 |
| V-13 | Low | Validation | schemas faibles (longueurs/formats) | Oui | Partiel | Section 3.V-13 |
| V-14 | Low | CORS | pas de Vary: Origin + origin checks limit | Oui | Oui | Section 3.V-14 |

## Section 3: Details par vulnerabilite (avec patchs)

### V-01 - Secrets commits dans le repo (Critical)
- Ou: `backend/.env`, `backend/.env.dev` (JWT_SECRET, SMTP_PASS, ADMIN_PASSWORD, etc.).
- Pourquoi: compromission du JWT secret => tokens forges; SMTP creds permettent abus; password admin connu.
- Exploit (POC descriptif): un attaquant avec acces au repo forge un JWT admin valide et appelle `/api/users` ou `/api/games`.
- Correctif:
  1) Retirer ces fichiers du repo + rotation des secrets.
  2) Ajouter un gestionnaire de secrets (env vars injectees par CI/CD).
  3) Bloquer le build si `.env` present.
- Patch (exemple):
```diff
+ # .gitignore
+ backend/.env
+ backend/.env.dev
```
- Tests: verifier que `git status` n'inclut plus de secrets; rotation effective (anciens tokens invalides).

### V-02 - Absence de RBAC serveur sur routes metier (Critical)
- Ou: `backend/src/server.ts` + routes `games.ts`, `reservation.ts`, `zoneTarifaire.ts`, `zonePlan.ts`, `workflow.ts`, `reservant.ts`, `allocatedGames.ts`, `editor.ts`, `mechanisms.ts`.
- Pourquoi: seules les guards frontend filtrent; un utilisateur connecte peut appeler directement l'API et modifier des ressources.
- Exploit: appeler `POST /api/games` ou `DELETE /api/zone-plan/:id` avec un compte benevole.
- Correctif:
  1) Ajouter un middleware `requireRole(['admin','organizer','super-organizer'])`.
  2) L'appliquer a chaque route sensible (POST/PUT/PATCH/DELETE, et GETs admin-only).
  3) Ajouter des checks d'ownership quand applicable (ex: reservation).
- Patch (exemple):
```ts
// backend/src/middleware/require-role.ts
export function requireRole(roles: string[]) {
  return (req: Express.Request, res: Response, next: NextFunction) => {
    const role = req.user?.role
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: 'Acces interdit' })
    }
    next()
  }
}
```
```diff
- app.use('/api/games', verifyToken, gamesRouter)
+ app.use('/api/games', verifyToken, requireRole(['admin','organizer','super-organizer']), gamesRouter)
```
- Tests: integration tests sur routes CRUD avec roles autorises/non autorises.

### V-03 - Routes festival publiques avec CRUD + allocations (Critical)
- Ou: `backend/src/server.ts` et `backend/src/routes/festival.ts` (POST/PUT/DELETE + allocations).
- Pourquoi: `app.use('/api/festivals', festivalRouter)` sans `verifyToken`.
- Exploit: `POST /api/festivals` ou `DELETE /api/festivals/:id` sans authentification.
- Correctif: rendre les routes lecture publiques, et proteger toute mutation.
- Patch (exemple):
```diff
- app.use('/api/festivals', festivalRouter)
+ app.use('/api/festivals', festivalRouter)
+ // Dans festival router: ajouter middleware sur les routes d'ecriture
```
```ts
// backend/src/routes/festival.ts
router.post('/', requireRole(['admin','organizer','super-organizer']), handler)
router.put('/:id', requireRole(['admin','organizer','super-organizer']), handler)
router.delete('/:id', requireRole(['admin','organizer','super-organizer']), handler)
```
- Tests: essayer POST/DELETE sans cookie -> 403.

### V-04 - Pas de protection CSRF (High)
- Ou: backend global; cookies auth utilises partout, aucun token CSRF.
- Pourquoi: si SameSite change, ou presence de sous-domaines, actions state-changing peuvent etre forcees.
- Exploit: site tiers force `POST /api/users/me` via un navigateur connecte.
- Correctif: double-submit CSRF token + verification `Origin`/`Sec-Fetch-Site`.
- Patch (exemple):
```ts
// middleware/csrf.ts
export function requireCsrf(req, res, next) {
  const origin = req.get('origin')
  if (!origin || !origin.startsWith(FRONTEND_URL)) {
    return res.status(403).json({ error: 'CSRF blocked' })
  }
  const token = req.get('x-csrf-token')
  const cookie = req.cookies?.csrf_token
  if (!token || !cookie || token !== cookie) {
    return res.status(403).json({ error: 'CSRF token invalid' })
  }
  next()
}
```
- Tests: appeler POST sans token -> 403; avec token -> 200.

### V-05 - Refresh token sans rotation / revocation (High)
- Ou: `backend/src/routes/auth.ts` refresh + `token-management.ts`.
- Pourquoi: refresh JWT valable 7 jours; pas de jti, pas de stockage, pas d'invalidation apres logout/reset.
- Exploit: vol d'un refresh cookie => acces durable.
- Correctif: stocker refresh tokens (hashed) en DB, rotation a chaque usage, invalidation sur logout/reset.
- Patch (exemple):
```ts
// create_refresh_token in DB with jti; on /refresh: verify jti + rotate
```
- Tests: reuse d'un refresh token -> 403 + revoke.

### V-06 - Pas de rate limiting (High)
- Ou: `/api/auth/login`, `/api/auth/password/*`, `/api/auth/resend-verification`, `/api/upload/avatar`.
- Exploit: brute force + abuse upload.
- Correctif: ajouter `express-rate-limit` par route (IP + login/email key).
- Patch (exemple):
```ts
import rateLimit from 'express-rate-limit'
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20 })
router.post('/login', authLimiter, ...)
```
- Tests: 21 requetes -> 429.

### V-07 - Upload avatar public + verif contenu faible (High)
- Ou: `backend/src/routes/upload.ts` + `/uploads` public.
- Exploit: spam de fichiers, stockage abuse; MIME falsifie possible.
- Correctif: limiter le flux (captcha ou rate limit), verification magic bytes (file-type), quotas par IP.
- Patch (exemple):
```ts
import fileType from 'file-type'
const buffer = await fs.promises.readFile(file.path)
const type = await fileType.fromBuffer(buffer)
if (!type || !allowedMimes.includes(type.mime)) { ... }
```
- Tests: upload d'un fichier non-image -> 400.

### V-08 - Logout ne clear pas forcement les cookies (Medium)
- Ou: `backend/src/routes/auth.ts` `res.clearCookie('access_token')`.
- Pourquoi: cookies set avec `secure/sameSite`; clearCookie sans options peut echouer.
- Exploit: utilisateur croit etre deconnecte, cookie reste valide.
- Correctif: fournir les memes options au clearCookie.
- Patch (exemple):
```ts
const cookieOpts = { httpOnly: true, secure: true, sameSite: 'strict' as const }
res.clearCookie('access_token', cookieOpts)
res.clearCookie('refresh_token', cookieOpts)
```
- Tests: logout -> cookies vides dans le navigateur.

### V-09 - Headers de securite incomplets (Medium)
- Ou: `backend/src/server.ts` (pas de CSP/HSTS/Permissions-Policy), Nginx frontend.
- Exploit: clickjacking partiel, XSS plus facile sans CSP, downgrade HTTPS sans HSTS.
- Correctif: `helmet` + HSTS + CSP adaptee.
- Patch (exemple):
```ts
import helmet from 'helmet'
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], frameAncestors: ["'self'"] } },
  hsts: { maxAge: 15552000, includeSubDomains: true, preload: true },
  permissionsPolicy: { features: { geolocation: [], camera: [] } }
}))
```
- Tests: verifier headers en reponse.

### V-10 - Fuite d'erreurs internes (Medium)
- Ou: `zoneTarifaire.ts`, `zonePlan.ts`, `reservation.ts` renvoient `err.message`.
- Exploit: leak DB schema/logic.
- Correctif: logs cote serveur, message generique cote client.
- Patch: remplacer `details: err.message` par un message standard en prod.

### V-11 - JWT verification incomplete (Medium)
- Ou: `backend/src/middleware/token-management.ts`, `auth.ts` refresh.
- Pourquoi: pas d'alg whitelist, pas de verif user en DB (compte supprime).
- Correctif: `jwt.verify(token, secret, { algorithms: ['HS256'] })` + check user exists.
- Tests: token avec alg different -> 403; refresh apres suppression user -> 403.

### V-12 - User enumeration via login (Low)
- Ou: `auth.ts` login retourne messages differents.
- Exploit: enumeration des comptes.
- Correctif: message unique pour login invalide.
- Patch: toujours `401` avec "Identifiants invalides".

### V-13 - Validation insuffisante (Low)
- Ou: multiples routes; peu de limites longueur/format.
- Exploit: stockage de payloads lourds, potentielle XSS stockee si rendu ailleurs.
- Correctif: schemas (Zod/Joi) + limites de longueur.

### V-14 - CORS hardening incomplet (Low)
- Ou: `backend/src/server.ts`.
- Pourquoi: pas de `Vary: Origin` + pas d'origin strict sur toutes methods.
- Correctif: ajouter `res.vary('Origin')` + limiter methodes state-changing.

## Section 4: Recommandations globales (hardening)
- Ajouter un module RBAC/ABAC cote backend et un audit de permissions par route.
- Ajouter CSRF double-submit + verification Origin/Sec-Fetch-Site.
- Mettre en place rate limiting et lockout progressif sur auth.
- Rotation des refresh tokens + stockage hashed + revocation.
- Activer Helmet + CSP/HSTS/Permissions-Policy + cache-control sur endpoints sensibles.
- Ajouter validation schema (Zod) et limites taille/format.
- Secure uploads: verif magic bytes, quotas, et restrictions publiques.
- Retirer secrets du repo + rotation immediate + secrets manager.
- Ajouter tests d'integration securite (authZ/CSRF/rate-limit).
- Lancer audits deps (npm audit, dependabot) en CI.

## Section 5: Checklist de verification finale (avant prod)
- [ ] Secrets rotates + .env retire du repo + acces limite.
- [ ] RBAC actif sur toutes routes CRUD sensibles.
- [ ] CSRF token + Origin check verifies sur POST/PUT/PATCH/DELETE.
- [ ] Rate limits actifs sur login/register/reset/upload.
- [ ] Refresh token rotation + reuse detection en place.
- [ ] Logout invalide bien cookies (options identiques).
- [ ] CSP/HSTS/Permissions-Policy visibles en reponse.
- [ ] Uploads rejetent fichiers non-images (magic bytes).
- [ ] Tests d'integration securite OK.
- [ ] Audit dependencies sans CVE critiques.
