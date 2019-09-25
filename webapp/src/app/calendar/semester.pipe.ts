import { Pipe, PipeTransform } from '@angular/core';
import { Semester } from './calendar';

@Pipe({
  name: 'semester'
})
export class SemesterPipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    const semester = value as Semester;
    let semesterName: string;

    switch(semester.year) {
      case 1:
        semesterName = 'Semester 1';
        break;
      case 2:
        semesterName = 'Semester 2';
        break;
      case 3:
        semesterName = 'Summer Semester';
        break;
    }

    return `${semesterName}, ${semester.year}`;
  }
}
