import { ApiService } from "../api.service";
import { Injectable, isDevMode } from "@angular/core";
import {
  Plan,
  Plans,
  ClassListing,
  PlanSummary,
  ClassType,
  Campus,
  Semester,
  CURRENT_YEAR,
  CURRENT_SEMESTER,
  DeliveryMode,
} from "./calendar";
import { Observable, BehaviorSubject, forkJoin } from "rxjs";
import { StorageService } from "./storage.service";
import { ModalService } from "../components/modal/modal.service";
import { map } from "rxjs/operators";
import * as uuid from "uuid";
import * as _ from "lodash";
import { ModalButton } from '../components/modal/modal';

@Injectable({
  providedIn: "root",
})
export class PlannerService {
  public currentPlan: BehaviorSubject<Plan>;
  private plans: BehaviorSubject<Plans>;

  constructor(
    public apiService: ApiService,
    public storageService: StorageService,
    public modalService: ModalService
  ) {
    this.plans = new BehaviorSubject<Plans>(storageService.get());

    const planIds = Object.keys(this.plans.value);

    if (planIds.length === 0) {
      this.currentPlan = new BehaviorSubject<Plan>(
        this.cleanPlan(CURRENT_YEAR, CURRENT_SEMESTER)
      );

      this.plans.next({
        [this.currentPlan.value.id]: this.currentPlan.value,
      });
    } else {
      // TODO: get last edited plan
      this.currentPlan = new BehaviorSubject<Plan>(
        _.cloneDeep(this.plans.value[planIds[0]])
      );
    }
  }

  public newPlan(year = CURRENT_YEAR, semester = CURRENT_SEMESTER) {
    const cleanPlan: Plan = this.cleanPlan(year, semester);
    this.currentPlan.next(cleanPlan);

    this.plans.next({
      ...this.plans.value,
      [cleanPlan.id]: cleanPlan,
    });
  }

  public savePlan() {
    const plan = this.currentPlan.value;
    if (!plan.name) {
      plan.name = this.defaultPlanName(plan.semester);
    }

    plan.isDirty = false;

    this.plans.next({
      ...this.plans.value,
      [plan.id]: {
        ...plan,
        lastEdited: Date.now(),
        wasEmpty: plan.classes.length === 0,
      },
    });
    this.storageService.save(this.plans.value);
  }

  public deletePlan() {
    // delete the plan
    const planId = this.currentPlan.value.id;
    const newPlans = {
      ...this.plans.value,
    };

    delete newPlans[planId];

    this.plans.next(newPlans);

    // switch to previous plan
    const keys = Object.keys(this.plans.value);
    if (keys.length > 0) {
      this.setCurrentPlan(keys[0]);
    } else {
      this.newPlan();
    }

    // save
    this.storageService.save(this.plans.value);
  }

  public setCurrentPlan(planId: string): void {
    if (!this.plans.value.hasOwnProperty(planId)) {
      throw new Error();
    }

    this.currentPlan.next(_.cloneDeep(this.plans.value[planId]));

    const hourInMillis = 60 * 60 * 1000;

    // if(this.currentPlan.value.lastEdited + hourInMillis < Date.now()) {
    this.refreshPlan(this.currentPlan.value);
    // }
  }

  public getPlans(): Observable<PlanSummary[]> {
    return this.plans.pipe(
      map((p) =>
        Object.keys(p).map((k) => ({
          id: p[k].id,
          name: p[k].name,
        }))
      )
    );
  }

  public addClass(searchTerm: string, campus: Campus, deliveryMode: DeliveryMode): Observable<string> {
    return new Observable((subscriber) => {
      subscriber.next("In progress...");

      this.apiService
        .getClass(
          searchTerm,
          campus,
          deliveryMode,
          this.currentPlan.value.year,
          this.currentPlan.value.semester
        )
        .subscribe(
          (newClass: ClassListing) => {
            isDevMode() && console.log(newClass);
            const plan = _.cloneDeep(this.currentPlan.value);
            try {
              this.addClassListing(newClass);
              subscriber.complete();
            } catch (error) {
              console.log("error adding class");
              subscriber.error(error.message);
            }
          },
          (error: Error) => {
            subscriber.error(error.message);
          }
        );
    });
  }

  private addClassListing(newClass: ClassListing): void {
    const plan = _.cloneDeep(this.currentPlan.value);
    if (!plan.classes.some((c) => c.name === newClass.name)) {
      plan.classes.push(newClass);
      if (!plan.selections.has(newClass.name)) {
        const classMap: Map<string, number> = new Map<
          string,
          number
        >();
        newClass.classes.forEach((classType: ClassType) => {
          classMap.set(classType.name, 0);
        });
        plan.selections.set(newClass.name, classMap);
      }
    }

    plan.isDirty = true;
    this.currentPlan.next(plan);
  }

