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
// Role : Afficher la selection de mecanismes pour un jeu.
// Préconditions : Les mecanismes et selections actuelles sont fournis.
// Postconditions : Les changements de selection sont emis.
export class GameMechanismsSelectComponent {
  readonly mechanisms = input<readonly MechanismDto[]>([]);
  readonly selectedIds = input<readonly number[]>([]);
  readonly selectedIdsChange = output<number[]>();

  // Role : Verifier si un mecanisme est selectionne.
  // Préconditions : `id` est un identifiant valide.
  // Postconditions : Retourne true si l'id est present dans la selection.
  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  // Role : Ajouter ou retirer un mecanisme de la selection.
  // Préconditions : `id` est un identifiant valide.
  // Postconditions : La nouvelle liste d'ids est emise.
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
