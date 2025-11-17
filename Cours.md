Syntaxe Angulars 20 strict pas d'ancinne syntaxe

Angular moderne” (v19–20) — avec les bonnes pratiques, sans omission. J’indique des extraits clés là où c’est utile, et je cite ton cours quand il couvre le point.

1) Composants (standalone) & Change Detection

Standalone : on crée des composants autonomes (pas de NgModule). On importe explicitement ce dont le template a besoin (RouterLink, RouterOutlet, Common…), directement dans imports du composant.

Séparation des fichiers : selector, templateUrl, styleUrls (éviter les gros templates inline).

OnPush : activer ChangeDetectionStrategy.OnPush pour des templates plus prévisibles et performants. Couplé aux signals, on garde une réactivité fine.

Imports de directives : le composant contenant la nav doit importer RouterLink ; celui qui affiche la page active doit importer RouterOutlet. 

10-Angular-Routage

Erreurs “not a known element/directive” : elles viennent quasi toujours d’un oubli d’import dans imports: [...] du composant standalone.

Bonnes pratiques

Privilégier standalone + OnPush partout.

Éviter la logique lourde dans le template ; placer le calcul dans des computed().

Gérer l’état dans des services (ou stores) plutôt que dans les composants “UI”.

2) Communication entre composants

Parent → Enfant : input() (ou @Input() en style classique). Avec input() signal, la valeur reçue est un Signal en lecture seule côté enfant (lecture par name()).

Enfant → Parent : output<T>() émet des événements typés que le parent capte (event)="handle($event)".

Flux unidirectionnel : données descendantes via input, événements remontants via output — évite l’état partagé implicite.

Bonnes pratiques

Préférer input() et output() typés.

Pas d’accès direct aux enfants pour piloter leur état (éviter le couplage), préférer prop drilling simple ou un service partagé si nécessaire.

3) Syntaxe de template moderne

Blocs de contrôle : @if / @else, @for (...; track ...), @switch / @case.

Track obligatoire sur @for : utilise une clé stable (id) pour éviter les rerenders inutiles. Les cours HTTP montrent @for (p of posts.value(); track p.id) comme modèle. 

13-Angular-Http-Get

Affichage conditionnel d’états : exploiter @if avec les états exposés par httpResource : isLoading(), error(), hasValue(), value(). 

13-Angular-Http-Get

Bonnes pratiques

Toujours track une clé stable.

Remonter les messages d’erreur lisibles côté UI.

