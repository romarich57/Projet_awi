import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { WorkflowDto } from '@app/types/workflow-dto';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {

    http = inject(HttpClient);


  
  // Role : Recuperer le workflow associe a une reservation.
  // Preconditions : reservationId est valide.
  // Postconditions : Retourne un Observable du workflow.
  getWorkflowByReservationId(reservationId: number) {
    return this.http.get<WorkflowDto>(`${environment.apiUrl}/workflow/reservation/${reservationId}`,
        { withCredentials: true }
    );
  }

  // Role : Mettre a jour un workflow.
  // Preconditions : id est valide et workflowData contient les champs requis.
  // Postconditions : Retourne un Observable du workflow mis a jour.
  updateWorkflow(id: number, workflowData: {
    state: string;
    liste_jeux_demandee: boolean;
    liste_jeux_obtenue: boolean;
    jeux_recus: boolean;
    presentera_jeux: boolean;
  }) {
    return this.http.put<WorkflowDto>(`${environment.apiUrl}/workflow/${id}`,
        workflowData,
        { withCredentials: true }
    );
  }

  // Role : Ajouter une date de contact pour un workflow.
  // Preconditions : id est valide.
  // Postconditions : Retourne un Observable des dates de contact.
  addContactDate(id: number) {
    return this.http.post<string[]>(`${environment.apiUrl}/workflow/${id}/contact`,
        {},
        { withCredentials: true }
    );
  }

}
