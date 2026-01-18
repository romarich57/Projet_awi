import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ReservantContactDto } from '../types/reservant-contact-dto';
import { ContactDto } from '../types/contact-dto';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReservantContactApi {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl + '/reservant';

    // Role : Recuperer les contacts d'un reservant.
    // Preconditions : reservantId est valide.
    // Postconditions : Retourne un Observable des contacts.
    listContacts(reservantId: number): Observable<ContactDto[]> {
        return this.http.get<ContactDto[]>(`${this.baseUrl}/${reservantId}/contacts`, { withCredentials: true });
    }

    // Role : Recuperer la timeline des contacts d'un reservant.
    // Preconditions : reservantId est valide.
    // Postconditions : Retourne un Observable des evenements de contact.
    listTimeline(reservantId: number): Observable<ReservantContactDto[]> {
        return this.http.get<ReservantContactDto[]>(`${this.baseUrl}/${reservantId}/contacts/timeline`, { withCredentials: true });
    }

    // Role : Ajouter un contact pour un reservant.
    // Preconditions : reservantId est valide et contact est fourni.
    // Postconditions : Retourne un Observable du contact cree.
    addContact(reservantId: number, contact: ContactDto): Observable<ContactDto> {
        return this.http.post<ContactDto>(`${this.baseUrl}/${reservantId}/contacts`, contact, { withCredentials: true });
    }

    // Role : Ajouter un evenement de contact pour un reservant.
    // Preconditions : reservantId, contactId et dateContact sont valides.
    // Postconditions : Retourne un Observable de l'evenement cree.
    addContactEvent(reservantId: number, contactId: number, dateContact: string): Observable<ReservantContactDto> {
        const payload = { contactId, dateContact };
        return this.http.post<ReservantContactDto>(`${this.baseUrl}/${reservantId}/contacts/events`, payload, { withCredentials: true });
    }

    // Role : Supprimer un contact d'un reservant.
    // Preconditions : reservantId et contactId sont valides.
    // Postconditions : Retourne un Observable avec le message de suppression.
    deleteContact(reservantId: number, contactId: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.baseUrl}/${reservantId}/contacts/${contactId}`, { withCredentials: true });
    }

    // Role : Supprimer un evenement de contact d'un reservant.
    // Preconditions : reservantId et eventId sont valides.
    // Postconditions : Retourne un Observable avec le message de suppression.
    deleteContactEvent(reservantId: number, eventId: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.baseUrl}/${reservantId}/contacts/events/${eventId}`, { withCredentials: true });
    }
}
