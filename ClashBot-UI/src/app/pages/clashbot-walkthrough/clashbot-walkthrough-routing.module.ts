import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {ClashbotWalkthroughComponent} from "./clashbot-walkthrough.component";

const routes: Routes = [
  {
    path: "",
    component: ClashbotWalkthroughComponent
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClashbotWalkthroughRoutingModule { }
