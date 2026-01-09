import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-game-create-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-create-header.html',
  styleUrl: './game-create-header.scss',
})
export class GameCreateHeaderComponent {
  readonly backClicked = output<void>();

  onBack(event: Event): void {
    event.preventDefault();
    this.backClicked.emit();
  }
}
