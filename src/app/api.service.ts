import { Injectable } from "@angular/core";
import {
  ClassListing,
  ClassType,
  ClassStream,
  ClassSession,
  Semester,
  WEEKDAYS,
  Campus,
  DeliveryMode,
  CAMPUSES,
  DELIVERY_MODES,
} from "./calendar/calendar";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "../environments/environment";
import { isDevMode } from "@angular/core";
import { APIActivity, APIClass } from "./api";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private proxy = environment.proxyAddress;

  constructor(private http: HttpClient) { }

  public getClass(
    courseCode: string,
    campus?: Campus,
    deliveryMode?: DeliveryMode,
    year?: number,
    semester?: 1 | 2 | 3
  ): Observable<ClassListing | Error> {
    const endpoint: string = this.endpoint("subjects");
    const campusCode = campus ? campus.code : "ALL";
    const semesterCode = semester ? `S${semester}` : "ALL";

    return this.http
      .post<string>(
        endpoint,
        `search-term=${courseCode}&semester=${semesterCode}&campus=${campusCode}&faculty=ALL&type=ALL` +
        "&days=1&days=2&days=3&days=4&days=5&days=6&days=0&" +
        "start-time=00%3A00&end-time=23%3A00",
        {
          headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "x-requested-with": "XMLHttpRequest",
          },
        }
      )
      .pipe(
        map((classObj: any) => {
          isDevMode() && console.log(classObj);
          if (Object.keys(classObj).length === 0) {
            throw new Error("No matching courses found");
          }

          let classListing: ClassListing;
          try {
            classListing = this.reformatClass(courseCode, classObj, deliveryMode);
          } catch (error) {
            throw new Error(error.message);
          }
          return classListing;
        })
      );
  }

  public getActiveSemesters(): Observable<Semester[]> {
    const endpoint: string = this.endpoint("currentSemesters");
    return this.http
      .get<string>(endpoint)
      .pipe(map((value: string) => JSON.parse(value)));
  }

  private endpoint(name: string): string {
    return `${this.proxy}?/${name}`;
  }

  private reformatClass(courseCode: string, apiObject: object, deliveryMode: DeliveryMode): ClassListing {
    // find course key within returned list
    const name = Object.keys(apiObject)
      .filter((key) => key.includes(`_${deliveryMode.id}`))
      .find((key) => key.split("_")[0].toUpperCase() === courseCode);

    if (!name) {
      throw new Error("Course not found");
    }

    const campus = CAMPUSES.find(c => c.code === apiObject[name].campus);

    // group activities by class type
    const subject: APIClass = apiObject[name];
    const activities: { [key: string]: APIActivity[] } = Object.keys(
      subject.activities
    ).reduce((acc: object, key: string) => {
      const val = {
        streamId: key.split("-")[0],
        ...subject.activities[key],
      };

      acc.hasOwnProperty(val.activity_group_code)
        ? acc[val.activity_group_code].push(val)
        : (acc[val.activity_group_code] = [val]);
      return acc;
    }, {});

    // map activity groups to ClassType[], group streams
    const classes: ClassType[] = Object.values(activities).map(
      (act: APIActivity[]): ClassType => {
        return {
          name: act[0].activity_group_code,
          streams: act.reduce(
            (acc: ClassStream[], apiActivity: APIActivity): ClassStream[] => {
              const session = this.apiActivityToClassSession(apiActivity);
              const streamIdx = acc.findIndex(
                (stream: ClassStream) =>
                  stream.streamId === apiActivity.streamId
              );

              if (streamIdx !== -1) {
                acc[streamIdx].classes.push(session);
              } else {
                acc.push({
                  streamId: apiActivity.streamId,
                  classes: [session],
                });
              }
              return acc;
            },
            []
          ),
        };
      }
    );

    // create ClassListing with classes
    const classList: ClassListing = {
      name: name.split("_")[0],
      description: subject.description,
      campus,
      deliveryMode,
      classes,
    };

    return classList;
  }

  private apiActivityToClassSession(apiActivity: APIActivity): ClassSession {
    const s = apiActivity;

    // HACK: fix sem 2 week_pattern errors that might be in the data
    let week_pattern = s.week_pattern;
    if (s.week_pattern.length >= 45 && s.semester.includes("2")) {
      week_pattern = week_pattern
        .substring(29, 46)
        .padStart(46, "0")
        .padEnd(65, "0");
    }

    return {
      streamId: apiActivity.streamId,
      day: WEEKDAYS.findIndex((d) => d.startsWith(s.day_of_week.toUpperCase())),
      startTime: {
        hours: parseInt(s.start_time.split(":")[0], 10),
        minutes: parseInt(s.start_time.split(":")[1], 10),
      },
      endTime: {
        hours:
          parseInt(s.start_time.split(":")[0], 10) +
          parseInt(s.duration, 10) / 60,
        minutes:
          parseInt(s.start_time.split(":")[1], 10) +
          (parseInt(s.duration, 10) % 60),
      },
      location: s.location.split(" ")[0],
      startDate: new Date(
        parseInt(s.start_date.split("/")[2], 10),
        parseInt(s.start_date.split("/")[1], 10) - 1,
        parseInt(s.start_date.split("/")[0], 10)
      ),
      weekPattern: week_pattern
        .split("")
        .map((i: any) => parseInt(i, 10) === 1),
    };
  }
}
