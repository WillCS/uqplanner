import { Component, OnInit } from '@angular/core';
import { ClassListing, TimetableSession, ClassType, NULL_SESSION } from 'src/app/calendar/calendar';
import { ApiService } from 'src/app/api.service';
import { StorageService } from 'src/app/calendar/storage.service';
import { ModalService } from '../../modal/modal.service';
import { faTimesCircle, faSearch } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css']
})
export class PlanningComponent implements OnInit {
  public name: string;
  public year: number;
  public semester: number;

  public classList: ClassListing[] = [];

  public selections: Map<string, Map<string, number>>;

  public editing = false;
  public editingClassName: string;
  public editingClassType: string;

  public isDirty = false;

  faTimesCircle = faTimesCircle;
  faSearch = faSearch;

  constructor(
      public api: ApiService,
      public storageService: StorageService,
      public modalService: ModalService) {
    this.selections = new Map<string, Map<string, number>>();
  }

  ngOnInit() {
    if (this.storageService.storeExists()) {
      if (this.storageService.getPlanNames().length > 0) {
        this.loadTimetable(this.storageService.getPlanNames()[0]);
      }
    }
  }

  public loadTimetable(name: string): void {
    const timetable = this.storageService.getPlan(name);

    if (timetable) {
      this.name = timetable.name;
      this.classList = timetable.classList;
      this.selections = timetable.selections;
      this.isDirty = false;
    }
  }

  public getName(): string {
    if (this.name === '' || this.name === undefined || this.name === null) {
      this.name = 'Semester Timetable';
    }

    return this.name;
  }

  public deleteTimetable(name: string): void {
    this.storageService.deletePlan(name);
  }

  public saveData(): void {
    const data = {
      name: this.getName(),
      classList: this.classList,
      selections: this.selections
    };

    this.storageService.savePlan(this.getName(), data);
  }

  public handleSessionClicked(session: TimetableSession): void {
    if(this.editing) {
      this.selections.get(this.editingClassName).set(session.classType, session.classStream);
    } else {
      this.editingClassName = session.className;
      this.editingClassType = session.classType;
    }

    this.editing = !this.editing;
    this.isDirty = true;
  }

  public handleTitleChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    let name = target.value;
    if (target.value === '' || target.value === undefined || target.value === null) {
      name = 'Timetable';
    }

    // this.deletable = target.value in this.calendarNames;
    this.name = target.value;

    this.isDirty = true;
  }

  public addClass(newClass: ClassListing): void {

    if(!this.classList.some(c => c.name === newClass.name)) {
      this.classList.push(newClass);

      if(!this.selections.has(newClass.name)) {
          const classMap: Map<string, number> = new Map<string, number>();
          newClass.classes.forEach((classType: ClassType) => {
              classMap.set(classType.name, 0);
          });
          this.selections.set(newClass.name, classMap);
      }
    }
    this.isDirty = true;
  }

  public removeClass(className: string): void {
    this.classList = this.classList.filter(c => className !== c.name);

    if(this.selections.has(className)) {
      this.selections.delete(className);
    }
    this.isDirty = true;
  }

  public setSelection(className: string, classType: string, selection: number): void {
    if(this.selections.has(className) && this.selections[className].has(classType)) {
        this.selections[className][classType] = selection;
    }
    this.isDirty = true;
  }

  public GetSelection(className: string, classType: string): number {
    if(this.selections.has(className) && this.selections[className].has(classType)) {
        return this.selections[className][classType];
    }
  }

  public onSearched(searchTerm: string): string {
    this.api.getClass(searchTerm, this.year, this.semester).subscribe(
      (newClass: ClassListing) => {
        this.addClass(newClass);
      });

    return '';
  }

  public onClassCloseClicked(className: string): void {
    this.removeClass(className);
    this.isDirty = true;
  }

  public handleTimetableChangeRequest(name: string): void {
    if (this.isDirty) {
      this.modalService.showConfirmationModal(
        'Unsaved Changes',
        'You have made changes to your current timetable that ' +
        'have not been saved. Are you sure you want to load ' +
        'another timetable?',
        () => this.loadTimetable(name));
    } else {
      this.loadTimetable(name);
    }
  }
}
