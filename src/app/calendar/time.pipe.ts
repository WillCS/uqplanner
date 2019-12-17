import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'time'
})
export class TimePipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    const timeNumber = parseInt(value, 10);
    const ampm = timeNumber > 11 ? 'PM' : 'AM';

    let actualTime = timeNumber % 12;
    if(actualTime === 0) {
      actualTime = 12;
    }

    return `${actualTime}${ampm}`;
  }

}
