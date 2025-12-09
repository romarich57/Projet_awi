import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AllocatedGamesApiService } from './allocated-games-api';
import type { AllocatedGameDto } from '../types/allocated-game-dto';

describe('AllocatedGamesApiService', () => {
  let service: AllocatedGamesApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AllocatedGamesApiService],
    });
    service = TestBed.inject(AllocatedGamesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch allocations', () => {
    const mockAllocations: AllocatedGameDto[] = [
      {
        allocation_id: 1,
        reservation_id: 2,
        game_id: 3,
        nb_tables_occupees: 1,
        nb_exemplaires: 2,
        zone_plan_id: null,
        taille_table_requise: 'standard',
        title: 'Jeu',
        type: 'Famille',
        editor_id: 1,
        editor_name: 'Editeur',
        min_age: 8,
        authors: 'Auteur',
        prototype: false,
      },
    ];

    service.list(10, 5).subscribe((allocations) => {
      expect(allocations.length).toBe(1);
      expect(allocations[0].reservation_id).toBe(2);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'GET' && r.url.endsWith('/festivals/10/reservants/5/games'),
    );
    req.flush(mockAllocations);
  });
});
