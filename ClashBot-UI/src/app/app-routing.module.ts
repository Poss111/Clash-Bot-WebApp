import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WelcomeDashboardComponent} from "./pages/welcome-dashboard/welcome-dashboard.component";

let routes: Routes = [
  {path: '', component: WelcomeDashboardComponent},
  {path: 'teams', loadChildren: () => import('./pages/teams-dashboard/teams.module').then(m => m.TeamsModule)},
  {path: 'user-profile', loadChildren: () => import('./pages/user-profile/user-profile.module').then(m => m.UserProfileModule)},
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
