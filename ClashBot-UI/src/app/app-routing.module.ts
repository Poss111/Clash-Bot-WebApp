import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WelcomeDashboardComponent} from "./pages/welcome-dashboard/welcome-dashboard.component";
import {environment} from "../environments/environment";

let routes: Routes = [
  {path: '', component: WelcomeDashboardComponent},
  {path: 'teams', loadChildren: () => import('./pages/teams-dashboard/teams-module/teams.module').then(m => m.TeamsModule)},
  {path: 'user-profile', loadChildren: () => import('./pages/user-profile/user-profile.module').then(m => m.UserProfileModule)},
  {path: '**', redirectTo: ''}
];

if (!environment.production) {
  routes.splice(routes.length - 2, 0, { path: 'testing', loadChildren: () => import('./pages/component-testing/component-testing.module').then(m => m.ComponentTestingModule)});
}

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
