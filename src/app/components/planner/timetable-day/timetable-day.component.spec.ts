import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimetableDayComponent } from './timetable-day.component';

describe('TimetableDayComponent', () => {
  let component: TimetableDayComponent;
  let fixture: ComponentFixture<TimetableDayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimetableDayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimetableDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
