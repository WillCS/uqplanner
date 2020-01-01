import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import {
  WEEKDAYS, WEEKDAY_INDICES, TIMETABLE_HOURS, ClassListing,
  TimetableSession, ClassStream, ClassType, ClassSession
} from 'src/app/calendar/calendar';
import { StorageService } from 'src/app/calendar/storage.service';
import { ExportService } from 'src/app/calendar/export.service';
import { faDownload, faPlus, faSave, faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css']
})
export class TimetableComponent implements OnInit {
  @Input()
  public name: string;

  @Input()
  public classList: ClassListing[] = [];
  public weekdays: string[] = WEEKDAYS;
  public weekdayIndices: number[] = WEEKDAY_INDICES;
  public timetableHours: number[] = TIMETABLE_HOURS;

  public calendarNames: string[];
  public deletable = false;

  @Output()
  public sessionClick: EventEmitter<TimetableSession> = new EventEmitter<TimetableSession>();

  @Output()
  public saveClick: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  public timetableClick: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public deleteClick: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input()
  public editing: boolean;
  @Input()
  public editingClassName: string;
  @Input()
  public editingClassType: string;

  @Input()
  public selections: Map<string, Map<string, number>>;

  faPlus = faPlus;
  faTrash = faTrash;
  faDownload = faDownload;
  faSave = faSave;

  constructor(public storageService: StorageService, public exportService: ExportService) {

  }

  ngOnInit() {
    if (this.storageService.storeExists()) {
      this.updateSavedList();
    }
  }

  public exportCalendar(): void {
    this.exportService.exportCalendar(this.name);
  }

  public getSessionsOnDay(dayIndex: number): TimetableSession[] {
    const sessions: TimetableSession[] = [];

    this.classList.forEach((classListing: ClassListing) => {
      const selectionsForClass = this.selections.get(classListing.name);

      classListing.classes.forEach((classType: ClassType) => {
        const selectionForType = selectionsForClass.get(classType.name);

        classType.streams.forEach((classStream: ClassStream, streamIndex: number) => {

          if((this.editing && classType.name === this.editingClassType && classListing.name === this.editingClassName)
              || (streamIndex === selectionForType)) {
            classStream.classes.forEach((session: ClassSession, sessionIndex: number) => {
              const day: number = session instanceof Date
                ? (session as Date).getDay()
                : session.day as number;

              if(day === dayIndex) {
                sessions.push({
                  className: classListing.name,
                  classType: classType.name,
                  classStream: streamIndex,
                  classSessionIndex: sessionIndex,
                  classSession: session
                });
              }
            });
          }
        });
      });
    });

    return sessions;
  }

  public handleSaveClicked(): void {
    this.saveClick.emit();
    this.updateSavedList();
  }

  public handleDeleteClicked(): void {
    this.deleteClick.emit();
    this.updateSavedList();
  }

  public handleTimetableClicked(name: string): void {
    this.timetableClick.emit(name);
  }

  private updateSavedList(): void {
    this.calendarNames = this.storageService.getPlanNames();
  }
}
