import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClashUserPanelComponent } from './clash-user-panel.component';

describe('ClashUserPanelComponent', () => {
  let component: ClashUserPanelComponent;
  let fixture: ComponentFixture<ClashUserPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClashUserPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClashUserPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
