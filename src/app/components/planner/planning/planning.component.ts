import { Component, OnInit, OnDestroy } from "@angular/core";
import { ModalService } from "../../modal/modal.service";
import {
  faTimesCircle,
  faSearch,
  faCircleNotch,
} from "@fortawesome/free-solid-svg-icons";
import { PlannerService } from "../../../calendar/planner.service";
import {
  Plan,
  CAMPUSES,
  SEMESTER_OPTIONS,
  SemesterOption,
  DeliveryModeId,
  DELIVERY_MODES,
  DeliveryMode,
  ClassType,
  ClassStream,
  ClassListing,
} from "../../../calendar/calendar";
import { Subscription, combineLatest } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { environment } from "../../../../environments/environment";

declare let gtag: Function;

@Component({
  selector: "app-planning",
  templateUrl: "./planning.component.html",
  styleUrls: ["./planning.component.css"],
})
export class PlanningComponent implements OnInit, OnDestroy {
  public subscription: Subscription;
  public plan: Plan;
  public searches = [];

  public campus = "STLUC";
  public campuses = CAMPUSES;

  public semesterOptions = SEMESTER_OPTIONS;

  public deliveryMode: DeliveryMode;
  public deliveryOptions: DeliveryMode[] = [];

  public streamDropdown = null;

  faTimesCircle = faTimesCircle;
  faSearch = faSearch;
  faCircleNotch = faCircleNotch;

  constructor(
    public plannerService: PlannerService,
    public modalService: ModalService,
    public toaster: ToastrService
  ) {
    this.subscription = plannerService.currentPlan
      .asObservable()
      .subscribe((plan: Plan) => {
        this.plan = plan;

        // update delivery modes
        this.deliveryOptions = this.semesterOptions.find(
          i => i.year === this.plan.year && i.number === this.plan.semester
        ).deliveryModes.map(i => DELIVERY_MODES.find(j => j.id === i));

        this.deliveryMode = this.deliveryOptions[0];
        // if (!this.deliveryOptions.includes(this.deliveryMode)) {
        // }
      });

    window.onbeforeunload = (e) => {
      if (this.plan.isDirty) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave the app?";
      }
    };
  }

  ngOnInit() { }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  public handleTitleChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    const name = target.value;

    if (name === "" || name === undefined || name === null) {
      return;
    }

    this.plannerService.changeName(name);
  }

  public removeClass(className: string): void {
    this.plannerService.removeClass(className);
  }

  public onSearched(searchTerm: string): string {
    searchTerm = searchTerm.replace(" ", "").toUpperCase();

    const campus = CAMPUSES.find((c) => c.code === this.campus);
    if (!campus) {
      this.toaster.error(`Couldn't find ${this.campus}, `, "", {
        positionClass: "toast-bottom-center",
        toastClass: "toast errorToast ngx-toastr",
        closeButton: false,
      });
      return;
    }

    const status = this.plannerService.addClass(searchTerm, campus, this.deliveryMode);
    this.searches.push(status);

    status.subscribe(
      (next) => { },
      (error) => {
        this.searches.splice(this.searches.find((s) => s === status));
        this.toaster.error(`Couldn't find ${searchTerm}. Check campus and delivery mode!`, "", {
          positionClass: "toast-bottom-center",
          toastClass: "toast errorToast ngx-toastr",
          closeButton: false,
        });
      },
      () => {
        this.searches.splice(this.searches.find((s) => s === status));

        if (gtag && environment.gaEventParams) {
          gtag("event", "addClass", {
            ...environment.gaEventParams,
            event_label: searchTerm,
          });

          gtag("event", "addClassWithDeliveryMode", {
            ...environment.gaEventParams,
            event_label: this.deliveryMode.id,
          });
        }
      }
    );

    return "";
  }

  public onClassCloseClicked(className: string): void {
    this.removeClass(className);
    this.plan.isDirty = true;
  }

  public searching(): boolean {
    return this.searches.length !== 0;
  }

  public setCampus(event: Event) {
    const target = event.target as HTMLInputElement;
    this.campus = target.value;
  }

  public setDeliveryMode(event: Event) {
    const target = event.target as HTMLInputElement;
    this.deliveryMode = DELIVERY_MODES.find(i => i.id === target.value);
  }

  public setSemesterHandler(event: Event) {
    const target = event.target as HTMLInputElement;
    const name: string = target.value;

    const currentSemester: SemesterOption = SEMESTER_OPTIONS.find(
      (i) => i.year === this.plan.year && i.number === this.plan.semester
    );
    const semester: SemesterOption = SEMESTER_OPTIONS.find(
      (i) => i.name === name
    );

    if (
      semester.year === this.plan.year &&
      semester.number === this.plan.semester
    ) {
      return;
    }

    const setSemester = () => {
      if (this.plan.wasEmpty) {
        // don't create a new plan if this plan
        // had no classes the last time it was saved
        this.plannerService.setSemester(semester.year, semester.number);
      } else {
        this.plannerService.newPlan(semester.year, semester.number);
      }
    };

    const confirmIfSemester2 = () => {
      if (semester.number === 2) {
        this.showSemester2DraftModal(
          () => setSemester(),
          () => (target.value = currentSemester.name)
        );
      } else {
        setSemester();
      }
    };

    if (this.plan.isDirty && !this.isEmpty()) {
      this.showDiscardModal(
        () => setSemester(),
        () => (target.value = currentSemester.name)
      );
    } else {
      // confirmIfSemester2();
      setSemester();
    }
  }

  public isEmpty(): boolean {
    return this.plan.classes.length === 0;
  }

  private showDiscardModal(andThen: () => void, onReject: () => void): void {
    this.modalService.showConfirmationModal(
      "Unsaved Changes",
      "You have made changes to your current timetable that " +
      "have not been saved. Are you sure you want to load " +
      "another timetable?",
      andThen,
      onReject
    );
  }

  private showSemester2DraftModal(
    yesAction: () => void,
    noAction: () => void
  ): void {
    this.modalService.showConfirmationModal(
      "Warning!",
      "Semester 2 class times are still in draft stage at the moment, and might change later without any notice.",
      yesAction,
      noAction,
      "Proceed",
      "Cancel"
    );
  }

  public classTypeDeselected(classListing: ClassListing, classType: ClassType) {
    return this.plan.selections.get(classListing.name).get(classType.name).length === 0;
  }

  public onSidebarClassClicked(classType: ClassType) {
    this.streamDropdown = classType.id;
  }

  public onDropdownScreenClicked() {
    this.streamDropdown = '';
  }

  public isStreamSelected(selectedClass: ClassListing, classType: ClassType, streamIndex: number) {
    const currentSelection = this.plan.selections.get(selectedClass.name).get(classType.name);

    return currentSelection.includes(streamIndex);
  }

  public onStreamClicked(selectedClass: ClassListing, classType: ClassType, streamIndex: number) {
    // what is already set?
    let newSelection = [...this.plan.selections.get(selectedClass.name).get(classType.name)];

    // modify selection
    if (newSelection.includes(streamIndex)) {
      // remove index
      newSelection = newSelection.filter(i => i !== streamIndex);
    } else {
      // add index
      newSelection.push(streamIndex);
    }

    this.plannerService.setSelections(selectedClass.name, classType.name, newSelection);
  }
}
