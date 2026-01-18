// Type : Decrit un contact associe a un reservant ou editeur.
export interface ContactDto {
  id?: number;
  name: string;
  email: string;
  phone_number: string;
  job_title: string;
  priority: number;
}
