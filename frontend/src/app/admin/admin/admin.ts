import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { UserService } from '@users/user.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminComponent {
  readonly userService = inject(UserService);

  readonly users = this.userService.users;
  readonly isLoading = this.userService.isLoading;
  readonly error = this.userService.error;
  readonly userServiceRef = this.userService;

  constructor() {
    effect(() => this.userService.loadAll());
  }

  deleteUser(id: number) {
    if (!Number.isInteger(id)) {
      return;
    }
    this.userService.deleteUser(id);
  }
}
