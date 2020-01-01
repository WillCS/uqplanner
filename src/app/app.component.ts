import { Component, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'UQ Timetable Planner';
  public theme = 'monotone';

  constructor(private renderer: Renderer2) {
    this.renderer.addClass(document.body, this.theme);
   }
}
