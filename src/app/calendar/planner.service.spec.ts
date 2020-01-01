import { TestBed } from '@angular/core/testing';

import { PlannerService } from './planner.service';

describe('PlannerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PlannerService = TestBed.get(PlannerService);
    expect(service).toBeTruthy();
  });
});
