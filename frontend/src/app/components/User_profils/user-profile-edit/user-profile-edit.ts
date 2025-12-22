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
