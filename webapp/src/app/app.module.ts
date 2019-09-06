import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ContainerComponent } from './components/container/container.component';
import { PlanningComponent } from './components/planner/planning/planning.component';
import { OptimisingComponent } from './components/optimiser/optimising/optimising.component';
import { TimetableComponent } from './components/planner/timetable/timetable.component';
import { TimetableDayComponent } from './components/planner/timetable-day/timetable-day.component';

@NgModule({
  declarations: [
    AppComponent,
    ContainerComponent,
    PlanningComponent,
    OptimisingComponent,
    TimetableComponent,
    TimetableDayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
