import { Injectable } from '@angular/core';
import { ClassListing, ClassType, ClassStream, ClassSession, Semester, WEEKDAYS } from './calendar/calendar';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private api = 'http://localhost:8010/proxy/even/rest/timetable';

  constructor(private http: HttpClient) {

  }

  public getClass(courseCode: string, year: number, semester: number): Observable<ClassListing> {
    const endpoint: string = this.endpoint('subjects');

    return this.http.post<JSON>(
      endpoint,
      `search-term=${courseCode}&semester=ALL&campus=ALL&faculty=ALL&type=ALL&days=1&days=2&days=3&days=4&days=5&days=6&days=0&start-time=00%3A00&end-time=23%3A00`,
      {
        headers: {
          "accept": "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest"
        }
      }).pipe(
        map((classObj: JSON) => this.reformatClass(courseCode, classObj))
      );
  }

  public getActiveSemesters(): Observable<Semester[]> {
    const endpoint: string = this.endpoint('currentSemesters');
    return this.http.get<string>(endpoint).pipe(map(
      (value: string) => JSON.parse(value)));
  }

  private endpoint(name: string): string {
    return `${this.api}/${name}`;
  }

  private reformatClass(courseCode: string, obj: JSON): ClassListing {
    console.log(obj)
    let name = Object.keys(obj)
      .filter(key => !key.includes("_EX"))
      .find(key => key.split('_')[0] == courseCode.toUpperCase());
    
    let activities = Object.values(obj[name].activities).reduce((acc: Object, val: Object) => {
      acc.hasOwnProperty(val['activity_group_code']) 
        ? acc[val['activity_group_code']].push(val) 
        : acc[val['activity_group_code']] = [val];
      return acc;
    }, {});

    let classes = Object.values(activities).map((act: any): ClassType => {
      return {
        name: act[0]['activity_group_code'].split("_")[0],
        streams: [{
          classes: act.map((s: Object): ClassSession => ({
            day: WEEKDAYS.findIndex(d => d.startsWith(s['day_of_week'].toUpperCase())),
            startTime: {
              hours: parseInt(s['start_time'].split(":")[0]), 
              minutes: parseInt(s['start_time'].split(":")[1])
            },
            endTime: {
              hours: parseInt(s['start_time'].split(":")[0]) + parseInt(s['duration']) / 60, 
              minutes: parseInt(s['start_time'].split(":")[1]) + parseInt(s['duration']) % 60
            },
            location: s['location'].split(" ")[0]
          }))
        }]
      }
    });

    let classList = {
      name: name.split("_")[0],
      classes: classes
    };

    console.log(classList);

    return classList;
  }
}


