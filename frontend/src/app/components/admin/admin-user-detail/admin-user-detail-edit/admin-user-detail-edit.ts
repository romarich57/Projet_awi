import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    input,
    Output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UserRole, USER_ROLES } from '@app/types/user-dto';

const ROLE_LABELS: Record<UserRole, string> = {
    benevole: 'Bénévole',
    organizer: 'Organisateur',
    'super-organizer': 'Super-organisateur',
    admin: 'Admin',
};

@Component({
    selector: 'app-admin-user-detail-edit',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './admin-user-detail-edit.html',
    styleUrl: './admin-user-detail-edit.scss',
})
// Role : Afficher le formulaire d'edition d'un utilisateur (admin).
// Préconditions : Le parent fournit le FormGroup et les etats d'upload/mutation.
// Postconditions : Les actions utilisateur sont emises vers le parent.
export class AdminUserDetailEditComponent {
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

    readonly roleOptions = USER_ROLES;
    readonly roleLabels = ROLE_LABELS;

    // Role : Relayer la selection de fichier au parent.
    // Préconditions : L'evenement provient d'un input file.
    // Postconditions : `fileSelected` est emis.
    onFileSelected(event: Event) {
        this.fileSelected.emit(event);
    }

    // Role : Indiquer la suppression de l'avatar.
    // Préconditions : Un avatar est affiche.
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
