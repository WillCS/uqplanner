import { Component, OnInit, Input } from '@angular/core';
import { CalendarService } from 'src/app/calendar/service/calendar.service';
import { ClassSession, ClassListing, ClassType, ClassStream, TimetableSession } from 'src/app/calendar/calendar';

@Component({
    selector: 'app-timetable-day',
    templateUrl: './timetable-day.component.html',
    styleUrls: ['./timetable-day.component.css'],
    providers: [CalendarService]
})
export class TimetableDayComponent implements OnInit {
    @Input()
    public dayIndex: number;

    constructor(private calendarService: CalendarService) { }

    ngOnInit() {
    }

    private getClasses() {
        let classes: TimetableSession[] = [];
        
        this.calendarService.GetClasses().forEach((classListing: ClassListing) => {
            classListing.classes.forEach((classType: ClassType) => {
                classType.streams.forEach((classStream: ClassStream, streamIndex: number) => {
                    classStream.classes.forEach((session: ClassSession, sessionIndex: number) => {
                        if(session.day == this.dayIndex) {
                            classes.push({
                                className: classListing.name,
                                classType: classType.name,
                                classStream: streamIndex,
                                classSession: sessionIndex
                            });
                        }
                    });
                });
            });
        });

        return classes;
    }

}
