import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ClassListing } from 'src/app/calendar/calendar';
import { ApiService } from 'src/app/api.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-class-list',
  templateUrl: './class-list.component.html',
  styleUrls: ['./class-list.component.css'],
  providers: [
    ApiService
  ]
})
export class ClassListComponent implements OnInit {
  @Output()
  public classAdded: EventEmitter<ClassListing> = new EventEmitter<ClassListing>();

  @Output()
  public classRemoved: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('courseCode', { read: ElementRef, static: false })
  private input: ElementRef;

  private classesListed: string[] = [];

  private isExpanded: boolean = false;
  private isReady: boolean    = false;

  private searchText: string = '';

  constructor(private api: ApiService) {
    
  }

  ngOnInit() {

  }

  private handleClick(): void {
    if(!this.isReady) {
      this.isExpanded = !this.isExpanded;

      if(this.isExpanded) {
        this.input.nativeElement.focus();
      } else {
        this.input.nativeElement.blur();
      }
    } else {
      this.addClass(this.searchText);
    }
  }

  private handleEnterPress(courseCode: string): void {
    if(this.isReady) {
      this.addClass(courseCode)
    }
  }

  private handleTextChange(courseCode: string): void {
    if(!(courseCode == null || courseCode === '')) {
      this.isReady = true;
    } else {
      this.isReady = false;
    }
  }

  private addClass(courseCode: string): void {
    if(this.hasClass(courseCode)) {
      return;
    }

    this.api.getClass(courseCode).subscribe((newClass: ClassListing) => {
      this.classesListed.push(newClass.name);
      this.classAdded.emit(newClass);
    });
  }

  private removeClass(courseCode: string): void {
    if(!this.hasClass(courseCode)) {
      return;
    }

    this.classRemoved.emit(courseCode)
    this.classesListed = this.classesListed.filter((removalCandidate: string) => {
      return !(removalCandidate=== courseCode);
    });
  }

  private hasClass(courseCode: string): boolean {
    return this.classesListed.some((listing: string) => {
      return listing === courseCode;
    });
  }
}
