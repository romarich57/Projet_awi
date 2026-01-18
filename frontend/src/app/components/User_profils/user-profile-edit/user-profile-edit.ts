import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-profile-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile-edit.html',
  styleUrl: './user-profile-edit.scss',
})
// Role : Afficher le formulaire d'edition du profil.
// Préconditions : Le parent fournit le FormGroup et les etats (upload/mutation).
// Postconditions : Les actions utilisateur sont remontees via les evenements.
export class UserProfileEditComponent {
  readonly editForm = input.required<FormGroup>();
  readonly isMutating = input<boolean>(false);
  readonly isUploading = input<boolean>(false);
  readonly uploadError = input<string | null>(null);
  readonly selectedFile = input<File | null>(null);
  readonly avatarPreview = input<string>('');

  @Output() fileSelected = new EventEmitter<Event>();
  @Output() avatarRemoved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  // Role : Relayer la selection de fichier au parent.
  // Préconditions : L'evenement provient d'un input file.
  // Postconditions : `fileSelected` est emis.
  onFileSelected(event: Event) {
    this.fileSelected.emit(event);
  }

  // Role : Indiquer la suppression de l'avatar.
  // Préconditions : L'utilisateur est en mode edition.
  // Postconditions : `avatarRemoved` est emis.
  removeAvatar() {
    this.avatarRemoved.emit();
  }

  // Role : Annuler l'edition.
  // Préconditions : Le parent ecoute l'evenement.
  // Postconditions : `cancelled` est emis.
  cancel() {
    this.cancelled.emit();
  }

  // Role : Soumettre le formulaire.
  // Préconditions : Le formulaire est valide cote parent.
  // Postconditions : `submitted` est emis.
  submit() {
    this.submitted.emit();
  }
}
