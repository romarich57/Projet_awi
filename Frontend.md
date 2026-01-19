# Revue de code Frontend (guards, interceptors, types, services, stores)

## Constats (tries par severite)
1) [Moyen] roleGuard peut lever une exception si la route n'a pas de roles
- Ou : `frontend/src/app/guards/role-guard.ts:16`
- Pourquoi : `expectedRoles` est suppose etre un tableau, mais `route.data['roles']` peut etre undefined; appeler `includes` plante.
- Impact : crash de navigation ou page blanche sur les routes sans roles.
- Correctif : definir une valeur par defaut (tableau vide) ou autoriser l'acces si roles absents.

2) [Moyen] roleGuard ne tente pas de revalidation de session, causant des redirections a tort
- Ou : `frontend/src/app/guards/role-guard.ts:12`
- Pourquoi : il lit `currentUser()` de facon synchrone et redirige si null, contrairement a `authGuard` qui appelle `checkSession$()`.
- Impact : utilisateurs avec cookies valides rediriges vers login/accueil au premier chargement.
- Correctif : si `currentUser()` est null, appeler `checkSession$()` et decider selon le resultat.

3) [Moyen] le flag loading peut rester bloque dans ReservantStore
- Ou : `frontend/src/app/stores/reservant.store.ts:45`, `frontend/src/app/stores/reservant.store.ts:60`, `frontend/src/app/stores/reservant.store.ts:76`, `frontend/src/app/stores/reservant.store.ts:119`
- Pourquoi : `loading` passe a true, mais pas de finalize/reset dans loadAll/loadByFestival/loadById/delete.
- Impact : UI peut rester en chargement permanent.
- Correctif : ajouter `finalize(() => this.loading.set(false))` ou remettre a false dans next/error.

4) [Moyen] delete dans ReservantStore conserve l'element supprime en etat
- Ou : `frontend/src/app/stores/reservant.store.ts:119`
- Pourquoi : en succes, `_reservants` devient `[reservant]` au lieu de filtrer ou recharger.
- Impact : le reservant supprime peut rester affiche.
- Correctif : retirer l'element de la liste ou recharger depuis le backend.

5) [Moyen] mutations mettent a jour l'etat local sans recharger depuis le backend
- Ou : `frontend/src/app/services/festival-service.ts:54`, `frontend/src/app/services/festival-service.ts:91`, `frontend/src/app/stores/games-store.ts:147`, `frontend/src/app/stores/reservant.store.ts:90`
- Pourquoi : Cours.md recommande de recharger apres POST/PUT/DELETE pour rester coherent avec l'etat serveur.
- Impact : donnees obsoletes en contexte multi-utilisateurs, changements serveur manques.
- Correctif : appeler le rechargement approprie apres les mutations (ou revalidation via httpResource).

6) [Faible] usage de any dans des services de prod casse le typage strict
- Ou : `frontend/src/app/services/reservation.service.ts:56`, `frontend/src/app/services/reservant-workflow-api.ts:21`, `frontend/src/app/stores/games-store.ts:147`
- Pourquoi : les payloads/retours sont en `any` au lieu de DTOs.
- Impact : perte de securite de type, erreurs runtime non detectees.
- Correctif : definir des DTOs pour les payloads et erreurs (ex : HttpErrorResponse).

7) [Faible] FestivalDto utilise Date pour des champs API probablement en string
- Ou : `frontend/src/app/types/festival-dto.ts:5`
- Pourquoi : l'API renvoie des dates JSON en string, mais le type est `Date`.
- Impact : incoherence de type, risque d'utilisation incorrecte des dates.
- Correctif : utiliser `string` pour le DTO API ou mapper vers Date dans un service.

8) [Faible] signaux de store mutables depuis l'exterieur dans ReservantStore
- Ou : `frontend/src/app/stores/reservant.store.ts:32`
- Pourquoi : `loading` et `error` sont publics au lieu de `asReadonly()`.
- Impact : les composants peuvent muter l'etat, ce qui casse l'encapsulation.
- Correctif : garder les signaux prives et exposer des versions readonly.

## Questions ouvertes / hypotheses
- Je suppose que `festival.start_date/end_date` sont renvoyes en ISO string; confirmer le contrat API.
- Toutes les routes qui utilisent `roleGuard` fournissent-elles `data.roles` ? Sinon, confirmer le comportement attendu.
- La coherence multi-utilisateurs est-elle requise pour festivals/reservants/games ? Si oui, recharger apres mutation est necessaire (Cours.md).

## Resume des changements (aucune modification de code)
- Revue uniquement; aucun fichier modifie.
