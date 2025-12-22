import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';

@Component({
  selector: 'app-user-profile-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './user-profile-actions.html',
  styleUrl: './user-profile-actions.scss',
})
export class UserProfileActionsComponent {
  readonly userEmail = input.required<string>();
  readonly isMutating = input<boolean>(false);
  readonly confirmDelete = input<boolean>(false);

  @Output() passwordResetRequested = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() deleteCancelled = new EventEmitter<void>();
  @Output() deleteConfirmed = new EventEmitter<void>();

  requestPasswordReset() {
    this.passwordResetRequested.emit();
  }

  requestDelete() {
    this.deleteRequested.emit();
  }

  cancelDelete() {
    this.deleteCancelled.emit();
  }

  confirmDeleteAccount() {
    this.deleteConfirmed.emit();
  }
}
