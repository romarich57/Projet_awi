import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReservantApiService } from './reservant-api';
import { ReservantDto } from '../types/reservant-dto';
import { environment } from '../../environments/environment';

describe('ReservantApiService', () => {
  let service: ReservantApiService;
  let httpMock: HttpTestingController;

  const mockReservant: ReservantDto = {
    id: 1,
    name: 'Test Reservant',
    email: 'test@example.com',
    type: 'editeur',
    workflow_state: 'Pas_de_contact'
  };

  const mockReservantList: ReservantDto[] = [mockReservant, { ...mockReservant, id: 2 }];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReservantApiService]
    });
    service = TestBed.inject(ReservantApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); 
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });



  describe('GET Operations', () => {
    it('should fetch all reservants via GET /reservant', () => {
      service.list().subscribe(reservants => {
        expect(reservants).toEqual(mockReservantList);
        expect(reservants.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReservantList);
    });

    it('should fetch a reservant by id via GET /reservant/:id', () => {
      const id = 1;
      service.getbyid(id).subscribe(reservant => {
        expect(reservant).toEqual(mockReservant);
        expect(reservant.id).toBe(id);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant/${id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReservant);
    });
  });

 

  describe('POST Operations', () => {
    it('should create a reservant via POST /reservant', () => {
      const newReservant: ReservantDto = { ...mockReservant, id: 0 };

      service.create(newReservant).subscribe(reservant => {
        expect(reservant).toEqual(mockReservant);
        expect(reservant.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newReservant);
      req.flush(mockReservant);
    });

    it('should send correct payload in create()', () => {
      const payload: ReservantDto = {
        id: 0,
        name: 'New Reservant',
        email: 'new@test.com',
        type: 'boutique',
        workflow_state: 'Pas_de_contact',
        phone_number: '0123456789'
      };

      service.create(payload).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant`);
      expect(req.request.body).toEqual(payload);
      expect(req.request.body.name).toBe('New Reservant');
      expect(req.request.body.phone_number).toBe('0123456789');
      req.flush(payload);
    });
  });



  describe('PUT Operations', () => {
    it('should update a reservant via PUT /reservant/:id', () => {
      const updated: ReservantDto = { ...mockReservant, name: 'Updated Name' };

      service.update(updated).subscribe(reservant => {
        expect(reservant.name).toBe('Updated Name');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant/${updated.id}`);
      expect(req.request.method).toBe('PUT');
      req.flush(updated);
    });

    it('should construct correct URL for update()', () => {
      const reservant: ReservantDto = { ...mockReservant, id: 42 };

      service.update(reservant).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant/42`);
      expect(req.request.method).toBe('PUT');
      req.flush(reservant);
    });

    it('should send correct payload in update()', () => {
      const updated: ReservantDto = {
        ...mockReservant,
        name: 'Modified',
        email: 'modified@test.com',
        type: 'association'
      };

      service.update(updated).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant/${updated.id}`);
      expect(req.request.body).toEqual(updated);
      expect(req.request.body.name).toBe('Modified');
      expect(req.request.body.type).toBe('association');
      req.flush(updated);
    });
  });



  describe('DELETE Operations', () => {
    it('should delete a reservant via DELETE /reservant/:id', () => {
      service.delete(mockReservant).subscribe(reservant => {
        expect(reservant).toEqual(mockReservant);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant/${mockReservant.id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockReservant);
    });

    it('should construct correct URL for delete()', () => {
      const reservant: ReservantDto = { ...mockReservant, id: 99 };

      service.delete(reservant).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant/99`);
      expect(req.request.method).toBe('DELETE');
      req.flush(reservant);
    });
  });



  describe('Error Handling', () => {
    it('should handle HTTP 404 error gracefully', () => {
      service.getbyid(999).subscribe({
        next: () => fail('Should have failed with 404'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant/999`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle HTTP 500 error gracefully', () => {
      service.list().subscribe({
        next: () => fail('Should have failed with 500'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', () => {
      service.list().subscribe({
        next: () => fail('Should have failed with network error'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle validation errors (400)', () => {
      const invalidReservant: ReservantDto = { ...mockReservant, email: 'invalid-email' };

      service.create(invalidReservant).subscribe({
        next: () => fail('Should have failed with 400'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reservant`);
      req.flush({ error: 'Invalid email' }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
