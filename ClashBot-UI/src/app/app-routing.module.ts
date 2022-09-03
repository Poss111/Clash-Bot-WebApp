import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {WelcomeDashboardComponent} from "./pages/welcome-dashboard/welcome-dashboard.component";
import {NewPlayerGuardGuard} from "./new-player-guard.guard";

let routes: Routes = [
  {path: "", component: WelcomeDashboardComponent},
  {
    path: "teams",
    loadChildren: () => import("./pages/teams-dashboard/teams.module").then(m => m.TeamsModule),
    canActivate: [NewPlayerGuardGuard]
  },
  {
    path: "user-profile",
    loadChildren: () => import("./pages/user-profile/user-profile.module").then(m => m.UserProfileModule),
    canActivate: [NewPlayerGuardGuard]
  },
  {path: "walkthrough", loadChildren: () => import("./pages/clashbot-walkthrough/clashbot-walkthrough.module").then(m => m.ClashbotWalkthroughModule)},
  {path: "**", redirectTo: ""}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
