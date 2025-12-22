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
    visiteur: 'Visiteur',
    benevole: 'Benevole',
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
export class AdminUserCreateCrudComponent {
    // Inputs from parent
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

    onFileSelected(event: Event) {
        this.fileSelected.emit(event);
    }

    removeAvatar() {
        this.avatarRemoved.emit();
    }

    submit() {
        this.formSubmitted.emit();
    }
}
