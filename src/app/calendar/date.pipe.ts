import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    if(value instanceof Date) {
      return `${value.getDate()} ${value.toLocaleString('default', {month: 'long'}).slice(0, 3)}`;
    }
  }
}
