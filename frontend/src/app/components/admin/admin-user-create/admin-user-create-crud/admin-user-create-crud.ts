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
    selector: 'app-admin-user-create-crud',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './admin-user-create-crud.html',
    styleUrl: './admin-user-create-crud.scss',
})
// Role : Afficher le formulaire de creation d'utilisateur cote admin.
// Préconditions : Le parent fournit le FormGroup et les etats d'upload/mutation.
// Postconditions : Les actions utilisateur sont emises vers le parent.
export class AdminUserCreateCrudComponent {
    // Inputs
    readonly createForm = input.required<FormGroup>();
    readonly isMutating = input<boolean>(false);
    readonly isUploading = input<boolean>(false);
    readonly uploadError = input<string | null>(null);
    readonly selectedFile = input<File | null>(null);
    readonly avatarPreview = input<string>('');

    // Outputs
    @Output() fileSelected = new EventEmitter<Event>();
    @Output() avatarRemoved = new EventEmitter<void>();
    @Output() formSubmitted = new EventEmitter<void>();

    readonly roleOptions = USER_ROLES;
    readonly roleLabels = ROLE_LABELS;

    // Role : Relayer la selection de fichier au parent.
    // Préconditions : L'evenement provient d'un input file.
    // Postconditions : `fileSelected` est emis.
    onFileSelected(event: Event) {
        this.fileSelected.emit(event);
    }

    // Role : Indiquer la suppression de l'avatar selectionne.
    // Préconditions : Un avatar est en cours de selection.
    // Postconditions : `avatarRemoved` est emis.
    removeAvatar() {
        this.avatarRemoved.emit();
    }

    // Role : Soumettre le formulaire de creation.
    // Préconditions : Le formulaire est valide cote parent.
    // Postconditions : `formSubmitted` est emis.
    submit() {
        this.formSubmitted.emit();
    }
}
