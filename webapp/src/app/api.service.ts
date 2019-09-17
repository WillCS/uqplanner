import { Injectable } from '@angular/core';
import { ClassListing } from './calendar/calendar';
import { HttpClient, HttpResponse } from '@angular/common/http'
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private api: string = 'http://localhost:2727'

  constructor(private http: HttpClient) {}

  public getClass(courseCode: string): Observable<ClassListing> {
    let endpoint: string = this.endpoint('test');
    return this.http.get<string>(endpoint).pipe(map(
        (value: string) => JSON.parse(value)));
  }

  private endpoint(name: string): string {
    return `${this.api}/${name}`
  }
}
