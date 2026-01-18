import { Routes } from '@angular/router';
import { AdminUserListComponent } from '@app/components/admin/admin/admin-user-list/admin-user-list';
import { AdminUserCreateFormComponent } from '@app/components/admin/admin-user-create/admin-user-create-form/admin-user-create-form';
import { AdminUserDetailPageComponent } from '@app/components/admin/admin-user-detail/admin-user-detail-page/admin-user-detail-page';

import { adminGuard } from '@app/guards/admin/admin-guard';
import { FestivalListComponent } from '@app/components/festival-list-component/festival-list-component';
import { authGuard } from '@app/guards/auth/auth-guard';
import { LoginComponent } from '@auth/login/login';
import { RegisterComponent } from '@auth/register/register';
import { VerifyEmailComponent } from '@auth/verify-email/verify-email';
import { ResendVerificationComponent } from '@auth/resend-verification/resend-verification';
import { ForgotPasswordComponent } from '@auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from '@auth/reset-password/reset-password';
import { ReservationDashbordComponent } from '@app/components/reservation-dashbord-component/reservation-dashbord-component';
import { ReservantsListComponent } from '@app/components/reservants-list-component/reservants-list-component';
import { ReservantCardComponent } from '@app/components/reservant-card-component/reservant-card-component';
import { ReservantFormComponent } from '@app/components/reservant-form-component/reservant-form-component';
import { HomeComponent } from './components/home/home';
import { GamesPageContainerComponent } from './components/games-page/games-page-container/games-page-container';
import { GameEditPageContainerComponent } from './components/game-edit-page/game-edit-page-container/game-edit-page-container';
import { GameCreatePageContainerComponent } from './components/game-create/components/game-create-page-container/game-create-page-container';
import { GameDetailPageComponent } from './components/game-detail-page/game-detail-page';
import { ReservationDetailComponent } from './components/reservation-detail-component/reservation-detail-component';
import { ReservationDetailsPage } from './components/reservation-details-page/reservation-details-page';
import { UserProfilePageComponent } from './components/User_profils/user-profile-page/user-profile-page';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, title: 'Connexion' },
  { path: 'register', component: RegisterComponent, title: 'Inscription' },
  { path: 'verify-email', component: VerifyEmailComponent, title: 'Vérification email' },
  {
    path: 'resend-verification',
    component: ResendVerificationComponent,
    title: 'Renvoyer un email de vérification',
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    title: 'Mot de passe oublié',
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    title: 'Réinitialiser mon mot de passe',
  },
  {
    path: 'festivals',
    component: FestivalListComponent,
    title: 'Festivals',
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard],
    title: 'Accueil',
  },
  {
    path: 'profile',
    component: UserProfilePageComponent,
    canActivate: [authGuard],
    title: 'Mon compte',
  },
  {
    path: 'dashboard',
    component: ReservationDashbordComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'super-organizer', 'organizer'] },
    title: 'Dashboard',
  },
  {
    path: 'reservants',
    component: ReservantsListComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'super-organizer', 'organizer'] },
    title: 'Réservants',
  },
  {
    path: 'reservants/new',
    component: ReservantFormComponent,
    canActivate: [authGuard],
    title: 'Créer un réservant',
  },
  {
    path: 'reservants/:id/edit',
    component: ReservantFormComponent,
    canActivate: [authGuard],
    title: 'Modifier un réservant',
  },
  {
    path: 'reservants/:id',
    component: ReservantCardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'super-organizer', 'organizer'] },
    title: 'Réservant',
  },
  {
    path: 'games',
    component: GamesPageContainerComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'super-organizer', 'organizer'] },
    title: 'Jeux',
  },
  {
    path: 'games/new',
    component: GameCreatePageContainerComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'super-organizer', 'organizer'] },
    title: 'Créer un jeu',
  },
  {
    path: 'games/:id/edit',
    component: GameEditPageContainerComponent,
    canActivate: [authGuard],
    title: 'Modifier un jeu',
  },
  {
    path: 'games/:id',
    component: GameDetailPageComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'super-organizer', 'organizer'] },
    title: 'Détails du jeu',
  },
  {
    path: 'admin/users/new',
    component: AdminUserCreateFormComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    title: 'Creer un utilisateur',
  },
  {
    path: 'admin/users/:id',
    component: AdminUserDetailPageComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    title: 'Utilisateur',
  },
  {
    path: 'admin',
    component: AdminUserListComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    title: 'Administration',
  },
  {
    path: 'reservation-details-page/:id',
    component: ReservationDetailsPage,
    canActivate: [authGuard],
    title: 'Détails de la réservation'
  },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: '**', redirectTo: 'home' },
];
