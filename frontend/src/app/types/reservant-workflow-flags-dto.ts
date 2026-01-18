// Type : Decrit les indicateurs de workflow d'un reservant.
export interface ReservantWorkflowFlagsDto {
  liste_jeux_demandee?: boolean;
  liste_jeux_obtenue?: boolean;
  jeux_recus?: boolean;
  presentera_jeux?: boolean;
}
