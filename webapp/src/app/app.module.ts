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
import { ControlsComponent } from './components/planner/controls/controls.component';
import { TimePipe } from './calendar/time.pipe';
import { ModalComponent } from './components/modal/modal.component';
import { SemesterPipe } from './calendar/semester.pipe';

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
    TimePipe,
    ControlsComponent,
    ModalComponent,
    SemesterPipe
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
