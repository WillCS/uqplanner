import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalService } from '../../modal/modal.service';
import { faTimesCircle, faSearch, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { PlannerService } from '../../../calendar/planner.service';
import { Plan } from '../../../calendar/calendar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css']
})
export class PlanningComponent implements OnInit, OnDestroy {
  public subscription: Subscription;
  public plan: Plan;
  public searching = false;

  faTimesCircle = faTimesCircle;
  faSearch = faSearch;
  faCircleNotch = faCircleNotch;

  constructor(
      public plannerService: PlannerService,
      public modalService: ModalService) {
    this.subscription = plannerService.currentPlan.asObservable().subscribe(
      (plan: Plan) => {
        this.plan = plan;
    });

    window.onbeforeunload = (e) => {
      if (this.plan.isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave the app?'
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

    if (name === '' || name === undefined || name === null) {
      return;
    }

    this.plannerService.changeName(name);
  }

  public removeClass(className: string): void {
    this.plannerService.removeClass(className);
  }

  public onSearched(searchTerm: string): string {
    if (this.searching) {
      return searchTerm;
    }

    this.searching = true;
    this.plannerService.addClass(searchTerm);
    return '';
  }

  public onClassCloseClicked(className: string): void {
    this.removeClass(className);
    this.plan.isDirty = true;
  }
}
