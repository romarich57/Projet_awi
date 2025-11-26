import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReservantsListComponent } from './reservants-list-component';

describe('ReservantsListComponent', () => {
  let component: ReservantsListComponent;
  let fixture: ComponentFixture<ReservantsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservantsListComponent],
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservantsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
