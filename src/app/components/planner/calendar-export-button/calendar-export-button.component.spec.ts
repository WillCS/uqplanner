import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarExportButtonComponent } from './calendar-export-button.component';

describe('CalendarExportButtonComponent', () => {
  let component: CalendarExportButtonComponent;
  let fixture: ComponentFixture<CalendarExportButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalendarExportButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarExportButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
