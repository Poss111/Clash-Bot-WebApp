import { TestBed } from '@angular/core/testing';

import { RiotDdragonService } from './riot-ddragon.service';
import {HttpClient, HttpClientModule} from "@angular/common/http";

describe('RiotDdragonService', () => {
  let service: RiotDdragonService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule]
    });
    service = TestBed.inject(RiotDdragonService);
  });

  test('should be created', () => {
    expect(service).toBeTruthy();
  });

  test('Should make a call to retrieve the list of valid champion names.', (done) => {
    service.getListOfChampions().subscribe((data) => {
      console.log(Object.keys(data.data));
      expect(data).toBeTruthy();
      done();
    });
  })
});
