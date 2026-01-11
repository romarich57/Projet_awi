import { Component, computed, effect, inject, input, OnDestroy, output, signal } from '@angular/core';
import { WorkflowService } from '@app/services/workflow-service';
import { CommonModule } from '@angular/common';
import { WorkflowDto } from '@app/types/workflow-dto';
import { AuthService } from '@app/services/auth.service';

@Component({
  selector: 'app-workflow-component',
  imports: [CommonModule],
  templateUrl: './workflow-component.html',
  styleUrl: './workflow-component.scss'
})

//on impléme,te OnDestroy pour gérer la sauvegarde des changements lorsque le composant est détruit/ la page est quittée
export class WorkflowComponent implements OnDestroy {


  readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser();

  // Inputs
  readOnly = computed(() => {
    return this.currentUser?.role !== 'admin' && this.currentUser?.role !== 'super-organizer';
  });

  reservationId = input.required<number | null>();
  workflowLoaded = output<WorkflowDto>();

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
        this.workflowLoaded.emit(workflowData);
        this.hasChanges = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du workflow:', err);
      }
    });
  }

  contactMessage = signal<string | null>(null);

  onContacted() {
    const wf = this.workflow();
    if (wf) {
      this.contactMessage.set(null);
      this.workflowService.addContactDate(wf.id).subscribe({
        next: (dates) => {
          this.workflow.update(w => w ? { ...w, contact_dates: dates } : null);
          this.contactMessage.set('Contact enregistré avec succès !');
          setTimeout(() => this.contactMessage.set(null), 3000);
        },
        error: (err) => {
          if (err.status === 409) {
            this.contactMessage.set('Un contact a déjà été enregistré aujourd\'hui.');
          } else {
            this.contactMessage.set('Erreur lors de l\'ajout du contact.');
          }
          setTimeout(() => this.contactMessage.set(null), 3000);
        }
      });
    }
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
      this.workflowLoaded.emit(this.workflow()!);
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
