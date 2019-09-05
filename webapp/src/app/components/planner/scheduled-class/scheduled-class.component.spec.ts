import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduledClassComponent } from './scheduled-class.component';

describe('ScheduledClassComponent', () => {
  let component: ScheduledClassComponent;
  let fixture: ComponentFixture<ScheduledClassComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScheduledClassComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduledClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
