import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {
  ClassSession, TimetableSession, DAY_START_TIME, ClassStream,
  DAY_LENGTH_MINUTES, TIMETABLE_HOURS, DAY_LENGTH_HOURS, getEarlierSession,
  doSessionsClash, startTimeToMinutes, endTimeToMinutes
} from 'src/app/calendar/calendar';

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
  @Output()
  public sessionEnter: EventEmitter<TimetableSession> = new EventEmitter<TimetableSession>();
  @Output()
  public sessionLeave: EventEmitter<TimetableSession> = new EventEmitter<TimetableSession>();

  @Input()
  public editing: boolean;
  @Input()
  public editingClassName: string;
  @Input()
  public editingClassType: string;
  @Input()
  public focusedSession: TimetableSession;
  @Input()
  public selections: Map<string, Map<string, ClassStream>>;

  public sessionBlockHeight = 100 * (50 / DAY_LENGTH_MINUTES);
  public sessionMarginHeight = 100 * (10 / DAY_LENGTH_MINUTES);
  public sessionStartTimes = TIMETABLE_HOURS;

  constructor() {

  }

  ngOnInit() {

  }

  public getClashes(session: TimetableSession): TimetableSession[] {
    return this.sessionList.filter(
      (sessionFromList: TimetableSession) => doSessionsClash(session, sessionFromList)
    );
  }

  public isSessionClashing(session: TimetableSession): boolean {
    return this.getClashChain(session).length > 1;
  }

  public getClashChain(session: TimetableSession): TimetableSession[] {
    const clashes = this.getClashes(session);

    if(clashes.length === 1) {
      return clashes;
    }

    const clashChain = [];

    clashes.forEach(
      (clashingSession: TimetableSession) => {
        const metaClashes = this.getClashes(clashingSession);

        if(metaClashes.length === 1) {
          return;
        } else {
          metaClashes.forEach(
            (metaClash: TimetableSession) => {
              if(!clashChain.includes(metaClash)) {
                clashChain.push(metaClash);
              }
            });
        }
      });

    return clashChain;
  }

  public getSessionClashStyling(session: TimetableSession): {} {
    const clashes = this.getClashChain(session);

    if(clashes.length === 1) {
      return {};
    }

    const sortedClashes = clashes.sort(
      (s1: TimetableSession, s2: TimetableSession): number => {
        const startComparison = startTimeToMinutes(s1) - startTimeToMinutes(s2);

        if(startComparison === 0) {
          return endTimeToMinutes(s1) - endTimeToMinutes(s2);
        } else {
          return startComparison;
        }
      });

    const width = 100 / sortedClashes.length;
    const index = sortedClashes.indexOf(session);

    return {
      'left.%': width * index,
      'width.%': index === sortedClashes.length - 1 ? width : width * 0.9
    };
  }

  public isSessionFocused(session: TimetableSession): boolean {
    if(this.focusedSession) {
      return this.focusedSession.className === session.className
        && this.focusedSession.classType === session.classType
        && this.focusedSession.classStream === session.classStream;
    }

    return false;
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
