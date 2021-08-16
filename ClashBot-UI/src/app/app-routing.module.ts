import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WelcomeDashboardComponent} from "./welcome-dashboard/welcome-dashboard.component";

const routes: Routes = [
  {path: '', component: WelcomeDashboardComponent},
  {path: 'teams', loadChildren: () => import('./teams-module/teams.module').then(m => m.TeamsModule)},
  {path: 'user-profile', loadChildren: () => import('./user-profile/user-profile.module').then(m => m.UserProfileModule)},
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
