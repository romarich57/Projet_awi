import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ReservantDto, ReservantWorkflowState } from '../types/reservant-dto';
import { Observable } from 'rxjs';
import { ReservantWorkflowFlagsDto } from '../types/reservant-workflow-flags-dto';

@Injectable({
    providedIn: 'root'
})
export class ReservantWorkflowApi {

    private readonly http = inject(HttpClient);
    private readonly resourceUrl = environment.apiUrl + '/reservant';

    // Role : Mettre a jour l'etat de workflow d'un reservant.
    // Preconditions : reservantId est valide et newState est fourni.
    // Postconditions : Retourne un Observable du reservant mis a jour.
    updateState(reservantId: number, newState: ReservantWorkflowState, festivalId: number | null = null): Observable<ReservantDto> {
        const url = `${this.resourceUrl}/${reservantId}/workflow`;
        const payload: any = { workflowState: newState };
        if (festivalId !== null) {
            payload.festivalId = festivalId;
        }

        return this.http.patch<ReservantDto>(url, payload, { withCredentials: true });
    }

    // Role : Mettre a jour les indicateurs de workflow d'un reservant.
    // Preconditions : reservantId est valide et flags est fourni.
    // Postconditions : Retourne un Observable du reservant mis a jour.
    updateFlags(reservantId: number, flags: ReservantWorkflowFlagsDto, festivalId: number | null = null): Observable<ReservantDto> {
        const url = `${this.resourceUrl}/${reservantId}/workflow/flags`;
        const payload = festivalId !== null ? { ...flags, festivalId } : flags;
        return this.http.patch<ReservantDto>(url, payload, { withCredentials: true });
    }

}
