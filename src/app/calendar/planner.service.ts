import { Injectable } from '@angular/core';
import { Plan, Plans, ClassListing, PlanSummary, ClassType } from './calendar';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { map } from 'rxjs/operators';
import * as uuid from "uuid";
import { ApiService } from '../api.service';

@Injectable({
  providedIn: 'root'
})
export class PlannerService {

  public currentPlan: BehaviorSubject<Plan>;
  private plans: BehaviorSubject<Plans>;

  constructor(
    public storageService: StorageService,
    public apiService: ApiService
  ) {
    this.plans = new BehaviorSubject<Plans>(storageService.get());

    const planIds = Object.keys(this.plans.value);
    if (planIds.length === 0) {
      this.currentPlan = new BehaviorSubject<Plan>(this.cleanPlan());
    } else {
      // TODO: get last edited plan
      this.setCurrentPlan(planIds[0]);
    }
  }

  public newPlan() {
    this.currentPlan.next(this.cleanPlan());
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

  public addClass(searchTerm: string): void {
    const plan = this.currentPlan.value;
    this.apiService.getClass(searchTerm).subscribe(
      (newClass: ClassListing) => {
        if (!plan.classes.some(c => c.name === newClass.name)) {
          plan.classes.push(newClass);

          if(!plan.selections.has(newClass.name)) {
              const classMap: Map<string, number> = new Map<string, number>();
              newClass.classes.forEach((classType: ClassType) => {
                  classMap.set(classType.name, 0);
              });
              plan.selections.set(newClass.name, classMap);
          }
        }
        plan.isDirty = true;
      });
  }

  public removeClass(className: string) {
    const plan = this.currentPlan.value;
    plan.classes = plan.classes.filter(c => className !== c.name);

    if (plan.selections.has(className)) {
      plan.selections.delete(className);
    }

    plan.isDirty = true;
  }

  public changeName(name: string) {
    const plan = this.currentPlan.value;
    plan.name = name;
    plan.isDirty = true;
  }

  private cleanPlan(): Plan {
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
