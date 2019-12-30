import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { ClassListing, ClassType, ClassSession } from './calendar';
declare const ics: any;

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor(
    public storage: StorageService
  ) { }

  public exportCalendar(name: string): void {
    console.log(`Exporting ${name} as iCal`);
    const calData = this.storage.getCalendarByName(name);
    console.log(calData);

    const cal = ics();
    calData.selections.forEach((streams: Map<string, number>, subjectName: string) => {
      streams.forEach((id: number, streamName: string) => {
        const subject: ClassListing = calData.classList.find(c => c.name === subjectName);
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
        }, []).forEach((date: Date) => {
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

    cal.download(calData.name ? calData.name : 'timetable');
  }
}
