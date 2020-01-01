import { Injectable } from '@angular/core';
import { Plans } from './calendar';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  public static readonly TIMETABLE_STORAGE_IDENTIFIER: string = 'timetableData';

  constructor() {
    // create an empty store if nothing exists
    if (!this.storeExists()) {
      this.save({});
    }
  }

  public storeExists(): boolean {
    return localStorage.hasOwnProperty(StorageService.TIMETABLE_STORAGE_IDENTIFIER);
  }

  public deletePlan(name: string): void {
    const timetables = this.loadData();

    if (!timetables) {
      return;
    }

    timetables.delete(name);
    const dataString = JSON.stringify(timetables, this.replacer);
    localStorage.setItem(StorageService.TIMETABLE_STORAGE_IDENTIFIER, dataString);
  }

  public getPlanNames(): string[] {
    if (this.storeExists()) {
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

  public getPlan(name: string) {
    if (this.storeExists()) {
      const timetables = this.loadData();
      return timetables.get(name);
    }

    return undefined;
  }

  public savePlan(name: string, calendarData): void {
    let timetables = this.loadData();

    if (!timetables) {
      timetables = new Map<string, any>();
    }

    timetables.set(name, calendarData);
    const dataString = JSON.stringify(timetables, this.replacer);
    localStorage.setItem(StorageService.TIMETABLE_STORAGE_IDENTIFIER, dataString);
  }

  public save(plans: Plans): void {
    const dataString = JSON.stringify(plans, this.replacer);
    localStorage.setItem(StorageService.TIMETABLE_STORAGE_IDENTIFIER, dataString);
  }

  public get(): Plans {
    return this.loadData();
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
