import { Component, OnInit } from '@angular/core';
import { PlanningService } from '../planning.service';
import { CalendarService } from 'src/app/calendar/service/calendar.service';
import { WEEKDAYS, WEEKDAY_INDICES } from 'src/app/calendar/calendar';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css'],
  providers: [PlanningService, CalendarService]
})
export class TimetableComponent implements OnInit {
  private weekdays: string[] = WEEKDAYS;
  private weekdayIndices: number[] = WEEKDAY_INDICES;

  constructor(private planningService: PlanningService, private calendarService: CalendarService) { }

  ngOnInit() {
  }

}
