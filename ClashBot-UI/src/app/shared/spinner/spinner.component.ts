import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent implements OnInit {

  color: any;
  mode: any;
  value: any;
  showSpinner: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.color = 'primary';
    this.mode = 'indeterminate';
  }

}
