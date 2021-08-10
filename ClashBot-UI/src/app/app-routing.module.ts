import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WelcomeDashboardComponent} from "./welcome-dashboard/welcome-dashboard.component";
import {LoginSuccessfulComponent} from "./login-successful/login-successful.component";

const routes: Routes = [
  {path: '', component: WelcomeDashboardComponent},
  {path: 'teams', loadChildren: () => import('./teams-module/teams.module').then(m => m.TeamsModule)},
  {path: 'login', component: LoginSuccessfulComponent},
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
