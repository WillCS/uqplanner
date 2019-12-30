import { Component, OnInit } from '@angular/core';
import { ClassListing, TimetableSession, ClassType, NULL_SESSION } from 'src/app/calendar/calendar';
import { ApiService } from 'src/app/api.service';
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

  faTimesCircle = faTimesCircle;
  faSearch = faSearch;

  constructor(public api: ApiService) {
    this.selections = new Map<string, Map<string, number>>();
  }

  ngOnInit() {
    let reviver = function(key, value) {
      if(typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
          return new Map(value.value);
        }
      }
      return value;
    }

    if (localStorage.hasOwnProperty('timetableData')) {
      let data = JSON.parse(localStorage.getItem('timetableData'), reviver);
      if (data.name) {
        this.name = data.name;
      }
      if (data.classList) {
        this.classList = data.classList;
      }
      if (data.selections) {
        this.selections = data.selections;
      }
    }
  }

  public saveData(): void {
    let replacer = function (key, value) {
      const originalObject = this[key];
      if(originalObject instanceof Map) {
        return {
          dataType: 'Map',
          value: Array.from(originalObject.entries()), // or with spread: value: [...originalObject]
        };
      } else {
        return value;
      }
    }

    let data = {
      name: this.name,
      classList: this.classList,
      selections: this.selections
    }

    let dataString = JSON.stringify(data, replacer);

    localStorage.setItem('timetableData', dataString);
  }

  public handleSessionClicked(session: TimetableSession): void {
    if(this.editing) {
      this.selections.get(this.editingClassName).set(session.classType, session.classStream);
    } else {
      this.editingClassName = session.className;
      this.editingClassType = session.classType;
    }

    this.editing = !this.editing;
    this.saveData();
  }

  public handleTitleChanged(title: string): void {
    this.name = title;
    this.saveData();
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
    this.saveData();
  }

  public removeClass(className: string): void {
    this.classList = this.classList.filter(c => className !== c.name);

    if(this.selections.has(className)) {
      this.selections.delete(className);
    }
    this.saveData();
  }

  public SetSelection(className: string, classType: string, selection: number): void {
      if(this.selections.has(className) && this.selections[className].has(classType)) {
          this.selections[className][classType] = selection;
      }
      this.saveData();
  }

  public GetSelection(className: string, classType: string): number {
      if(this.selections.has(className) && this.selections[className].has(classType)) {
          return this.selections[className][classType];
      }
  }

  public onSearched(searchTerm: string): void {
    this.api.getClass(searchTerm, this.year, this.semester).subscribe(
      (newClass: ClassListing) => {
        this.addClass(newClass);
      });
  }

  public onClassCloseClicked(className: string): void {
    this.removeClass(className);
    this.saveData();
  }
}
