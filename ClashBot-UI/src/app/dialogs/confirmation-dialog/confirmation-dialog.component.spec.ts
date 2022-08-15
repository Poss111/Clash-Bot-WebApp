import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ConfirmationDialogComponent} from "./confirmation-dialog.component";
import {MAT_DIALOG_DATA, MatDialogModule} from "@angular/material/dialog";

describe("ConfirmationDialogComponent", () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmationDialogComponent ],
      imports: [ MatDialogModule ],
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: {}}
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test("should create", () => {
    expect(component).toBeTruthy();
  });
});
