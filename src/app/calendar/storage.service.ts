import { Injectable } from "@angular/core";
import { Plans, Plan, addHashToClass, ClassType, ClassListing } from "./calendar";

@Injectable({
  providedIn: "root",
})
export class StorageService {
  public static readonly TIMETABLE_STORAGE_IDENTIFIER: string = "timetableData";
  public static readonly THEME_STORAGE_IDENTIFIER: string = "themeName";
  public static readonly LAST_OPENED_IDENTIFIER: string = "lastOpened";

  constructor() {
    // create an empty store if nothing exists
    if (!this.storeExists()) {
      this.save({});
      this.saveTheme("classic");
    }
  }

  public storeExists(): boolean {
    return localStorage.hasOwnProperty(
      StorageService.TIMETABLE_STORAGE_IDENTIFIER
    );
  }

  public save(plans: Plans): void {
    const dataString = JSON.stringify(plans, this.replacer);
    localStorage.setItem(
      StorageService.TIMETABLE_STORAGE_IDENTIFIER,
      dataString
    );
  }

  public get(): Plans {
    const data = this.loadData();

    Object.keys(data).forEach((key) => {
      if (!this.uuidValidate(key)) {
        throw new Error("Invalid schema");
      }

      const classProperties = Object.keys(data[key]);
      const requiredClassProperties = [
        "id",
        "classes",
        "selections",
        "lastEdited",
      ];
      requiredClassProperties.forEach((p) => {
        if (classProperties.indexOf(p) === -1) {
          throw new Error("Invalid schema");
        }
      });
    });

    Object.keys(data).forEach((key) => {
      data[key] = this.migratePlan(data[key]);
    });

    return data;
  }

  public saveTheme(name: string): void {
    localStorage.setItem(StorageService.THEME_STORAGE_IDENTIFIER, name);
  }

  public getTheme(): string {
    if (!localStorage.hasOwnProperty(StorageService.THEME_STORAGE_IDENTIFIER)) {
      return "";
    }

    return localStorage.getItem(StorageService.THEME_STORAGE_IDENTIFIER);
  }

  public getLastOpened(): string {
    if (!localStorage.hasOwnProperty(StorageService.LAST_OPENED_IDENTIFIER)) {
      return "";
    }

    return localStorage.getItem(StorageService.LAST_OPENED_IDENTIFIER);
  }

  public setLastOpened(planId: string): void {
    localStorage.setItem(StorageService.LAST_OPENED_IDENTIFIER, planId);
  }

  private replacer(key, value) {
    const originalObject = this[key];
    if (originalObject instanceof Map) {
      return {
        dataType: "Map",
        value: Array.from(originalObject.entries()), // or with spread: value: [...originalObject]
      };
    } else {
      return value;
    }
  }

  private reviver(key, value) {
    if (typeof value === "object" && value !== null) {
      if (value.dataType === "Map") {
        return new Map(value.value);
      }
    }

    return value;
  }

  private loadDataString(): string {
    return localStorage.getItem(StorageService.TIMETABLE_STORAGE_IDENTIFIER);
  }

  private loadData() {
    return JSON.parse(this.loadDataString(), this.reviver);
  }

  private uuidValidate(uuid: string) {
    return uuid.match(
      /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
    );
  }

  private migratePlan(plan: Plan): Plan {
    // relabel any 2019 plans as 2020
    if (plan.year === 2019) {
      plan.year = 2020;
    }

    // add id to ClassType
    plan.classes = plan.classes.map((listing: ClassListing) => {
      const newListing = { ...listing };
      newListing.classes = newListing.classes.map((c: ClassType) => {
        if (!c.id) {
          return {
            ...c,
            id: c.streams[0].streamId.slice(0, -3),
          };
        } else {
          return c;
        }
      });
      return newListing;
    });

    switch (plan.schemaVersion) {
      // Schema version 1: original version
      case 1:
        // hash classes
        plan.classes = plan.classes.map(addHashToClass);

        // convert number to number[] in selections
        // eslint-disable-next-line
        plan.selections.forEach((classMap, courseName) => {
          if (typeof classMap.values().next().value === 'number') {
            const newSelection = new Map<string, number[]>();
            classMap.forEach((selection: any, className) => {
              newSelection.set(className, [selection]);
            });

            plan.selections.set(courseName, newSelection);
          }
        });

        // update schema version
        plan.schemaVersion = 2;
      // Schema version 2: introduced hash, selections are number[] instead of number
      case 2:
        break;
      default:
        break;
    }

    return plan;
  }
}
