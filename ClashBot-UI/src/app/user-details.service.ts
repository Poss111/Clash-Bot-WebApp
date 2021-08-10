import { Injectable } from '@angular/core';
import {UserDetails} from "./user-details";
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UserDetailsService {

  user: Subject<UserDetails> = new Subject<UserDetails>();

  constructor() {}

  getUserDetails(): Subject<UserDetails> {
    return this.user;
  }

  setUserDetails(user: UserDetails) {
    this.user.next(user);
  }
}
