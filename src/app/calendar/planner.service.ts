import { Injectable } from '@angular/core';
import { Plan, Plans, ClassListing, PlanSummary } from './calendar';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { map } from 'rxjs/operators';
import * as uuid from "uuid";

@Injectable({
  providedIn: 'root'
})
export class PlannerService {

  public currentPlan: BehaviorSubject<Plan>;
  private plans: BehaviorSubject<Plans>;

  constructor(
    public storageService: StorageService
  ) {
    this.plans = new BehaviorSubject<Plans>(storageService.get());

    const planIds = Object.keys(this.plans.value);
    if (planIds.length === 0) {
      this.currentPlan = new BehaviorSubject<Plan>(this.emptyPlan());
    } else {
      // TODO: get last edited plan
      this.setCurrentPlan(planIds[0]);
    }
  }

  public newPlan() {
    this.currentPlan.next(this.emptyPlan());
  }

  public savePlan() {
    const plan = this.currentPlan.value;
    this.plans.next(
      {
        ...this.plans.value,
        [plan.id]: {
          ...plan,
          lastEdited: Date.now()
        }
      }
    );
    this.storageService.save(this.plans.value);
  }

  public deletePlan() {
    // switch to previous plan
    this.currentPlan.next(this.plans.value[0]);

    // delete the plan
    const newPlans = {
      ...this.plans.value
    };

    delete newPlans[this.currentPlan.value.id];

    this.plans.next(newPlans);
    this.storageService.save(this.plans.value);
  }

  public setCurrentPlan(planId: string): void {
    if (!this.plans.value.hasOwnProperty(planId)) {
      throw new Error();
    }

    this.currentPlan.next(
      this.plans.value[planId]
    );
  }

  public getPlans(): Observable<PlanSummary[]> {
    return this.plans.pipe(
      map(p => Object.keys(p).map(k => ({
        id: p[k].id,
        name: p[k].name,
      })))
    );
  }

  private emptyPlan(): Plan {
    return {
      id: uuid.v4(),
      name: '',
      classes: new Array<ClassListing>(),
      selections: new Map<string, Map<string, number>>(),
      lastEdited: Date.now(),
      isDirty: false
    };
  }
}
