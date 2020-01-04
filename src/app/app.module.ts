import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ContainerComponent } from './components/container/container.component';
import { PlanningComponent } from './components/planner/planning/planning.component';
import { TimetableComponent } from './components/planner/timetable/timetable.component';
import { TimetableDayComponent } from './components/planner/timetable-day/timetable-day.component';
import { ClassSearchComponent } from './components/class-search/class-search.component';
import { ControlsComponent } from './components/planner/controls/controls.component';
import { TimePipe } from './calendar/time.pipe';
import { ModalComponent } from './components/modal/modal.component';
import { SemesterPipe } from './calendar/semester.pipe';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ThemeComponent } from './theme/theme.component';
import { WeeksComponent } from './components/planner/timetable/weeks/weeks.component';
import { DatePipe } from './calendar/date.pipe';

@NgModule({
  declarations: [
    AppComponent,
    ContainerComponent,
    PlanningComponent,
    TimetableComponent,
    TimetableDayComponent,
    ClassSearchComponent,
    TimePipe,
    ControlsComponent,
    ModalComponent,
    SemesterPipe,
    ThemeComponent,
    WeeksComponent,
    DatePipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    FontAwesomeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
