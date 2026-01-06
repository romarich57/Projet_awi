import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { MechanismDto } from '../../../../types/mechanism-dto';

@Component({
  selector: 'app-game-mechanisms-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-mechanisms-select.html',
  styleUrl: './game-mechanisms-select.scss',
})
export class GameMechanismsSelectComponent {
  readonly mechanisms = input<readonly MechanismDto[]>([]);
  readonly selectedIds = input<readonly number[]>([]);
  readonly selectedIdsChange = output<number[]>();

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  toggleMechanism(id: number): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIdsChange.emit(Array.from(next.values()));
  }
}
