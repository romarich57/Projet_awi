# Analyse des middlewares manquants (backend)

## Contexte
Analyse concentree sur les middlewares de securite absents ou insuffisants dans l'API Express. Les references ci-dessous pointent vers les fichiers et les endroits ou l'absence est observable.

## Middlewares existants (etat actuel)
- Headers custom : `backend/src/server.ts:41-48` (nosniff, frame-options, referrer-policy, CORP/COOP/COEP).
- Logging HTTP : `backend/src/server.ts:52` (morgan dev).
- Body JSON : `backend/src/server.ts:53` (express.json sans limite explicite).
- Cookies : `backend/src/server.ts:54` (cookieParser).
- Statics uploads : `backend/src/server.ts:56-58`.
- CORS : `backend/src/server.ts:60-75`.
- Auth middleware : `backend/src/middleware/token-management.ts` (verifyToken) et `backend/src/middleware/auth-admin.ts` (requireAdmin).

## Middlewares manquants (details et impact)

### 1) RBAC global (requireRole) sur routes metier
- Ou : `backend/src/server.ts:80-94` applique seulement `verifyToken` sur de nombreuses routes (games, reservation, zone-plan, etc.).
- Risque : tout utilisateur authentifie peut appeler des routes admin/metier (BOLA/privilege escalation).
- Pourquoi c'est un manque de middleware : il n'existe pas de middleware generique de roles (admin/organizer/super-organizer) applique systematiquement aux routes sensibles.
- Correctif recommande : ajouter un `requireRole([...])` et l'appliquer sur toutes les routes CRUD sensibles.
- Exemple :
  ```ts
  // backend/src/middleware/require-role.ts
  export function requireRole(roles: string[]) {
    return (req, res, next) => {
      const role = req.user?.role
      if (!role || !roles.includes(role)) {
        return res.status(403).json({ error: 'Acces interdit' })
      }
      next()
    }
  }
  ```

### 2) CSRF protection (double-submit + Origin check)
- Ou : cookies d'auth utilises partout (ex: `backend/src/routes/auth.ts`), aucune verification CSRF.
- Risque : actions POST/PUT/PATCH/DELETE declenchables depuis un site tiers si cookies attaches.
- Manque : pas de middleware de verification Origin/Sec-Fetch-Site + token CSRF.
- Correctif recommande : middleware `requireCsrf` + endpoint pour initialiser un cookie `csrf_token`.
- Exemple :
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

### 3) Rate limiting / brute force protection
- Ou : endpoints sensibles `backend/src/routes/auth.ts` (login/reset/resend) et `backend/src/routes/upload.ts` (avatar).
- Risque : brute force login, enumeration, DDOS applicatif.
- Manque : aucun middleware `express-rate-limit` ou slow-down.
- Correctif recommande : limiter par IP + par identifiant (login/email).

### 4) Security headers standard (helmet + CSP/HSTS/Permissions-Policy)
- Ou : `backend/src/server.ts` ajoute quelques headers manuellement, mais pas CSP/HSTS/Permissions-Policy complets.
- Risque : XSS plus exploitable sans CSP, absence HSTS.
- Manque : middleware helmet centralise et durcit.
- Correctif recommande : `app.use(helmet(...))` avec CSP adaptee.

### 5) Global error handler (catch des erreurs middleware)
- Ou : `backend/src/server.ts` ne declare pas de middleware d'erreur centralise.
- Risque : erreurs CORS/JSON parse peuvent retourner des reponses incoherentes ou fuites de details.
- Manque : `app.use((err, req, res, next) => ...)` apres les routes.
- Correctif recommande : handler d'erreurs qui normalise les reponses en production.

### 6) Body size limit explicite + timeouts
- Ou : `backend/src/server.ts:53` utilise express.json sans limite explicite.
- Risque : DOS par payloads volumineux, timeouts non maitrises.
- Manque : middleware de limite taille et timeouts serveur.
- Correctif recommande : `express.json({ limit: '100kb' })` + timeouts HTTP.

### 7) Validation schema middleware (Zod/Joi)
- Ou : validation ad-hoc dans les routes (ex: `games.ts`, `reservation.ts`, `zonePlan.ts`).
- Risque : incoherences, payloads malformes, injections logiques.
- Manque : middleware de validation schema uniforme et reutilisable.
- Correctif recommande : middleware `validate(schema)` par route.

### 8) Upload hardening middleware (magic bytes)
- Ou : `backend/src/routes/upload.ts` verifie uniquement le mimetype declare.
- Risque : bypass MIME (fichiers non-image) et stockage de contenu arbitraire.
- Manque : middleware de verification par signature (file-type) + quotas.
- Correctif recommande : verif magic bytes + limite par IP.

### 9) CORS hardening (Vary: Origin + preflight cache)
- Ou : `backend/src/server.ts:66-75`.
- Risque : caches intermediaires peuvent servir une reponse a la mauvaise Origin.
- Manque : `res.vary('Origin')` et config preflight `maxAge`.
- Correctif recommande : middleware qui fixe `Vary: Origin`.

### 10) Cache-control pour endpoints sensibles
- Ou : routes auth (login/refresh/whoami) et users/me.
- Risque : reponses cachees par erreur par proxies.
- Manque : middleware `no-store` sur endpoints d'auth.
- Correctif recommande : `res.set('Cache-Control','no-store')` sur /api/auth et /api/users/me.

### 11) Audit middleware (request-id / security logs)
- Ou : aucune generation d'id de requete ou logs securite.
- Risque : investigations difficiles (brute force, abus, replay refresh).
- Manque : middleware qui ajoute un `X-Request-Id` et loggue les actions sensibles.

## Notes de perimetre
- L'analyse ci-dessus cible le backend Express. Si vous souhaitez aussi une analyse des intercepteurs Angular (equivalents middleware frontend), precisez les fichiers/pages a auditer.
