import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClassListing, TimetableSession, ClassType, NULL_SESSION } from 'src/app/calendar/calendar';
import { ApiService } from 'src/app/api.service';
import { ModalService } from '../../modal/modal.service';
import { faTimesCircle, faSearch } from '@fortawesome/free-solid-svg-icons';
import { PlannerService } from '../../../calendar/planner.service';
import { Plan } from '../../../calendar/calendar';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css']
})
export class PlanningComponent implements OnInit, OnDestroy {
  public subscription: Subscription;
  public plan: Plan;
  public name: string;
  public year: number;
  public semester: number;

  public classList: ClassListing[] = [];

  public selections: Map<string, Map<string, number>>;

  public editing = false;
  public editingClassName: string;
  public editingClassType: string;

  public isDirty = false;

  faTimesCircle = faTimesCircle;
  faSearch = faSearch;

  constructor(
      public api: ApiService,
      public plannerService: PlannerService,
      public modalService: ModalService) {
    this.selections = new Map<string, Map<string, number>>();

    this.subscription = plannerService.currentPlan.asObservable().subscribe( plan => {
      this.plan = plan;
    });
  }

  ngOnInit() { }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  public loadTimetable(name: string): void { }

  public getName(): string {
    if (this.name === '' || this.name === undefined || this.name === null) {
      this.name = 'Semester Timetable';
    }

    return this.name;
  }

  public handleTitleChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    let name = target.value;
    if (target.value === '' || target.value === undefined || target.value === null) {
      name = 'Timetable';
    }

    // this.deletable = target.value in this.calendarNames;
    this.name = target.value;

    this.isDirty = true;
  }

  public addClass(newClass: ClassListing): void {

    if(!this.plan.classes.some(c => c.name === newClass.name)) {
      this.plan.classes.push(newClass);

      if(!this.plan.selections.has(newClass.name)) {
          const classMap: Map<string, number> = new Map<string, number>();
          newClass.classes.forEach((classType: ClassType) => {
              classMap.set(classType.name, 0);
          });
          this.plan.selections.set(newClass.name, classMap);
      }
    }
    this.plan.isDirty = true;
  }

  public removeClass(className: string): void {
    this.classList = this.classList.filter(c => className !== c.name);

    if(this.selections.has(className)) {
      this.selections.delete(className);
    }
    this.isDirty = true;
  }

  public setSelection(className: string, classType: string, selection: number): void {
    if(this.selections.has(className) && this.selections[className].has(classType)) {
        this.selections[className][classType] = selection;
    }
    this.isDirty = true;
  }

  public GetSelection(className: string, classType: string): number {
    if(this.selections.has(className) && this.selections[className].has(classType)) {
        return this.selections[className][classType];
    }
  }

  public onSearched(searchTerm: string): string {
    this.api.getClass(searchTerm, this.year, this.semester).subscribe(
      (newClass: ClassListing) => {
        this.addClass(newClass);
      });

    return '';
  }

  public onClassCloseClicked(className: string): void {
    this.removeClass(className);
    this.isDirty = true;
  }

  public handleTimetableChangeRequest(name: string): void {
    if (this.isDirty) {
      this.modalService.showConfirmationModal(
        'Unsaved Changes',
        'You have made changes to your current timetable that ' +
        'have not been saved. Are you sure you want to load ' +
        'another timetable?',
        () => this.loadTimetable(name));
    } else {
      this.loadTimetable(name);
    }
  }
}
