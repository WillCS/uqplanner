import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ClassListing } from 'src/app/calendar/calendar';
import { CalendarService } from 'src/app/calendar/service/calendar.service';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css'],
  providers: [
    CalendarService
  ]
})
export class PlanningComponent implements OnInit {
  constructor(private calendar: CalendarService) {

  }

  ngOnInit() {

  }

  private onClassAdded(newClass: ClassListing): void {
    this.calendar.addClass(newClass);
  }

  private onClassCloseClicked(className: string): void {
    this.calendar.removeClass(className);
  }
}
