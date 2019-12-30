import { Injectable } from '@angular/core';
import { stringify } from 'querystring';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  public static readonly TIMETABLE_STORAGE_IDENTIFIER: string = 'timetableData';

  constructor() { }

  public doTimetablesExist(): boolean {
    return localStorage.hasOwnProperty(StorageService.TIMETABLE_STORAGE_IDENTIFIER);
  }

  public deleteCalendar(name: string): void {
    const timetables = this.loadData();

    if (!timetables) {
      return;
    }

    timetables.delete(name);
    const dataString = JSON.stringify(timetables, this.replacer);
    localStorage.setItem(StorageService.TIMETABLE_STORAGE_IDENTIFIER, dataString);
  }

  public getSavedCalendarNames(): string[] {
    if (this.doTimetablesExist()) {
      const keys = this.loadData().keys() as Iterator<string>;
      const names: string[] = [];

      while(true) {
        const name = keys.next();
        if(name.done) {
          break;
        } else {
          names.push(name.value);
        }
      }

      return names;
    }

    return [];
  }

  public getCalendarByName(name: string) {
    if (this.doTimetablesExist()) {
      const timetables = this.loadData();
      return timetables.get(name);
    }

    return undefined;
  }

  public saveCalendar(name: string, calendarData): void {
    let timetables = this.loadData();

    if (!timetables) {
      timetables = new Map<string, any>();
    }

    timetables.set(name, calendarData);
    const dataString = JSON.stringify(timetables, this.replacer);
    localStorage.setItem(StorageService.TIMETABLE_STORAGE_IDENTIFIER, dataString);
  }

  private replacer(key, value) {
    const originalObject = this[key];
    if(originalObject instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(originalObject.entries()), // or with spread: value: [...originalObject]
      };
    } else {
      return value;
    }
  }

  private reviver(key, value) {
    if (typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }

    return value;
  }

  private loadDataString(): string {
    return localStorage.getItem(StorageService.TIMETABLE_STORAGE_IDENTIFIER);
  }

  private loadData() {
    return JSON.parse(this.loadDataString(), this.reviver);
  }
}
