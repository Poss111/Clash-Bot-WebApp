import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {KebabCasePipe} from "./kebab-case.pipe";



@NgModule({
  declarations: [KebabCasePipe],
  imports: [
    CommonModule
  ],
  exports: [
      KebabCasePipe
  ]
})
export class SharedModule { }
