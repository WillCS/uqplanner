import { Injectable } from '@angular/core';
import { ClassListing } from '../calendar';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private _year: number;

  private _semeter: number;

  private classes: ClassListing[] = [];

  public get year(): number {
    return this._year;
  }

  public set year(value: number) {
    this._year = value;
  }

  public get semester(): number {
    return this._semeter;
  }

  public set semester(value: number) {
    this._semeter = value;
  }

  constructor() {

  }

  public getClasses(): ClassListing[] {
    return this.classes;
  }

  public addClass(newClass: ClassListing): void {
    if (!this.classes.some(c => c.name == newClass.name)) {
      this.classes.push(newClass);
    }
  }

  public removeClass(className: string): void {
    this.classes = this.classes.filter(c => className !== c.name);
  }
}
