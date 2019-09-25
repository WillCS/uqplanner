import { Injectable } from '@angular/core';
import { ClassListing, Semester } from './calendar/calendar';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private api = 'http://192.168.0.9:2727';

  constructor(private http: HttpClient) {

  }

  public getClass(courseCode: string, year: number, semester: number): Observable<ClassListing> {
    const endpoint: string = this.endpoint('test');
    return this.http.get<string>(endpoint).pipe(map(
        (value: string) => JSON.parse(value)));
  }

  public getActiveSemesters(): Observable<Semester[]> {
    const endpoint: string = this.endpoint('currentSemesters');
    return this.http.get<string>(endpoint).pipe(map(
      (value: string) => JSON.parse(value)));
  }

  private endpoint(name: string): string {
    return `${this.api}/${name}`;
  }
}
