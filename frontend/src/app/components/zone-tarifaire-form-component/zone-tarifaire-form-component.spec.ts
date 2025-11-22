import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneTarifaireFormComponent } from './zone-tarifaire-form-component';

describe('ZoneTarifaireFormComponent', () => {
  let component: ZoneTarifaireFormComponent;
  let fixture: ComponentFixture<ZoneTarifaireFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneTarifaireFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZoneTarifaireFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
