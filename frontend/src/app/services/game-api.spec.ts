import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GameApiService } from './game-api';
import type { GameDto } from '../types/game-dto';
import type { MechanismDto } from '../types/mechanism-dto';

describe('GameApiService', () => {
  let service: GameApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GameApiService],
    });
    service = TestBed.inject(GameApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list games with filters', () => {
    const mockGames: GameDto[] = [
      { id: 1, title: 'Test', type: 'Famille', editor_id: 1, min_age: 8, authors: 'Auteur', prototype: false },
    ];

    service.list({ title: 'Test', editor_id: 1 }).subscribe((games) => {
      expect(games.length).toBe(1);
      expect(games[0].title).toBe('Test');
    });

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url.endsWith('/games'));
    expect(req.request.params.get('title')).toBe('Test');
    expect(req.request.params.get('editor_id')).toBe('1');
    req.flush(mockGames);
  });

  it('should load mechanisms', () => {
    const mockMechanisms: MechanismDto[] = [{ id: 1, name: 'Draft', description: null }];
    service.listMechanisms().subscribe((items) => {
      expect(items).toEqual(mockMechanisms);
    });
    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url.endsWith('/mechanisms'));
    req.flush(mockMechanisms);
  });
});
