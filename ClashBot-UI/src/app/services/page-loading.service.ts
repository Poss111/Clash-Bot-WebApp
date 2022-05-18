import { Injectable } from '@angular/core';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PageLoadingService {

  private subject : Subject<boolean> = new Subject<boolean>();

  constructor() { }

  getSubject(): Subject<boolean> {
    return this.subject;
  }

  updateSubject(value: boolean): void {
    this.subject.next(value);
  }
}
