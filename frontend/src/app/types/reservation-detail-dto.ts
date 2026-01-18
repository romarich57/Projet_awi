import { ReservantDto } from './reservant-dto';
import { EditorDto } from './editor-dto';
import { WorkflowDto } from './workflow-dto';
import { ZonePlanDto } from './zone-plan-dto';
import { ReservationDto } from './reservation-dto';
import { FestivalDto } from './festival-dto';

// Type : Decrit le detail d'une reservation.
export interface ReservationDetailDto {
    // Données principales de la réservation
    reservation: ReservationDto;

    // Informations du réservant (obligatoire)
    reservant: ReservantDto;

    // Informations de l'éditeur (optionnel - seulement si le réservant est de type 'editeur')
    editor?: EditorDto;

    // État du workflow
    workflow: WorkflowDto;

    // Zone assignée (optionnelle)
    zone_plan?: ZonePlanDto;

    // Informations du festival
    festival: FestivalDto;
}
