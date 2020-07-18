import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { ClassListing, ClassType, ClassSession, Plan } from './calendar';
declare const ics: any;

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  public exportCalendar(plan: Plan): void {
    console.log(`Exporting ${name} as iCal`);

    const cal = ics();
    plan.selections.forEach((streams: Map<string, (number | number[])>, subjectName: string) => {
      streams.forEach((ids: number[], streamName: string) => {
        const subject: ClassListing = plan.classes.find(c => c.name === subjectName);
        const stream: ClassType = subject.classes.find(s => s.name === streamName);

        ids.forEach((id: number) => {
          stream.streams[id].classes.forEach(session => {
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

      });
    });

    cal.download(plan.name ? plan.name : 'timetable');
  }
}
