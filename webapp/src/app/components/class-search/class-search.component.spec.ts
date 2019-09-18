import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassSearchComponent } from './class-search.component';

describe('ClassListComponent', () => {
  let component: ClassSearchComponent;
  let fixture: ComponentFixture<ClassSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClassSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
