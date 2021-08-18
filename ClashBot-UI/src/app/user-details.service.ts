import { Injectable } from '@angular/core';
import {UserDetails} from "./user-details";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UserDetailsService {

  user: BehaviorSubject<UserDetails> = new BehaviorSubject<UserDetails>({ id: '', username: '', discriminator: ''});

  constructor() {}

  getUserDetails(): BehaviorSubject<UserDetails> {
    return this.user;
  }

  setUserDetails(user: UserDetails) {
    this.user.next(user);
  }
}
