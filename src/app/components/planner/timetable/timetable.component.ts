import { Component, OnInit, Input, EventEmitter, Output, OnDestroy } from '@angular/core';
import {
  WEEKDAYS, WEEKDAY_INDICES, TIMETABLE_HOURS, ClassListing,
  TimetableSession, ClassStream, ClassType, ClassSession
} from 'src/app/calendar/calendar';
import { StorageService } from 'src/app/calendar/storage.service';
import { ExportService } from 'src/app/calendar/export.service';
import { faDownload, faPlus, faSave, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Plan, PlanSummary } from '../../../calendar/calendar';
import { Subscription } from 'rxjs';
import { PlannerService } from '../../../calendar/planner.service';

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
    public exportService: ExportService) {
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
    this.exportService.exportCalendar(this.name);
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
  }

  public handleDeleteClicked(): void {
    this.plannerService.deletePlan();
  }

  public handleTimetableClicked(id: string): void {
    this.plannerService.setCurrentPlan(id);
  }

  public newTimetableHandler(): void {
    this.plannerService.newPlan();
  }
}
