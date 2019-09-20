import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ClassSession, TimetableSession, DAY_START_TIME, ClassStream, DAY_LENGTH_MINUTES, TIMETABLE_HOURS, DAY_LENGTH_HOURS } from 'src/app/calendar/calendar';

@Component({
  selector: 'app-timetable-day',
  templateUrl: './timetable-day.component.html',
  styleUrls: ['./timetable-day.component.css'],
})
export class TimetableDayComponent implements OnInit {
  @Input()
  public sessionList: TimetableSession[];
  @Output()
  public sessionClick: EventEmitter<TimetableSession> = new EventEmitter<TimetableSession>();

  @Input()
  public editing: boolean;
  @Input()
  public editingClassName: string;
  @Input()
  public editingClassType: string;
  @Input()
  public selections: Map<string, Map<string, ClassStream>>;

  private sessionBlockHeight = 100 * (50 / DAY_LENGTH_MINUTES);
  private sessionStartTimes = TIMETABLE_HOURS;

  constructor() {

  }

  ngOnInit() {

  }

  public sessionBlockTopOffset(block: number): number {
    return 100 * ((block - DAY_START_TIME.hours) / DAY_LENGTH_HOURS);
  }

  public handleClicked(session: TimetableSession) {
    if(this.displaySessionAsEditing(session) || !this.editing) {
      this.sessionClick.emit(session);
    }
  }

  public displaySessionAsEditing(session: TimetableSession): boolean {
    return this.editing
        && this.editingClassName === session.className
        && this.editingClassType === session.classType;
  }

  public displaySessionAsNotEditing(session: TimetableSession): boolean {
    return this.editing && !this.displaySessionAsEditing(session);
  }

  public getSessionTopPercentage(session: ClassSession): number {
    const relativeTime: number = session.startTime.hours * 60 + session.startTime.minutes
      - (DAY_START_TIME.hours * 60 + DAY_START_TIME.minutes);
    return 100 * (relativeTime / (DAY_LENGTH_MINUTES));
  }

  public getSessionHeightPercentage(session: ClassSession): number {
    const length: number = (session.endTime.hours * 60 + session.endTime.minutes)
      - (session.startTime.hours * 60 + session.startTime.minutes);
    return 100 * (length / DAY_LENGTH_MINUTES);
  }
}
