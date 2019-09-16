import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ClassListing } from 'src/app/calendar/calendar';
import { ApiService } from 'src/app/api.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-class-list',
  templateUrl: './class-list.component.html',
  styleUrls: ['./class-list.component.css']
})
export class ClassListComponent implements OnInit {
  @Output()
  public classAdded: EventEmitter<ClassListing> = new EventEmitter<ClassListing>();

  @Output()
  public classRemoved: EventEmitter<ClassListing> = new EventEmitter<ClassListing>();

  private classesListed: ClassListing[] = []

  constructor(private api: ApiService) {
    
  }

  ngOnInit() {

  }

  private addClass(courseCode: string): void {
    if(this.hasClass(courseCode)) {
      return;
    }

    let response: Observable<ClassListing> = this.api.getClass(courseCode);

    response.subscribe((newClass: ClassListing) => {
      this.classesListed.push(newClass);
      this.classAdded.emit(newClass);
    });
  }

  private removeClass(courseCode: string): void {
    if(!this.hasClass(courseCode)) {
      return;
    }

    // TODO emit the event
    this.classesListed.filter((removalCandidate: ClassListing) => {
      return !(removalCandidate.name === courseCode);
    })
  }

  private hasClass(courseCode: string): boolean {
    return this.classesListed.some((listing: ClassListing) => {
      return listing.name === courseCode
    });
  }

}
