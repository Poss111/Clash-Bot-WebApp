import { TestBed } from '@angular/core/testing';

import { PageLoadingService } from './page-loading.service';

describe('PageLoadingService', () => {
  let service: PageLoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PageLoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
