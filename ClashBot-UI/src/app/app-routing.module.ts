import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TeamsDashboardComponent} from "./teams-dashboard/teams-dashboard.component";
import {WelcomeDashboardComponent} from "./welcome-dashboard/welcome-dashboard.component";

const routes: Routes = [
  { path: '', component: WelcomeDashboardComponent},
  { path: 'teams', component: TeamsDashboardComponent},
  { path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
