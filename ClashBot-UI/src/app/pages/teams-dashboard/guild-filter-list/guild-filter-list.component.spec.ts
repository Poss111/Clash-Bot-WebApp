import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuildFilterListComponent } from './guild-filter-list.component';

describe('GuildFilterListComponent', () => {
  let component: GuildFilterListComponent;
  let fixture: ComponentFixture<GuildFilterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GuildFilterListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GuildFilterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
