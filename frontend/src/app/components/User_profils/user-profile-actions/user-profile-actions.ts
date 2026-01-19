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
// Role : Afficher les actions du profil (reset mdp, suppression).
// Préconditions : L'email utilisateur et l'etat de confirmation sont fournis.
// Postconditions : Les actions sont remontees via les evenements.
export class UserProfileActionsComponent {
  readonly userEmail = input.required<string>();
  readonly isMutating = input<boolean>(false);
  readonly confirmDelete = input<boolean>(false);
  readonly canDelete = input<boolean>(true);

  @Output() passwordResetRequested = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() deleteCancelled = new EventEmitter<void>();
  @Output() deleteConfirmed = new EventEmitter<void>();

  // Role : Demander un reset de mot de passe.
  // Préconditions : Le parent ecoute l'evenement.
  // Postconditions : `passwordResetRequested` est emis.
  requestPasswordReset() {
    this.passwordResetRequested.emit();
  }

  // Role : Demander la suppression du compte.
  // Préconditions : Le parent ecoute l'evenement.
  // Postconditions : `deleteRequested` est emis.
  requestDelete() {
    this.deleteRequested.emit();
  }

  // Role : Annuler la suppression du compte.
  // Préconditions : Une confirmation est affichee.
  // Postconditions : `deleteCancelled` est emis.
  cancelDelete() {
    this.deleteCancelled.emit();
  }

  // Role : Confirmer la suppression du compte.
  // Préconditions : L'utilisateur confirme la suppression.
  // Postconditions : `deleteConfirmed` est emis.
  confirmDeleteAccount() {
    this.deleteConfirmed.emit();
  }
}