  public removeClass(className: string) {
    const plan = _.cloneDeep(this.currentPlan.value);
    plan.classes = plan.classes.filter((c) => className !== c.name);

    if (plan.selections.has(className)) {
      plan.selections.delete(className);
    }

    plan.isDirty = true;
    this.currentPlan.next(plan);
  }

  public changeName(name: string) {
    const plan = this.currentPlan.value;

    if (!name) {
      plan.name = this.defaultPlanName(plan.semester);
    }

    this.currentPlan.next({
      ...plan,
      isDirty: true,
      name,
    });
  }

  public setSemester(year: number, semester: 1 | 2 | 3) {
    const plan = this.currentPlan.value;

    // clear classes
    plan.classes = new Array<ClassListing>();
    plan.selections = new Map<string, Map<string, number>>();

    this.currentPlan.next({
      ...plan,
      year,
      semester,
      name: this.defaultPlanName(semester),
    });
  }

  public defaultPlanName(semester = CURRENT_SEMESTER): string {
    const alreadyUsed = Object.values(this.plans.value).map((p) => p.name);
    const pre =
      semester === 3
        ? `Semester ${semester} Draft Timetable`
        : `Semester ${semester} Timetable`;
    let count = 2;

    let name = pre;
    while (alreadyUsed.indexOf(name) !== -1) {
      name = `${pre} ${count++}`;
    }

    return name;
  }

  private cleanPlan(year: number, semester: 1 | 2 | 3): Plan {
    return {
      id: uuid.v4(),
      name: this.defaultPlanName(semester),
      classes: new Array<ClassListing>(),
      selections: new Map<string, Map<string, number>>(),
      lastEdited: Date.now(),
      isDirty: false,
      wasEmpty: true,
      schemaVersion: 2,
      year,
      semester,
    };
  }

  /**
   * Update the stored timetable data for this plan,
   * prompting the user if there are changes.
   * @param plan The Plan to refresh
   */
  public refreshPlan(plan: Plan): void {
    console.log('refreshing');

    console.log(plan);
    const classesObservable = forkJoin(plan.classes.map(listing =>
      this.apiService.getClass(listing.name, listing.campus, listing.deliveryMode, plan.year, plan.semester)
    ));

    console.log('new stuff');

    classesObservable.subscribe({
      next: (classes) => {
        // If we're just flicking through timetables we don't want to be barraged with modals
        if(plan.id !== this.currentPlan.value.id) {
          return;
        }

        console.log(classes);

        // Compare the new data with our stored data. If any classes came back with an error, ignore it
        const classMatches = classes.map(refreshedClass => {
          if(refreshedClass instanceof Error) {
            return { name: refreshedClass.name, matches: true };
          } else {
            const existingClass = plan.classes.find(clazz => clazz.name === refreshedClass.name);

            if(existingClass === undefined) {
              return { name: refreshedClass.name, matches: true };
            } else {
              return {
                name: refreshedClass.name,
                class: refreshedClass,
                matches: existingClass.hash === refreshedClass.hash
              };
            }
          }
        });

        const nonMatchingClasses = classMatches.filter(match => !match.matches);

        // If any have changed, prompt the user about it
        if(nonMatchingClasses.length > 0) {
          console.log('uh oh a change happened');
          nonMatchingClasses.forEach(clazz => {
            const existingClass = plan.classes.find(c => c.name === clazz.name);

            console.log(`change detected for ${clazz.name}`);
            console.log(`old hash: ${existingClass.hash}`);
            console.log(`new hash: ${clazz.class.hash}`);

            console.log('old json:');
            console.log(existingClass);
            console.log('new json:');
            console.log(clazz.class);
          });

          const numMatches = nonMatchingClasses.length;
          const classNames = nonMatchingClasses.map(match => match.name).join(', ');
          const classWord  = numMatches === 1 ? 'class' : 'classes';
          const thisWord   = numMatches === 1 ? 'this'  : 'these';
          this.modalService.showModal({
            title: 'Timetabling Changes Detected',
            text: [
              'Timetabling changes for the following ', classWord, ' have been detected: ',
              classNames, '. ',
              'Would you like to reload the data for ', thisWord, ' ', classWord, '? ',
              'You will lose any selections you have made in the affected ', classWord, '.'].join(''),
            buttons: [
              new ModalButton('Yes', () => {
                this.replaceClassListing(nonMatchingClasses.map(clazz => clazz.class));
                this.modalService.closeModal();
              }),
              new ModalButton('No',  () => this.modalService.closeModal())
            ]
          });
        } else {
          console.log('everything is fine!');
        }
      },
      error: (error) => console.error(error)
    });
  }

  private replaceClassListing(classListings: ClassListing[]) {
    classListings.forEach(listing => {
      this.removeClass(listing.name);

      try {
        this.addClassListing(listing);
      } catch (error) {
        console.log('error replacing class');
      }
    });
  }
}
