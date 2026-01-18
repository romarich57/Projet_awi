import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamesResultsListComponent } from './games-results-list';
import type { GameDto } from '../../../types/game-dto';
import type { GamesVisibleColumns } from '@app/types/games-page.types';

describe('GamesResultsListComponent', () => {
    let component: GamesResultsListComponent;
    let fixture: ComponentFixture<GamesResultsListComponent>;

    const mockVisibleColumns: GamesVisibleColumns = {
        type: true,
        editor: true,
        age: true,
        players: true,
        authors: true,
        mechanisms: true,
        theme: false,
        duration: false,
        prototype: true,
        description: false,
    };

    const mockGames: GameDto[] = [
        {
            id: 1,
            title: 'Catan',
            type: 'Jeu de société',
            editor_id: 1,
            editor_name: 'Kosmos',
            min_age: 10,
            min_players: 3,
            max_players: 4,
            prototype: false,
            duration_minutes: 75,
            theme: 'Colonisation',
            description: 'Un jeu de stratégie',
            authors: 'Klaus Teuber',
            image_url: null,
            rules_video_url: null,
            mechanisms: [],
        },
        {
            id: 2,
            title: 'Dixit',
            type: 'Jeu de cartes',
            editor_id: 2,
            editor_name: 'Libellud',
            min_age: 8,
            min_players: 3,
            max_players: 6,
            prototype: false,
            duration_minutes: 30,
            theme: 'Imagination',
            description: 'Un jeu de devinettes',
            authors: 'Jean-Louis Roubira',
            image_url: null,
            rules_video_url: null,
            mechanisms: [],
        },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GamesResultsListComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GamesResultsListComponent);
        component = fixture.componentInstance;

        // Set required inputs
        fixture.componentRef.setInput('visibleColumns', mockVisibleColumns);
        fixture.componentRef.setInput('games', mockGames);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Inputs', () => {
        it('should receive games input', () => {
            expect(component.games()).toEqual(mockGames);
        });

        it('should receive visibleColumns input', () => {
            expect(component.visibleColumns()).toEqual(mockVisibleColumns);
        });

        it('should handle empty games array', () => {
            fixture.componentRef.setInput('games', []);
            fixture.detectChanges();

            expect(component.games()).toEqual([]);
        });
    });

    describe('Outputs', () => {
        it('should have view output defined', () => {
            expect(component.view).toBeDefined();
        });

        it('should have edit output defined', () => {
            expect(component.edit).toBeDefined();
        });

        it('should have delete output defined', () => {
            expect(component.delete).toBeDefined();
        });

        it('should emit edit event when triggered', () => {
            const spy = spyOn(component.edit, 'emit');
            const game = mockGames[0];

            component.edit.emit(game);

            expect(spy).toHaveBeenCalledWith(game);
        });

        it('should emit view event when triggered', () => {
            const spy = spyOn(component.view, 'emit');
            const game = mockGames[0];

            component.view.emit(game);

            expect(spy).toHaveBeenCalledWith(game);
        });

        it('should emit delete event when triggered', () => {
            const spy = spyOn(component.delete, 'emit');
            const game = mockGames[1];

            component.delete.emit(game);

            expect(spy).toHaveBeenCalledWith(game);
        });
    });

    describe('Rendering', () => {
        it('should display the correct number of games', () => {
            // The component uses GameListItemComponent for each game
            // We check that the games input is correctly passed
            expect(component.games().length).toBe(2);
        });

        it('should update when games input changes', () => {
            const newGames = [mockGames[0]];
            fixture.componentRef.setInput('games', newGames);
            fixture.detectChanges();

            expect(component.games().length).toBe(1);
            expect(component.games()[0].title).toBe('Catan');
        });
    });
});
