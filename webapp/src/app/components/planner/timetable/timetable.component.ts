import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { WEEKDAYS, WEEKDAY_INDICES, ClassListing, TimetableSession, ClassStream, ClassType, ClassSession } from 'src/app/calendar/calendar';
import { stringify } from 'querystring';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css'],
  providers: [

  ]
})
export class TimetableComponent implements OnInit {
  @Input()
  public classList: ClassListing[] = [];
  public weekdays: string[] = WEEKDAYS;
  public weekdayIndices: number[] = WEEKDAY_INDICES;

  @Output()
  public sessionClick: EventEmitter<number> = new EventEmitter<number>();

  @Input()
  public editing: boolean;
  @Input()
  public editingClassName: string;
  @Input()
  public editingClassType: string;

  @Input()
  public selections: Map<string, Map<string, number>>;

  constructor() {

  }

  ngOnInit() {

  }

  public getSessionsOnDay(dayIndex: number): TimetableSession[] {
    const sessions: TimetableSession[] = [];

    this.classList.forEach((classListing: ClassListing) => {
      const selectionsForClass = this.selections.get(classListing.name);

      classListing.classes.forEach((classType: ClassType) => {
        const selectionForType = selectionsForClass.get(classType.name);

        classType.streams.forEach((classStream: ClassStream, streamIndex: number) => {

          if((this.editing && classType.name === this.editingClassType)
              || streamIndex === selectionForType) {
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
}
