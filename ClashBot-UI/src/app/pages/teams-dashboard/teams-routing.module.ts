import { NgModule } from '@angular/core';
import {TeamsDashboardComponent} from "./teams-dashboard/teams-dashboard.component";
import {RouterModule, Routes} from "@angular/router";

const routes: Routes = [
  {
    path: '',
    component: TeamsDashboardComponent
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeamsRoutingModule { }
