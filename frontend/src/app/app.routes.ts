import { Routes } from '@angular/router';
import { AdminComponent } from '@app/admin/admin/admin';
import { adminGuard } from '@app/admin/admin-guard';
import { FestivalListComponent } from '@app/components/festival-list-component/festival-list-component';
import { authGuard } from '@auth/auth-guard';
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
    canActivate: [authGuard],
    title: 'Festivals',
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard],
    title: 'Profil',
  },
  {
    path: 'dashboard',
    component: ReservationDashbordComponent,
    canActivate: [authGuard],
    title: 'Dashboard',
  },
  {
    path: 'reservants',
    component: ReservantsListComponent,
    canActivate: [authGuard],
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
    canActivate: [authGuard],
    title: 'Réservant',
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, adminGuard],
    title: 'Administration',
  },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: '**', redirectTo: 'home' },
];
