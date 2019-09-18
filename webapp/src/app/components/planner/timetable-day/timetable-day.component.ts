import { Component, OnInit, Input } from '@angular/core';
import { CalendarService } from 'src/app/calendar/service/calendar.service';
import { ClassSession, ClassListing, ClassType, ClassStream, TimetableSession, DAY_LENGTH, DAY_START_TIME, DAY_END_TIME } from 'src/app/calendar/calendar';

@Component({
    selector: 'app-timetable-day',
    templateUrl: './timetable-day.component.html',
    styleUrls: ['./timetable-day.component.css'],
    providers: [
        CalendarService
    ]
})
export class TimetableDayComponent implements OnInit {
    @Input()
    public dayIndex: number;

    constructor(private calendar: CalendarService) { }

    ngOnInit() {
    }

    private getClasses(): TimetableSession[] {
        let classes: TimetableSession[] = [];

        this.calendar.getClasses().forEach((classListing: ClassListing) => {
            classListing.classes.forEach((classType: ClassType) => {
                classType.streams.forEach((classStream: ClassStream, streamIndex: number) => {
                    classStream.classes.forEach((session: ClassSession, sessionIndex: number) => {
                        let day: number = session instanceof Date
                                ? (session as Date).getDay()
                                : session.day as number;

                        if(day == this.dayIndex) {
                            classes.push({
                                className: classListing.name,
                                classType: classType.name,
                                classStream: streamIndex,
                                classSessionIndex: sessionIndex,
                                classSession: session
                            });
                        }
                    });
                });
            });
        });

        return classes;
    }

    private getSessionTopPercentage(session: ClassSession): number {
        let relative_time: number = session.startTime.hours
                - DAY_START_TIME.hours;
        return 100 * (relative_time / DAY_LENGTH);
    }

    private getSessionHeightPercentage(session: ClassSession): number {
        let length: number = session.endTime.hours - session.startTime.hours;
        return 100 * (length / DAY_LENGTH);
    }
}
