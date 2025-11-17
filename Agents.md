✅ Objectif global

Mettre en place :

Inscription utilisateur avec les champs :

nom, prénom, email, pseudo, motDePasse, avatar, numéroDeTéléphone

Connexion avec :

(email OU pseudo) + motDePasse

Vérification d’email via un lien unique envoyé par SMTP :

utilisateur créé avec email_verified = false

envoi d’un mail avec un lien de vérification

clic sur le lien → compte marqué comme email_verified = true

📝 TODO-LIST (à dérouler étape par étape)
[ ] 1. Modèle de données & base PostgreSQL

 Ajouter / modifier la table users pour inclure au minimum :

id (PK)

login (pseudo, unique)

password_hash

role (par défaut user)

first_name, last_name

email (unique)

phone

avatar_url

email_verified (BOOLEAN, default false)

email_verification_token (string, token ou hash de token)

email_verification_expires_at (timestamp)

created_at

 Générer les requêtes SQL (CREATE TABLE ou ALTER TABLE) compatibles avec PostgreSQL.

 Vérifier que les contraintes d’unicité (email, pseudo) sont en place.

[ ] 2. Route d’inscription (POST /api/auth/register)

 Définir le schéma du corps de requête (TypeScript), avec les champs :

login (pseudo), firstName, lastName, email, password, phone?, avatarUrl?

 Implémenter les validations côté backend :

champs obligatoires non vides

format basique d’email

vérification que l’email ou le pseudo n’existent pas déjà

 Hasher le mot de passe (ex: bcrypt)

 Générer un token de vérification d’email (string aléatoire) + date d’expiration (ex : 24h).

 Insérer l’utilisateur en base avec :

email_verified = false

email_verification_token et email_verification_expires_at remplis

 Appeler une fonction d’envoi de mail (voir étape 3) avec l’email et le token.

 Retourner une réponse JSON du type :

{ message: "Compte créé. Veuillez vérifier votre email pour activer votre compte." }

[ ] 3. Vérification d’email via SMTP

 Configurer un transport SMTP (ex : nodemailer) avec des variables d’environnement :

SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

FRONTEND_URL (pour construire le lien dans l’email)

 Créer une fonction sendVerificationEmail(email, token) qui :

construit une URL du type : ${FRONTEND_URL}/verify-email?token=...

envoie un email contenant ce lien (version texte + HTML).

 Implémenter la route backend GET /api/auth/verify-email?token=... qui :

lit le token depuis la query string

cherche l’utilisateur correspondant avec ce token et une date d’expiration valide

si trouvé :

met email_verified = true

nettoie email_verification_token et email_verification_expires_at

retourne un message de succès

sinon :

retourne une erreur (token invalide ou expiré)

 (Optionnel) Prévoir une variante où cette route connecte directement l’utilisateur (génération des JWT + cookies).

[ ] 4. Connexion (POST /api/auth/login) avec email OU pseudo

 Modifier / créer la route POST /api/auth/login avec un body :

identifier (peut être email ou pseudo)

password

 Dans la route :

chercher en base un utilisateur où login = identifier ou email = identifier

vérifier le mot de passe (compare hash)

vérifier que email_verified === true :

si false → renvoyer une erreur 403 : "Email non vérifié"

si tout est OK :

générer les tokens JWT (access + refresh) comme déjà fait dans le projet

déposer les tokens dans des cookies HttpOnly (même config que le TP)

renvoyer un JSON avec les infos minimales de l’utilisateur (id, login, email, role, email_verified, etc.)

[ ] 5. Intégration côté Angular (vue d’ensemble, sans tout détailler)

 Mettre à jour / créer :

un formulaire d’inscription ⇒ appel à POST /api/auth/register

un formulaire de connexion avec identifier + password ⇒ POST /api/auth/login

un composant / route /verify-email qui lit le token depuis l’URL et appelle GET /api/auth/verify-email?token=...

 Afficher des messages clairs :

après inscription : "Vérifiez votre email pour activer votre compte."

après vérification : "Votre email est vérifié, vous pouvez vous connecter."

🎯 Résultat attendu

À la fin de ces TODOs, l’application doit :

permettre la création de compte avec les champs demandés,

refuser la connexion tant que l’email n’est pas vérifié,

permettre la vérification du compte via un lien envoyé par SMTP,

accepter la connexion avec email ou pseudo + mot de passe,

continuer à utiliser le système de JWT / cookies déjà existant.