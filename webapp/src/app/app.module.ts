import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ContainerComponent } from './components/container/container.component';
import { PlanningComponent } from './components/planner/planning/planning.component';
import { OptimisingComponent } from './components/optimiser/optimising/optimising.component';
import { TimetableComponent } from './components/planner/timetable/timetable.component';
import { TimetableDayComponent } from './components/planner/timetable-day/timetable-day.component';
import { ClassSearchComponent } from './components/class-search/class-search.component';
import { CloseButtonComponent } from './components/close-button/close-button.component';

@NgModule({
  declarations: [
    AppComponent,
    ContainerComponent,
    PlanningComponent,
    OptimisingComponent,
    TimetableComponent,
    TimetableDayComponent,
    ClassSearchComponent,
    CloseButtonComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
