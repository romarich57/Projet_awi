import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-game-edit-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-edit-header.html',
  styleUrl: './game-edit-header.scss',
})
export class GameEditHeaderComponent {
  readonly gameTitle = input<string>('');
  readonly backClicked = output<void>();

  onBack(event: Event): void {
    event.preventDefault();
    this.backClicked.emit();
  }
}
