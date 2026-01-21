import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '@services/auth.service';
import { FestivalState } from '@app/stores/festival-state';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly festivalState = inject(FestivalState);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly isAdmin = this.auth.isAdmin;
  readonly isOrganizer = this.auth.isOrganizer;
  readonly isSuperOrganizer = this.auth.isSuperOrganizer;
  readonly currentUser = this.auth.currentUser;
  readonly currentFestivalId = computed(() => this.festivalState.currentFestivalId);

  constructor() {
    this.auth.whoami();
  }

  logout() {
    this.auth.logout();
  }
}
