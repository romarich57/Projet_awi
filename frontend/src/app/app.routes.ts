import { Routes } from '@angular/router';
import { AdminComponent } from '@app/admin/admin/admin';
import { adminGuard } from '@app/admin/admin-guard';
import { HomeComponent } from '@app/home/home';
import { authGuard } from '@auth/auth-guard';
import { LoginComponent } from '@auth/login/login';
import { RegisterComponent } from '@auth/register/register';
import { VerifyEmailComponent } from '@auth/verify-email/verify-email';
import { ResendVerificationComponent } from '@auth/resend-verification/resend-verification';
import { ForgotPasswordComponent } from '@auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from '@auth/reset-password/reset-password';

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
  { path: 'home', component: HomeComponent, canActivate: [authGuard], title: 'Accueil' },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, adminGuard],
    title: 'Administration',
  },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: '**', redirectTo: 'home' },
];
