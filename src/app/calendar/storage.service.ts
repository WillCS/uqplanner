import { Injectable } from '@angular/core';
import { Plans } from './calendar';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  public static readonly TIMETABLE_STORAGE_IDENTIFIER: string = 'timetableData';
  public static readonly THEME_STORAGE_IDENTIFIER: string= 'themeName';

  constructor() {
    // create an empty store if nothing exists
    if (!this.storeExists()) {
      this.save({});
      this.saveTheme('classic');
    }
  }

  public storeExists(): boolean {
    return localStorage.hasOwnProperty(StorageService.TIMETABLE_STORAGE_IDENTIFIER);
  }

  public save(plans: Plans): void {
    const dataString = JSON.stringify(plans, this.replacer);
    localStorage.setItem(StorageService.TIMETABLE_STORAGE_IDENTIFIER, dataString);
  }

  public get(): Plans {
    return this.loadData();
  }

  public saveTheme(name: string): void {
    localStorage.setItem(StorageService.THEME_STORAGE_IDENTIFIER, name);
  }

  public getTheme(): string {
    if (!localStorage.hasOwnProperty(StorageService.THEME_STORAGE_IDENTIFIER)) {
      return '';
    }

    return localStorage.getItem(StorageService.THEME_STORAGE_IDENTIFIER);
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
