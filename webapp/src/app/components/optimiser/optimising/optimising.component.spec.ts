import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OptimisingComponent } from './optimising.component';

describe('OptimisingComponent', () => {
  let component: OptimisingComponent;
  let fixture: ComponentFixture<OptimisingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OptimisingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OptimisingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
