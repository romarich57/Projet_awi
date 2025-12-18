import { Component, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { WorkflowService } from '@app/services/workflow-service';
import { CommonModule } from '@angular/common';
import { WorkflowDto } from '@app/types/workflow-dto';

@Component({
  selector: 'app-workflow-component',
  imports: [CommonModule],
  templateUrl: './workflow-component.html',
  styleUrl: './workflow-component.scss'
})

//on impléme,te OnDestroy pour gérer la sauvegarde des changements lorsque le composant est détruit/ la page est quittée
export class WorkflowComponent implements OnDestroy {
  reservationId = input.required<number | null>();

  workflowService = inject(WorkflowService);

  // Données du workflow
  workflow = signal<WorkflowDto | null>(null);
  
  // Indique si des modifications ont été faites
  private hasChanges = false;

  constructor() {
    effect(() => {
      const id = this.reservationId();
      if (id) {
        this.getWorkflowByReservationId(id);
      }
    });
  }

  ngOnDestroy(): void {
    // Sauvegarder les changements avant de quitter le composant
    if (this.hasChanges && this.workflow()) {
      this.saveChanges();
    }
  }

  getWorkflowByReservationId(reservationId: number) {
    // Appeler le service pour obtenir le workflow
    this.workflowService.getWorkflowByReservationId(reservationId).subscribe({
      next: (workflowData) => {
        console.log('Workflow chargé:', workflowData);
        this.workflow.set(workflowData);
        this.hasChanges = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du workflow:', err);
      }
    });
  }

  onStateChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const currentWorkflow = this.workflow();
    if (currentWorkflow) {
      this.workflow.set({
        ...currentWorkflow,
        etatcourant: select.value as WorkflowDto['etatcourant']
      });
      this.hasChanges = true;
    }
  }

  onCheckboxChange(field: keyof Pick<WorkflowDto, 'liste_jeux_demandee' | 'liste_jeux_obtenue' | 'jeux_recus' | 'presentera_jeux'>, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const currentWorkflow = this.workflow();
    if (currentWorkflow) {
      this.workflow.set({
        ...currentWorkflow,
        [field]: checkbox.checked
      });
      this.hasChanges = true;
    }
  }

  private saveChanges() {
    const currentWorkflow = this.workflow();
    if (!currentWorkflow) return;

    this.workflowService.updateWorkflow(currentWorkflow.id, {
      state: currentWorkflow.etatcourant,
      liste_jeux_demandee: currentWorkflow.liste_jeux_demandee,
      liste_jeux_obtenue: currentWorkflow.liste_jeux_obtenue,
      jeux_recus: currentWorkflow.jeux_recus,
      presentera_jeux: currentWorkflow.presentera_jeux
    }).subscribe({
      next: () => {
        console.log('Workflow sauvegardé avec succès');
        this.hasChanges = false;
      },
      error: (err) => {
        console.error('Erreur lors de la sauvegarde du workflow:', err);
      }
    });
  }
  
}