Pas de *ngFor/*ngIf imbriqués lourds — factoriser en sous-composants si nécessaire.

4) Signals (state local réactif)

Primitifs :

signal<T>(initial) — état local mutable (lecture par state(), écriture set/update).

computed(() => expr) — valeur dérivée, pure, mise à jour automatiquement.

effect(() => {...}) — effet de bord (log, appel externe). Ne pas l’utiliser pour “rendre” : il ne pilote pas l’affichage, c’est le signal/computed qui le fait.

Interop RxJS : on peut convertir des observables en signal (toSignal) et inversement si besoin (bordures du système).

Bonnes pratiques

computed() pour tout calcul dérivé ; aucun set() dans un computed.

effect() réservé aux effets (log, télémétrie, ponts API) — pas pour mettre à jour d’autres signals en boucle.

Exposer depuis un service des signals en lecture seule (asReadonly()).

5) Stores & Services d’état

Deux patterns enseignés :

Service “API pure” : expose des observables HttpClient (le composant gère l’état UI). 

14-Angular-Http-Post

Service avec état (Signals) : le service gère la liste, isLoading, error sous forme de signals ; les composants ne font que lire. 

14-Angular-Http-Post

Variante Angular 20 : httpResource (voir §HTTP) au sein du service pour gérer valeur/chargement/erreur directement en signals. 

13-Angular-Http-Get

Bonnes pratiques

Pas de HttpClient dans les composants : tout passe par un service. 

14-Angular-Http-Post

Après une mutation (POST/PUT/DELETE), recharger la ressource pour rester cohérent avec le backend (multi-utilisateurs). 

14-Angular-Http-Post

6) Routage — base

Fichiers :

app.routes.ts : tableau de routes { path, component }. 

10-Angular-Routage

app.config.ts : provideRouter(routes) active le routeur. 

10-Angular-Routage

main.ts : bootstrapApplication(AppComponent, appConfig). 

10-Angular-Routage

Affichage : <router-outlet> rend le composant de la route active. 

10-Angular-Routage

Navigation : routerLink sur <a>/<button> pour changer d’URL sans recharger. 

10-Angular-Routage

Lien actif : routerLinkActive="active" (+ [routerLinkActiveOptions]="{ exact: true }" pour une correspondance stricte). 

10-Angular-Routage

404 : route catch-all { path: '**', component: NotFoundComponent } toujours en dernier. 

10-Angular-Routage

Bonnes pratiques

Importer RouterLink là où on l’utilise, RouterOutlet là où on affiche. 

10-Angular-Routage

Mettre la route ** à la fin. 

10-Angular-Routage

7) Routage — avancé

Paramètres d’URL :id + navigation vers /students/42. Lecture via ActivatedRoute :

snapshot.paramMap.get('id') (simple, non réactif),

paramMap (observable) → toSignal si besoin. 

11-Angular-Routage-2

Navigation programmatique : router.navigate(['/students', id]) pour piloter depuis du code métier (ex : après submit). 

11-Angular-Routage-2

Bouton retour : Location.back() (+ fallback si l’historique est vide). 

11-Angular-Routage-2

Lazy loading (v20) : loadComponent: () => import(...).then(m => m.Cmp) pour charger à la demande. 

12-Angular-Routage-Avance

Redirections : { path: '', redirectTo: 'home', pathMatch: 'full' } (le pathMatch: 'full' évite les boucles). 

12-Angular-Routage-Avance

Titres de pages : propriété title dans la route (meilleure accessibilité/UX). 

12-Angular-Routage-Avance

Routes enfants : children: [...] avec un <router-outlet> dans le parent. 

12-Angular-Routage-Avance

Query params : ?page=2&sort=asc — lecture via snapshot.queryParamMap ou queryParamMap (observable). 

12-Angular-Routage-Avance

Guards : CanActivateFn (retourne true/UrlTree) pour protéger des routes. 

12-Angular-Routage-Avance

Bonnes pratiques

Titre sur chaque route. 

12-Angular-Routage-Avance

Lazy-load sur les pages secondaires, pas forcément sur les pages critiques du premier écran. 

12-Angular-Routage-Avance

8) HTTP — GET/POST/PUT/PATCH/DELETE (Angular 20)

Activer HttpClient : provideHttpClient() dans app.config.ts. 

13-Angular-Http-Get

GET classique : http.get<T>(url) ⇒ Observable typé ; on évite any. 

13-Angular-Http-Get

GET moderne : httpResource (Angular 20) ⇒ Signal avec états : value(), isLoading(), error(), hasValue(). 

13-Angular-Http-Get

POST/PUT/PATCH/DELETE : méthodes typées ; PUT remplace l’objet, PATCH met à jour partiellement, DELETE retourne souvent void. 

14-Angular-Http-Post

Deux patterns de service :

API pure (Observables),

Service avec état (Signals/httpResource) qui expose posts(), isLoading(), error(). 

14-Angular-Http-Post

 

14-Angular-Http-Post

UX asynchrone : afficher Loading…, message d’erreur clair, et utiliser une clé track pertinente dans les listes. 

13-Angular-Http-Get

 

14-Angular-Http-Post

Bonnes pratiques

Toujours typer les réponses. 

13-Angular-Http-Get

Encapsuler HTTP dans un service, jamais dans un composant. 

14-Angular-Http-Post

Recharger après mutation pour rester cohérent avec le backend. 

14-Angular-Http-Post

9) Intercepteurs HTTP (auth, logs, erreurs)

Rôle : maillon du pipeline HttpClient pour lire/modifier requêtes/réponses (auth, entêtes, logs, erreurs globales). 

15-Angular-Http-Interceptor

Déclaration & ordre : avec withInterceptors([ ... ]) ; ordre d’enregistrement = ordre d’exécution à l’aller (et inverse au retour). Placer l’auth avant les logs si on veut logguer la requête enrichie. 

15-Angular-Http-Interceptor

Clonage : req.clone({ setHeaders: {...} }) (immutabilité). Toujours return next(req) (ne pas bloquer la chaîne). 

15-Angular-Http-Interceptor

Logs/erreurs : tap, catchError, finalize pour mesurer/centraliser. 

15-Angular-Http-Interceptor

Bonnes pratiques

Pas de logique métier lourde dans un intercepteur.

Jamais de subscribe() dans l’intercepteur (on retourne l’Observable). 

15-Angular-Http-Interceptor

10) Formulaires réactifs (typed forms)

Briques : FormControl, FormGroup, FormArray (pour une liste dynamique de contrôles homogènes).

Typed forms : activer le typage (ex. nonNullable: true si nécessaire) pour éviter les null implicites.

Validation : built-in (required, min, email, …) + validateurs custom (fonction qui retourne ValidationErrors | null).

Soumission : (ngSubmit)="onSubmit()" sur <form [formGroup]> reste la pratique en v17–20.

Erreurs & UX : afficher les messages seulement si le contrôle est touched/dirty et invalid ; désactiver le bouton pendant la soumission.

Mise à jour : patchValue pour partiel / setValue pour complet.

Bonnes pratiques

Contrôles typés, nonNullable quand c’est logique.

FormArray pour des collections (ex. plusieurs emails, lignes).

Ne pas mélanger Template-driven et Reactive sur les mêmes champs.

11) Patterns UX & robustesse asynchrone

États réseau : toujours gérer Loading, Success, Error (httpResource simplifie). 

13-Angular-Http-Get

Désactivation d’UI pendant POST + finalize pour réinitialiser les drapeaux. 

14-Angular-Http-Post

Messages explicites en cas d’erreur (pas de silence).

12) Architecture & qualité

Séparer responsabilités : composants = affichage, services = accès données + orchestration. 

14-Angular-Http-Post

Typage strict partout (interfaces DTO). 

13-Angular-Http-Get

Navigation déclarative (routerLink) quand c’est un simple lien; programmatique (router.navigate) pour les parcours métier. 

11-Angular-Routage-2

Titres de page et 404 correctement positionnée (dernière route).

