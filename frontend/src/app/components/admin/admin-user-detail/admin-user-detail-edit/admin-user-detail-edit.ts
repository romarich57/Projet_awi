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
    selector: 'app-admin-user-detail-edit',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './admin-user-detail-edit.html',
    styleUrl: './admin-user-detail-edit.scss',
})
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

    onFileSelected(event: Event) {
        this.fileSelected.emit(event);
    }

    removeAvatar() {
        this.avatarRemoved.emit();
    }

    cancel() {
        this.cancelled.emit();
    }

    submit() {
        this.submitted.emit();
    }
}
