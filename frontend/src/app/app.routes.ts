import { Routes } from '@angular/router';
import { AdminComponent } from '@app/admin/admin/admin';
import { adminGuard } from '@app/admin/admin-guard';
import { HomeComponent } from '@app/home/home';
import { authGuard } from '@auth/auth-guard';
import { LoginComponent } from '@auth/login/login';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: '**', redirectTo: 'home' },
];
