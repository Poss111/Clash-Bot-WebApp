import { Injectable } from '@angular/core';
import {UserDetails} from "../interfaces/user-details";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UserDetailsService {

  user: BehaviorSubject<UserDetails> = new BehaviorSubject<UserDetails>({ id: 0, username: '', discriminator: ''});

  constructor() {}

  getUserDetails(): BehaviorSubject<UserDetails> {
    return this.user;
  }

  setUserDetails(user: UserDetails) {
    this.user.next(user);
  }
}
