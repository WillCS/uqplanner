import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ClassListing } from 'src/app/calendar/calendar';
import { ApiService } from 'src/app/api.service';
import { CalendarService } from 'src/app/calendar/service/calendar.service';

@Component({
  selector: 'app-class-search',
  templateUrl: './class-search.component.html',
  styleUrls: ['./class-search.component.css'],
  providers: [
    ApiService,
    CalendarService
  ]
})
export class ClassSearchComponent implements OnInit {
  @Output()
  public classAdded: EventEmitter<ClassListing> = new EventEmitter<ClassListing>();

  @ViewChild('courseCode', { read: ElementRef, static: false })
  private input: ElementRef;

  private isExpanded: boolean = false;
  private isReady: boolean    = false;

  private searchText: string = '';

  constructor(private api: ApiService, private calendar: CalendarService) {
    
  }

  ngOnInit() {

  }

  private closeTextInput(): void {
    this.isExpanded = false;
    this.input.nativeElement.disabled = true;
    this.input.nativeElement.blur();
    this.isReady = false;
  }

  private openTextInput(): void {
    this.isExpanded = true;
    this.input.nativeElement.disabled = false;
    this.input.nativeElement.focus();
    this.handleTextChange(this.input.nativeElement.value);
  }

  private handleClick(): void {
    if(!this.isReady) {
      if(this.isExpanded) {
        this.closeTextInput();
      } else {
        this.openTextInput();
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

  private handleEscapePress(): void {
    if(this.isExpanded) {
      this.closeTextInput()
    }
  }

  private handleTextChange(courseCode: string): void {
    if(!this.isExpanded) {
      this.isReady = false;
    } else if(!(courseCode == null || courseCode === '')) {
      this.isReady = true;
    } else {
      this.isReady = false;
    }
  }

  private addClass(courseCode: string): void {
    let year: number = this.calendar.year;
    let semester: number = this.calendar.semester;

    this.api.getClass(courseCode, year, semester).subscribe(
      (newClass: ClassListing) => {
        this.classAdded.emit(newClass);
      });
  }
}
