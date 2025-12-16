export interface ReservantContactDto {
  id: number;
  reservantId: number;
  festivalId: number;
  contactId: number;
  contactName: string;
  contactEmail: string;
  contactPhoneNumber: string;
  contactJobTitle: string;
  contactPriority: number;
  dateContact: string; 
}
