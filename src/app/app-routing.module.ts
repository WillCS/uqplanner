import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlanningComponent } from './components/planner/planning/planning.component'
import { OptimisingComponent } from './components/optimiser/optimising/optimising.component'


const routes: Routes = [
  { path: 'plan',     component: PlanningComponent },
  { path: 'optimise', component: OptimisingComponent },
  { path: 'meet',     component: OptimisingComponent },
  { path: '', redirectTo: '/plan', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
