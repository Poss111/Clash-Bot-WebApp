import { TestBed } from '@angular/core/testing';

import { DiscordInterceptor } from './discord-interceptor.service';

describe('DiscordInterceptorInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      DiscordInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: DiscordInterceptor = TestBed.inject(DiscordInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
