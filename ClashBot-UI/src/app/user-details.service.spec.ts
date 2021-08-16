import { TestBed } from '@angular/core/testing';

import { UserDetailsService } from './user-details.service';
import {UserDetails} from "./user-details";

describe('UserDetailsService', () => {
  let service: UserDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserDetailsService);
  });

  test('should be created', () => {
    expect(service).toBeTruthy();
  });

  test('When setUserDetails is set, it should emit to the User Details subject.', () => {
    let mockUser: UserDetails = {
      discriminator: "321", id: "123", username: "Test"
    };
    service.user.subscribe((data) => {
      expect(data).toEqual(mockUser);
    })
    service.setUserDetails(mockUser);
  })

  test('When getUserDetails is called, it should return the subscription to the Subject for the user details.', () => {
    expect(service.getUserDetails()).toBeTruthy();
  })

});
