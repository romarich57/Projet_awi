import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { WorkflowService } from '@app/services/workflow-service';
import { CommonModule } from '@angular/common';
import { WorkflowDto } from '@app/types/workflow-dto';
import { AuthService } from '@app/services/auth.service';

@Component({
  selector: 'app-workflow-component',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './workflow-component.html',
  styleUrl: './workflow-component.scss'
})

//on impléme,te OnDestroy pour gérer la sauvegarde des changements lorsque le composant est détruit/ la page est quittée
// Role : Afficher et mettre a jour le workflow associe a une reservation.
// Préconditions : `reservationId` est fourni; les services AuthService et WorkflowService sont disponibles.
// Postconditions : Le workflow est charge, modifie, et sauvegarde si necessaire.
export class WorkflowComponent implements OnDestroy {


  readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser;

  // Inputs
  readOnly = computed(() => {
    const user = this.currentUser();
    return user?.role !== 'admin' && user?.role !== 'super-organizer';
  });

  reservationId = input.required<number | null>();
  showGamePresence = input<boolean>(true);
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

  // Role : Sauvegarder les changements en quittant le composant.
  // Préconditions : Un workflow est charge et `hasChanges` est a true.
  // Postconditions : Les modifications sont envoyees avant la destruction.
  ngOnDestroy(): void {
    // Sauvegarder les changements avant de quitter le composant
    if (this.hasChanges && this.workflow()) {
      this.saveChanges();
    }
  }

  // Role : Charger le workflow lie a une reservation.
  // Préconditions : `reservationId` est valide.
  // Postconditions : Le workflow est stocke en signal et l'evenement est emis.
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

  // Role : Enregistrer un contact pour le workflow courant.
  // Préconditions : Un workflow est charge.
  // Postconditions : La date de contact est ajoutee et un message est affiche.
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

  // Role : Mettre a jour l'etat courant a partir d'une selection UI.
  // Préconditions : L'evenement provient d'un select et un workflow est charge.
  // Postconditions : L'etat est mis a jour et le flag de modification est active.
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

  // Role : Mettre a jour un booleen du workflow via une case a cocher.
  // Préconditions : Le champ fait partie des cles autorisees et un workflow est charge.
  // Postconditions : Le workflow est mis a jour, l'evenement est emis et `hasChanges` est true.
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

  // Role : Persister les changements du workflow courant.
  // Préconditions : Un workflow est charge.
  // Postconditions : Les changements sont sauvegardes et `hasChanges` repasse a false si succes.
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
