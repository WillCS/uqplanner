import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from 'src/app/api.service';

@Component({
  selector: 'app-class-search',
  templateUrl: './class-search.component.html',
  styleUrls: ['./class-search.component.css']
})
export class ClassSearchComponent implements OnInit {
  @Output()
  public search: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('courseCode', { read: ElementRef, static: false })
  private input: ElementRef;

  private isExpanded = false;
  private isReady    = false;

  private searchText = '';

  constructor() {

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
      this.executeSearch(this.searchText);
    }
  }

  private handleEnterPress(courseCode: string): void {
    if(this.isReady) {
      this.executeSearch(courseCode);
    }
  }

  private handleEscapePress(): void {
    if(this.isExpanded) {
      this.closeTextInput();
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

  private executeSearch(courseCode: string): void {
    this.search.emit(courseCode);
  }

}
