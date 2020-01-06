import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  WEEKDAYS, WEEKDAY_INDICES, TIMETABLE_HOURS, ClassListing,
  TimetableSession, ClassStream, ClassType, ClassSession
} from 'src/app/calendar/calendar';
import { ExportService } from 'src/app/calendar/export.service';
import { faDownload, faPlus, faSave, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Plan, PlanSummary } from '../../../calendar/calendar';
import { Subscription } from 'rxjs';
import { PlannerService } from '../../../calendar/planner.service';
import { ModalService } from '../../modal/modal.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css']
})
export class TimetableComponent implements OnInit, OnDestroy {
  public weekdays: string[] = WEEKDAYS;
  public weekdayIndices: number[] = WEEKDAY_INDICES;
  public timetableHours: number[] = TIMETABLE_HOURS;

  public calendarNames: string[];
  public deletable = false;

  public editing: boolean;
  public editingClassName: string;
  public editingClassType: string;

  public week: number | undefined;

  faPlus = faPlus;
  faTrash = faTrash;
  faDownload = faDownload;
  faSave = faSave;

  public plan: Plan;
  public plans: PlanSummary[];

  public planSub: Subscription;
  public nameSub: Subscription;

  constructor(
    public plannerService: PlannerService,
    public exportService: ExportService,
    public modalService: ModalService,
    public toaster: ToastrService) {
      this.planSub = this.plannerService.currentPlan.asObservable().subscribe(
        (plan: Plan) => {
          this.plan = plan;
        }
      );
      this.nameSub = this.plannerService.getPlans().subscribe(
        (summaries: PlanSummary[]) => {
          this.plans = summaries;
        }
      );
  }

  ngOnInit() { }

  ngOnDestroy() {
    this.planSub.unsubscribe();
    this.nameSub.unsubscribe();
  }

  public exportCalendar(): void {
    this.exportService.exportCalendar(this.plan);
  }

  public getSessionsOnDay(dayIndex: number): TimetableSession[] {
    const sessions: TimetableSession[] = [];

    this.plan.classes.forEach((classListing: ClassListing) => {
      const selectionsForClass = this.plan.selections.get(classListing.name);

      classListing.classes.forEach((classType: ClassType) => {
        const selectionForType = selectionsForClass.get(classType.name);

        classType.streams.forEach((classStream: ClassStream, streamIndex: number) => {

          if((this.editing && classType.name === this.editingClassType && classListing.name === this.editingClassName)
              || (streamIndex === selectionForType)) {
            classStream.classes.forEach((session: ClassSession, sessionIndex: number) => {

              if(isNaN(this.week) || this.week === undefined || session.weekPattern[this.week]) {
                const day: number = session instanceof Date
                  ? (session as Date).getDay()
                  : session.day as number;

                if(day === dayIndex) {
                  sessions.push({
                    className: classListing.name,
                    classType: classType.name,
                    classStream: streamIndex,
                    classSessionIndex: sessionIndex,
                    classSession: session
                  });
                }
              }
            });
          }
        });
      });
    });

    return sessions;
  }

  public handleSessionClicked(session: TimetableSession): void {
    if(this.editing) {
      this.plan.selections.get(this.editingClassName).set(session.classType, session.classStream);
    } else {
      this.editingClassName = session.className;
      this.editingClassType = session.classType;
    }

    this.editing = !this.editing;
    this.plan.isDirty = true;
  }

  public handleSaveClicked(): void {
    this.plannerService.savePlan();
    this.toaster.success(`${this.plan.name} saved!`, '', {
      positionClass: 'toast-bottom-center',
      toastClass: 'toast successToast ngx-toastr',
      closeButton: false
    });
  }

  public handleDeleteClicked(): void {
    if (this.plan.classes.length > 0) {
      this.modalService.showConfirmationModal(
        'Confirm Delete',
        'This plan will not be recoverable after you have deleted it. A' +
        're you sure you want to delete?',
        () => this.plannerService.deletePlan() );
    } else {
      this.plannerService.deletePlan();
    }
  }

  public handleTimetableClicked(id: string): void {
    if (this.plan.isDirty) {
      this.showDiscardModal(
        () => this.plannerService.setCurrentPlan(id));
    } else {
      this.plannerService.setCurrentPlan(id);
    }
  }

  public newTimetableHandler(): void {
    if (this.plan.classes.length === 0) {
      return;
    }

    if (this.plan.isDirty) {
      this.showDiscardModal(
        () => this.plannerService.newPlan());
    } else {
      this.plannerService.newPlan();
    }
  }

  public planSaved(): boolean {
    const planIds = this.plans.map(p => p.id);
    return planIds.indexOf(this.plan.id) !== -1;
  }

  public getPlanName(planId: string): string {
    let name: string;
    if (planId === this.plan.id) {
      name = this.plan.name;
    } else {
      name = this.plans.find(p => p.id === planId).name;
    }

    return name;
  }

  public setWeek(week: number | undefined): void {
    this.week = week;
  }

  private showDiscardModal(andThen: () => void): void {
    this.modalService.showConfirmationModal(
      'Unsaved Changes',
      'You have made changes to your current timetable that ' +
      'have not been saved. Are you sure you want to load ' +
      'another timetable?',
      andThen);
  }
}
