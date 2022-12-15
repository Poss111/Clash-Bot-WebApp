import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsyncUserprofilePageTemplateComponent } from './async-userprofile-page-template.component';

describe('AsyncUserprofilePageTemplateComponent', () => {
  let component: AsyncUserprofilePageTemplateComponent;
  let fixture: ComponentFixture<AsyncUserprofilePageTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AsyncUserprofilePageTemplateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AsyncUserprofilePageTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
