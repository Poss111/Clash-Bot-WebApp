import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChampionListInputComponent } from './champion-list-input.component';

describe('ChampionListInputComponent', () => {
  let component: ChampionListInputComponent;
  let fixture: ComponentFixture<ChampionListInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChampionListInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChampionListInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
