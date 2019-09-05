import { Component, OnInit, Input } from '@angular/core';
import { ClassSession, TimetableSession, ClassListing, ClassType } from 'src/app/calendar/calendar';
import { CalendarService } from 'src/app/calendar/service/calendar.service';

@Component({
    selector: 'app-scheduled-class',
    templateUrl: './scheduled-class.component.html',
    styleUrls: ['./scheduled-class.component.css'],
    providers: [CalendarService]
})
export class ScheduledClassComponent implements OnInit {
    @Input()
    private session: TimetableSession;

    constructor(private calendarService: CalendarService) { }

    ngOnInit() {

    }

    private getClassSession(): ClassSession {
        return this.calendarService.GetClasses().find((val: ClassListing) => {
            return val.name == this.session.className;
        }).classes.find((val: ClassType) => {
            return val.name == this.session.classType;
        }).streams[this.session.classStream][this.session.classSession];
    } 
}
