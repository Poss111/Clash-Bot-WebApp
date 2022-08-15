import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ReleaseNotificationDialogComponent} from "./release-notification-dialog.component";
import {MatDialogModule} from "@angular/material/dialog";
import {MarkdownModule} from "ngx-markdown";
import {HttpClientModule} from "@angular/common/http";

describe("ReleaseNotificationDialogComponent", () => {
  let component: ReleaseNotificationDialogComponent;
  let fixture: ComponentFixture<ReleaseNotificationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReleaseNotificationDialogComponent ],
      imports: [MatDialogModule, MarkdownModule.forRoot(), HttpClientModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReleaseNotificationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
