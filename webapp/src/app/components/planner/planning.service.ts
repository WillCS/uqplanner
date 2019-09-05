import { Injectable } from '@angular/core';
import { ClassListing, ClassType } from 'src/app/calendar/calendar';

@Injectable({
    providedIn: 'root'
})
export class PlanningService {
    private selections: Map<string, Map<string, number>>

    constructor() {
        this.selections = new Map<string, Map<string, number>>();
    }

    public AddClass(newClass: ClassListing): void {
        if(!this.selections.has(newClass.name)) {
            let classSelections: Map<string, number> = new Map<string, number>();
            newClass.classes.forEach((classType: ClassType) => {
                classSelections[classType.name] = 0;
            });
            this.selections.set(newClass.name, classSelections);
        }
    }

    public SetSelection(className: string, classType: string, selection: number): void {
        if(this.selections.has(className) && this.selections[className].has(classType)) {
            this.selections[className][classType] = selection;
        }
    }

    public GetSelection(className: string, classType: string): number {
        if(this.selections.has(className) && this.selections[className].has(classType)) {
            return this.selections[className][classType];
        }
    }
}
