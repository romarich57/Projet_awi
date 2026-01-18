import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { FestivalState } from './festival-state';
import { FestivalService } from '../services/festival-service';
import { FestivalDto } from '../types/festival-dto';

describe('FestivalState', () => {
  let state: FestivalState;
  let serviceMock: jasmine.SpyObj<FestivalService>;

  const mockFestival: FestivalDto = {
    id: 1,
    name: 'Test Festival 2024',
    start_date: new Date('2024-06-01'),
    end_date: new Date('2024-06-30'),
    stock_tables_standard: 10,
    stock_tables_grande: 5,
    stock_tables_mairie: 3,
    stock_chaises: 100
  };

  const mockFestivalList: FestivalDto[] = [
    mockFestival,
    {
      id: 2,
      name: 'Another Festival',
      start_date: new Date('2024-07-01'),
      end_date: new Date('2024-07-15'),
      stock_tables_standard: 8,
      stock_tables_grande: 4,
      stock_tables_mairie: 2,
      stock_chaises: 80
    }
  ];

  beforeEach(() => {
    // Create spy object for FestivalService
    serviceMock = jasmine.createSpyObj('FestivalService', [
      'loadAllFestivals',
      'addFestival',
      'addZoneTarifaire'
    ]);

    TestBed.configureTestingModule({
      providers: [
        FestivalState,
        { provide: FestivalService, useValue: serviceMock }
      ]
    });

    state = TestBed.inject(FestivalState);
  });

 

  describe('Initialization', () => {
    it('should be created', () => {
      expect(state).toBeTruthy();
    });

    it('should start with null currentFestival', () => {
      expect(state.currentFestival()).toBeNull();
    });

    it('should start with null currentFestivalId', () => {
      expect(state.currentFestivalId).toBeNull();
    });

    it('should expose readonly currentFestival signal', () => {
      expect(state.currentFestival).toBeDefined();
      expect(typeof state.currentFestival).toBe('function');
    });
  });

  describe('setCurrentFestival()', () => {
    it('should set current festival when provided', () => {
      state.setCurrentFestival(mockFestival);

      expect(state.currentFestival()).toEqual(mockFestival);
      expect(state.currentFestival()?.id).toBe(1);
    });

    it('should set currentFestivalId when festival is set', () => {
      state.setCurrentFestival(mockFestival);

      expect(state.currentFestivalId).toBe(1);
    });

    it('should clear festival when set to null', () => {
      state.setCurrentFestival(mockFestival);
      expect(state.currentFestival()).not.toBeNull();

      state.setCurrentFestival(null);

      expect(state.currentFestival()).toBeNull();
      expect(state.currentFestivalId).toBeNull();
    });

    it('should replace previous festival when setting new one', () => {
      state.setCurrentFestival(mockFestival);
      expect(state.currentFestivalId).toBe(1);

      const newFestival = { ...mockFestival, id: 99, name: 'New Festival' };
      state.setCurrentFestival(newFestival);

      expect(state.currentFestivalId).toBe(99);
      expect(state.currentFestival()?.name).toBe('New Festival');
    });

    it('should handle setting festival multiple times', () => {
      state.setCurrentFestival(mockFestival);
      state.setCurrentFestival(null);
      state.setCurrentFestival(mockFestivalList[1]);

      expect(state.currentFestivalId).toBe(2);
      expect(state.currentFestival()?.name).toBe('Another Festival');
    });

    it('should maintain festival data integrity', () => {
      const festival: FestivalDto = {
        id: 42,
        name: 'Complete Festival',
        start_date: new Date('2024-08-01'),
        end_date: new Date('2024-08-31'),
        stock_tables_standard: 15,
        stock_tables_grande: 8,
        stock_tables_mairie: 5,
        stock_chaises: 150
      };

      state.setCurrentFestival(festival);

      const retrieved = state.currentFestival();
      expect(retrieved).toEqual(festival);
      expect(retrieved?.stock_tables_standard).toBe(15);
      expect(retrieved?.stock_chaises).toBe(150);
    });
  });

  describe('currentFestivalId getter', () => {
    it('should return null when no festival is set', () => {
      expect(state.currentFestivalId).toBeNull();
    });

    it('should return correct ID when festival is set', () => {
      state.setCurrentFestival(mockFestival);

      expect(state.currentFestivalId).toBe(1);
    });

    it('should return null after clearing festival', () => {
      state.setCurrentFestival(mockFestival);
      state.setCurrentFestival(null);

      expect(state.currentFestivalId).toBeNull();
    });

    it('should update when festival changes', () => {
      state.setCurrentFestival(mockFestivalList[0]);
      expect(state.currentFestivalId).toBe(1);

      state.setCurrentFestival(mockFestivalList[1]);
      expect(state.currentFestivalId).toBe(2);
    });

    it('should handle festival with ID 0', () => {
      const festivalZero = { ...mockFestival, id: 0 };
      state.setCurrentFestival(festivalZero);

      expect(state.currentFestivalId).toBe(0);
    });
  });

  describe('Signal Reactivity', () => {
    it('should emit when festival is set to null', () => {
      state.setCurrentFestival(mockFestival);
      expect(state.currentFestival()).not.toBeNull();

      state.setCurrentFestival(null);

      expect(state.currentFestival()).toBeNull();
    });

    it('should be readonly and not allow direct modification', () => {
      const readonly = state.currentFestival;

      expect((readonly as any).set).toBeUndefined();
    });

    it('should maintain signal reference on multiple reads', () => {
      const ref1 = state.currentFestival;
      const ref2 = state.currentFestival;

      expect(ref1).toBe(ref2);
    });

    it('should allow computed values based on festival', () => {
      state.setCurrentFestival(mockFestival);

      const isSet = state.currentFestival() !== null;
      expect(isSet).toBe(true);
    });

    it('should handle rapid successive changes', () => {
      state.setCurrentFestival(mockFestivalList[0]);
      state.setCurrentFestival(mockFestivalList[1]);
      state.setCurrentFestival(null);
      state.setCurrentFestival(mockFestival);

      expect(state.currentFestival()).toEqual(mockFestival);
    });

    it('should maintain state across multiple reads', () => {
      state.setCurrentFestival(mockFestival);

      const read1 = state.currentFestival();
      const read2 = state.currentFestival();
      const read3 = state.currentFestival();

      expect(read1).toEqual(read2);
      expect(read2).toEqual(read3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle festival with minimal data', () => {
      const minimalFestival: FestivalDto = {
        id: 1,
        name: 'Minimal',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-02'),
        stock_tables_standard: 0,
        stock_tables_grande: 0,
        stock_tables_mairie: 0,
        stock_chaises: 0
      };

      state.setCurrentFestival(minimalFestival);

      expect(state.currentFestival()).toEqual(minimalFestival);
      expect(state.currentFestival()?.stock_tables_standard).toBe(0);
    });

    it('should handle festival with large stock numbers', () => {
      const largeFestival: FestivalDto = {
        id: 1,
        name: 'Large Festival',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-02'),
        stock_tables_standard: 1000,
        stock_tables_grande: 500,
        stock_tables_mairie: 100,
        stock_chaises: 10000
      };

      state.setCurrentFestival(largeFestival);

      expect(state.currentFestival()?.stock_chaises).toBe(10000);
    });

    it('should handle festival with very long name', () => {
      const longName = 'A'.repeat(500);
      const festivalLongName: FestivalDto = {
        ...mockFestival,
        name: longName
      };

      state.setCurrentFestival(festivalLongName);

      expect(state.currentFestival()?.name).toBe(longName);
      expect(state.currentFestival()?.name.length).toBe(500);
    });

    it('should handle festival with special characters in name', () => {
      const specialFestival: FestivalDto = {
        ...mockFestival,
        name: 'Festival été 2024 - Édition spéciale! 🎉'
      };

      state.setCurrentFestival(specialFestival);

      expect(state.currentFestival()?.name).toContain('🎉');
    });

    it('should preserve Date objects correctly', () => {
      const startDate = new Date('2024-12-31T23:59:59Z');
      const endDate = new Date('2025-01-01T00:00:00Z');
      const datesFestival: FestivalDto = {
        id: 1,
        name: 'Dates Test',
        start_date: startDate,
        end_date: endDate,
        stock_tables_standard: 5,
        stock_tables_grande: 3,
        stock_tables_mairie: 2,
        stock_chaises: 50
      };

      state.setCurrentFestival(datesFestival);

      expect(state.currentFestival()?.start_date).toEqual(startDate);
      expect(state.currentFestival()?.end_date).toEqual(endDate);
    });
  });

  describe('Integration & Type Safety', () => {
    it('should work correctly with Angular dependency injection', () => {
      const injectedState = TestBed.inject(FestivalState);
      expect(injectedState).toBe(state);
    });

    it('should be a singleton service', () => {
      const state1 = TestBed.inject(FestivalState);
      const state2 = TestBed.inject(FestivalState);

      expect(state1).toBe(state2);
    });

    it('should maintain type safety for FestivalDto', () => {
      state.setCurrentFestival(mockFestival);

      const festival = state.currentFestival();
      if (festival) {
        expect(festival.id).toBeDefined();
        expect(festival.name).toBeDefined();
        expect(festival.start_date).toBeDefined();
        expect(festival.end_date).toBeDefined();
      }
    });
  });
});
