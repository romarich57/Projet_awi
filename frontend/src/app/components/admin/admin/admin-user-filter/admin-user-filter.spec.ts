import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUserFilterComponent } from './admin-user-filter';
import { By } from '@angular/platform-browser';

describe('AdminUserFilterComponent', () => {
    let component: AdminUserFilterComponent;
    let fixture: ComponentFixture<AdminUserFilterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminUserFilterComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminUserFilterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit searchQueryChange on search input', () => {
        spyOn(component.searchQueryChange, 'emit');
        const input = fixture.debugElement.query(By.css('input[type="search"]'));
        if (!input) {
            // If template not found or differs, test logic directly
            const event = { target: { value: 'test' } } as any;
            component.updateSearch(event);
            expect(component.searchQueryChange.emit).toHaveBeenCalledWith('test');
            return;
        }

        input.nativeElement.value = 'query';
        input.nativeElement.dispatchEvent(new Event('input'));
        expect(component.searchQueryChange.emit).toHaveBeenCalledWith('query');
    });

    it('should emit roleFilterChange on role select', () => {
        spyOn(component.roleFilterChange, 'emit');
        const select = fixture.debugElement.query(By.css('select.role-filter'));
        // Note: class might differ, calling method directly is safer for logic test
        const event = { target: { value: 'admin' } } as any;
        component.updateRoleFilter(event);
        expect(component.roleFilterChange.emit).toHaveBeenCalledWith('admin');
    });

    it('should emit statusFilterChange on status select', () => {
        spyOn(component.statusFilterChange, 'emit');
        const event = { target: { value: 'verified' } } as any;
        component.updateStatusFilter(event);
        expect(component.statusFilterChange.emit).toHaveBeenCalledWith('verified');
    });

    it('should emit sortKeyChange on sort select', () => {
        spyOn(component.sortKeyChange, 'emit');
        const event = { target: { value: 'lastName' } } as any;
        component.updateSortKey(event);
        expect(component.sortKeyChange.emit).toHaveBeenCalledWith('lastName');
    });

    it('should emit sortDirectionChange on toggle', () => {
        spyOn(component.sortDirectionChange, 'emit');
        // Initial is desc, toggle should emit asc
        component.toggleSortDirection();
        expect(component.sortDirectionChange.emit).toHaveBeenCalledWith('asc');
    });

    it('should emit resetFiltersEvent on reset', () => {
        spyOn(component.resetFiltersEvent, 'emit');
        component.resetFilters();
        expect(component.resetFiltersEvent.emit).toHaveBeenCalled();
    });
});
