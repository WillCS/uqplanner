import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlanningComponent } from './components/planner/planning/planning.component'


const routes: Routes = [
  { path: '',     component: PlanningComponent },
  { path: '**',   redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
