import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClashbotWalkthroughComponent } from './clashbot-walkthrough.component';

describe('ClashbotWalkthroughComponent', () => {
  let component: ClashbotWalkthroughComponent;
  let fixture: ComponentFixture<ClashbotWalkthroughComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClashbotWalkthroughComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClashbotWalkthroughComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
