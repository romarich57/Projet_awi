import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { GamesFiltersPanelComponent } from './games-filters-panel';
import type { EditorDto } from '../../../types/editor-dto';
import type { GamesColumnOption, GamesFilters, GamesVisibleColumns } from '@app/types/games-page.types';

describe('GamesFiltersPanelComponent', () => {
    let component: GamesFiltersPanelComponent;
    let fixture: ComponentFixture<GamesFiltersPanelComponent>;

    const mockFilters: GamesFilters = {
        title: '',
        type: '',
        editorId: '',
        minAge: '',
    };

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

    const mockColumnOptions: GamesColumnOption[] = [
        { key: 'type', label: 'Type' },
        { key: 'editor', label: 'Éditeur' },
        { key: 'age', label: 'Âge' },
    ];

    const mockTypes: string[] = ['Jeu de société', 'Jeu de cartes', 'Jeu de rôle'];

    const mockEditors: EditorDto[] = [
        { id: 1, name: 'Asmodee', email: 'contact@asmodee.com' },
        { id: 2, name: 'Gigamic', email: 'info@gigamic.com' },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GamesFiltersPanelComponent, FormsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(GamesFiltersPanelComponent);
        component = fixture.componentInstance;

        // Set required inputs
        fixture.componentRef.setInput('filters', mockFilters);
        fixture.componentRef.setInput('visibleColumns', mockVisibleColumns);
        fixture.componentRef.setInput('columnOptions', mockColumnOptions);
        fixture.componentRef.setInput('types', mockTypes);
        fixture.componentRef.setInput('editors', mockEditors);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Inputs', () => {
        it('should receive filters input', () => {
            expect(component.filters()).toEqual(mockFilters);
        });

        it('should receive types input', () => {
            expect(component.types()).toEqual(mockTypes);
        });

        it('should receive editors input', () => {
            expect(component.editors()).toEqual(mockEditors);
        });

        it('should receive visibleColumns input', () => {
            expect(component.visibleColumns()).toEqual(mockVisibleColumns);
        });

        it('should receive columnOptions input', () => {
            expect(component.columnOptions()).toEqual(mockColumnOptions);
        });
    });

    describe('localFilters', () => {
        it('should initialize localFilters from filters input', () => {
            expect(component.localFilters()).toEqual(mockFilters);
        });

        it('should update localFilters when filters input changes', () => {
            const newFilters: GamesFilters = {
                title: 'Test',
                type: 'Jeu de société',
                editorId: '1',
                minAge: '8',
            };

            fixture.componentRef.setInput('filters', newFilters);
            fixture.detectChanges();

            expect(component.localFilters()).toEqual(newFilters);
        });
    });

    describe('updateFilter()', () => {
        it('should update localFilters with partial update', () => {
            component.updateFilter({ title: 'New Title' });

            expect(component.localFilters().title).toBe('New Title');
        });

        it('should emit filtersChanged event', () => {
            const spy = spyOn(component.filtersChanged, 'emit');

            component.updateFilter({ title: 'Test' });

            expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Test' }));
        });

        it('should preserve other filter values when updating one', () => {
            // First set some values
            component.updateFilter({ title: 'Title', type: 'Type1' });

            // Then update just one value
            component.updateFilter({ minAge: '10' });

            const filters = component.localFilters();
            expect(filters.title).toBe('Title');
            expect(filters.type).toBe('Type1');
            expect(filters.minAge).toBe('10');
        });
    });

    describe('submit()', () => {
        it('should emit filtersChanged with current localFilters', () => {
            const spy = spyOn(component.filtersChanged, 'emit');

            component.updateFilter({ title: 'Submit Test' });
            component.submit();

            expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Submit Test' }));
        });
    });

    describe('toggleColumn()', () => {
        it('should emit visibleColumnsChanged when toggling a column', () => {
            const spy = spyOn(component.visibleColumnsChanged, 'emit');

            component.toggleColumn('theme', true);

            expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ theme: true }));
        });

        it('should preserve other column values when toggling one', () => {
            const spy = spyOn(component.visibleColumnsChanged, 'emit');

            component.toggleColumn('type', false);

            expect(spy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    editor: true, // unchanged
                    age: true,    // unchanged
                    type: false,  // changed
                })
            );
        });
    });
});
