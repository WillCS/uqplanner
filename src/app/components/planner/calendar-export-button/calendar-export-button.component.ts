import { Component, OnInit, Input } from '@angular/core';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import {
  ClassListing, ClassType, ClassSession
} from 'src/app/calendar/calendar';
declare const ics: any;

@Component({
  selector: 'app-calendar-export-button',
  templateUrl: './calendar-export-button.component.html',
  styleUrls: ['./calendar-export-button.component.css']
})
export class CalendarExportButtonComponent implements OnInit {

  @Input()
  public selections: Map<string, Map<string, number>>;

  @Input()
  public classList: ClassListing[] = [];

  @Input()
  public name: string;

  faDownload = faDownload;

  constructor() { }

  ngOnInit() {
  }

  public saveICal(): void {
    console.log('ical');
    const cal = ics();
    this.selections.forEach( (streams: Map<string, number>, subjectName: string) => {
      streams.forEach((id: number, streamName: string) => {
        const subject: ClassListing = this.classList.find(c => c.name === subjectName);
        const stream: ClassType = subject.classes.find(s => s.name === streamName);
        const session: ClassSession = stream.streams[id].classes[0];

        session.weekPattern.reduce((acc, val, pos): Date[] => {
          if (!val) {
            return acc;
          }

          const newDate = new Date(session.startDate);
          newDate.setDate(newDate.getDate() + 7 * pos + session.day);
          acc.push(newDate);
          return acc;
        }, []).forEach( (date: Date) => {
          const startTime = new Date(date.getTime());
          const endTime = new Date(date.getTime());

          startTime.setHours(session.startTime.hours);
          startTime.setMinutes(session.startTime.minutes);

          endTime.setHours(session.endTime.hours);
          endTime.setMinutes(session.endTime.minutes);

          cal.addEvent(
            `${subjectName} ${stream.name}${(id + 1).toString().padStart(2, '0')}`,
            streamName,
            session.location, 
            startTime,
            endTime
          );
        });
      });
    });

    cal.download(this.name ? this.name : 'timetable');

  }

}
