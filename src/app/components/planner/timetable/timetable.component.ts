import { Component, OnInit, OnDestroy } from "@angular/core";
import {
  WEEKDAYS,
  WEEKDAY_INDICES,
  TIMETABLE_HOURS,
  ClassListing,
  TimetableSession,
  ClassStream,
  ClassType,
  ClassSession,
} from "src/app/calendar/calendar";
import { ExportService } from "src/app/calendar/export.service";
import {
  faDownload,
  faPlus,
  faSave,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Plan, PlanSummary } from "../../../calendar/calendar";
import { Subscription } from "rxjs";
import { PlannerService } from "../../../calendar/planner.service";
import { ModalService } from "../../modal/modal.service";
import { ToastrService } from "ngx-toastr";
import { environment } from "src/environments/environment";

declare let gtag: Function;

@Component({
  selector: "app-timetable",
  templateUrl: "./timetable.component.html",
  styleUrls: ["./timetable.component.css"],
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
  public hoverStream: string;

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
    public toaster: ToastrService
  ) {
    this.planSub = this.plannerService.currentPlan
      .asObservable()
      .subscribe((plan: Plan) => {
        this.plan = plan;
      });
    this.nameSub = this.plannerService
      .getPlans()
      .subscribe((summaries: PlanSummary[]) => {
        this.plans = summaries;
      });
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

        classType.streams.forEach(
          (classStream: ClassStream, streamIndex: number) => {
            if (
              (this.editing &&
                classType.name === this.editingClassType &&
                classListing.name === this.editingClassName) ||
              selectionForType.includes(streamIndex)
            ) {
              classStream.classes.forEach(
                (session: ClassSession, sessionIndex: number) => {
                  if (
                    isNaN(this.week) ||
                    this.week === undefined ||
                    session.weekPattern[this.week]
                  ) {
                    const day: number =
                      session instanceof Date
                        ? (session as Date).getDay()
                        : (session.day as number);

                    if (day === dayIndex) {
                      sessions.push({
                        className: classListing.name,
                        classType: classType.name,
                        classStream: streamIndex,
                        classSessionIndex: sessionIndex,
                        classSession: session,
                      });
                    }
                  }
                }
              );
            }
          }
        );
      });
    });

    return sessions;
  }

  public handleSessionClicked(session: TimetableSession): void {
    const isEditingSession =
      session.className === this.editingClassName &&
      session.classType === this.editingClassType;

    if (this.editing && isEditingSession) {
      this.plannerService.setSelections(this.editingClassName, session.classType, [session.classStream]);

      if (gtag && environment.gaEventParams) {
        gtag("event", "changeSelection", environment.gaEventParams);
      }
    } else {
      this.editingClassName = session.className;
      this.editingClassType = session.classType;
    }

    this.editing = !this.editing;
    this.plan.isDirty = true;
  }

  public handleSessionEnter(session: TimetableSession): void {
    this.hoverStream = session.classSession.streamId;
  }

  public handleSessionLeave(session: TimetableSession): void {
    this.hoverStream = "";
  }

  public handleBlockClicked(): void {
    this.editing = false;
  }

  public handleSaveClicked(): void {
    if (!this.plan.isDirty) {
      return;
    }

    this.plannerService.savePlan();
    this.toaster.success(`${this.plan.name} saved to device!`, "", {
      positionClass: "toast-bottom-center",
      toastClass: "toast successToast ngx-toastr",
      closeButton: false,
    });
    if (gtag && environment.gaEventParams) {
      gtag("event", "savePlan", {
        ...environment.gaEventParams,
        event_label: this.plan.classes.map(c => c.name).join('-')
      });
    }
  }

  public handleDeleteClicked(): void {
    if (this.plan.classes.length > 0) {
      this.modalService.showConfirmationModal(
        "Confirm Delete",
        "This plan will not be recoverable after you have deleted it. A" +
        "re you sure you want to delete?",
        () => this.plannerService.deletePlan()
      );
    } else {
      this.plannerService.deletePlan();
    }
  }

  public handleTimetableClicked(id: string): void {
    if (this.plan.isDirty && !this.planIsEmpty()) {
      this.showSaveModal(() => this.setPlan(id));
    } else {
      this.setPlan(id);
    }
  }

  public setPlan(id: string) {
    this.plannerService.setCurrentPlan(id);
    if (gtag && environment.gaEventParams) {
      gtag("event", "changePlan", environment.gaEventParams);
    }
  }

  public newTimetableHandler(): void {
    if (this.plan.classes.length === 0) {
      return;
    }

    if (this.plan.isDirty) {
      this.showSaveModal(() => this.plannerService.newPlan());
    } else {
      this.plannerService.newPlan();
    }
  }

  public planSaved(): boolean {
    const planIds = this.plans.map((p) => p.id);
    return planIds.indexOf(this.plan.id) !== -1;
  }

  public getPlanName(planId: string): string {
    let name: string;
    if (planId === this.plan.id) {
      name = this.plan.name;
    } else {
      name = this.plans.find((p) => p.id === planId).name;
    }

    return name;
  }

  public setWeek(week: number | undefined): void {
    this.week = week;
  }

  private showSaveModal(andThen: () => void): void {
    this.modalService.showConfirmationModal(
      "Unsaved Changes",
      "Do you want the changes you made to be saved?",
      () => {
        this.handleSaveClicked();
        andThen();
      },
      andThen
    );
  }

  private planIsEmpty() {
    return this.plan.classes.length === 0;
  }
}
