import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ContainerComponent } from './components/container/container.component';
import { ErrorService } from './error.service';
import { PlanningComponent } from './components/planner/planning/planning.component';
import { TimetableComponent } from './components/planner/timetable/timetable.component';
import { TimetableDayComponent } from './components/planner/timetable-day/timetable-day.component';
import { ControlsComponent } from './components/planner/controls/controls.component';
import { TimePipe } from './calendar/time.pipe';
import { ModalComponent } from './components/modal/modal.component';
import { SemesterPipe } from './calendar/semester.pipe';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ThemeComponent } from './theme/theme.component';
import { WeeksComponent } from './components/planner/timetable/weeks/weeks.component';
import { DatePipe } from './calendar/date.pipe';

import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { InstallComponent } from './install/install.component';



@NgModule({
  declarations: [
    AppComponent,
    ContainerComponent,
    PlanningComponent,
    TimetableComponent,
    TimetableDayComponent,
    TimePipe,
    ControlsComponent,
    ModalComponent,
    SemesterPipe,
    ThemeComponent,
    WeeksComponent,
    DatePipe,
    InstallComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    FontAwesomeModule,
    ToastrModule.forRoot({
      autoDismiss: false
    }),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [{provide: ErrorHandler, useClass: ErrorService}],
  bootstrap: [AppComponent]
})
export class AppModule { }
