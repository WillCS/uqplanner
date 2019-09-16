import { Injectable } from '@angular/core';
import { ClassListing } from './calendar/calendar';
import { HttpClient } from '@angular/common/http'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private api: string = 'localhost:2727'

  constructor(private http: HttpClient) {}

  public getClass(courseCode: string): void {//ClassListing[] {
    let endpoint: string = this.endpoint('test');
    this.http.get(endpoint).subscribe((data) => {
      console.log(data);
    })
  }

  private endpoint(name: string): string {
    return `${this.api}/${name}`
  }
}
