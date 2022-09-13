import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from "@angular/core";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors, ValidatorFn,
  Validators
} from "@angular/forms";
import {map, startWith, takeUntil} from "rxjs/operators";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {Observable, of, Subject} from "rxjs";

function inList(list: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return !list.includes(control.value) ?
        {notInList: {value: control.value}} : null;
  };
}

interface ServerFormDetails {
  serverFormGroup: FormGroup,
  defaultServerFormGroup: FormGroup
}

@Component({
  selector: "app-server-form",
  templateUrl: "./server-form.component.html",
  styleUrls: ["./server-form.component.scss"]
})
export class ServerFormComponent implements OnInit, OnDestroy {

  @Input()
  serverNames: Map<string, DiscordGuild> = new Map<string, DiscordGuild>();

  @Output()
  formGroupChange: EventEmitter<ServerFormDetails> = new EventEmitter<ServerFormDetails>();

  serverForm: any[] = [
    {
      key: "server0",
      label: "Discord Server",
      value: ""
    },
  ];

  listOfServerNames: string[] = [];

  listOfAutoCompleteOptions: Observable<string[]>[] = [];

  defaultAutoCompleteOptions: Observable<string[]> = new Observable<string[]>();

  preferredServerForm: FormGroup = new FormGroup({});
  defaultServerForm: FormGroup = new FormGroup({});

  $destroyObs = new Subject();

  constructor() { }

  ngOnInit(): void {
    this.listOfServerNames = [...this.serverNames.values()].map(record => record.name);
    const dynamicForm: any = {};
    this.serverForm.forEach((detail) => {
      dynamicForm[detail.key] = new FormControl(detail.value,
          [Validators.required,
            inList(this.listOfServerNames)
          ]);
      this.listOfAutoCompleteOptions.push(
          dynamicForm[detail.key].valueChanges
              .pipe(
                  takeUntil(this.$destroyObs),
                  startWith(""),
                  map((value: string) => this.filterServerNames(value)))
      );
    });
    this.defaultServerForm = new FormGroup({
      defaultServer: new FormControl("", [
      Validators.required,
      inList(this.listOfServerNames)
    ])});
    this.preferredServerForm = new FormGroup(dynamicForm);
    this.preferredServerForm.valueChanges
        .pipe(takeUntil(this.$destroyObs))
        .subscribe(changes => this.validateNoDuplicates(changes));
      this.preferredServerForm.statusChanges
        .pipe(takeUntil(this.$destroyObs))
        .subscribe((update) => {
          if ("VALID" === update) {
            this.defaultAutoCompleteOptions = of(Object.values(this.preferredServerForm.controls)
                .map(control => control.value));
            this.defaultServerForm.get("defaultServer")?.setValidators([
              Validators.required,
              inList(Object.values(this.preferredServerForm.controls).map(control => control.value))
            ]);
            this.defaultServerForm.get("defaultServer")?.updateValueAndValidity();
          }
          this.emitFormGroup();
        });
  }

  public filterServerNames(value: string) {
    return this.listOfServerNames
        .filter(serversNames => {
          return serversNames
              .toLowerCase()
              .includes(value.toLowerCase())
        });
  }

  public validateNoDuplicates(changes: any) {
    const keys = Object.keys(changes);
    this.defaultAutoCompleteOptions = of(Object.values(changes));
    for (let key of keys) {
      const allOther = [];
      for (let keyTwo of keys) {
        if (key !== keyTwo) {
          allOther.push(this.preferredServerForm.get(keyTwo)?.value);
          const validationError = this.preferredServerForm.get(key)?.errors;
          if (allOther.includes(this.preferredServerForm.get(key)?.value)) {
            this.preferredServerForm.get(key)?.setErrors({
              duplicate: true
            });
          } else if (!validationError?.notInList) {
            this.preferredServerForm.get(key)?.setErrors(null)
          }
        }
      }
    }
  }

  private emitFormGroup() {
    this.formGroupChange.emit({
      serverFormGroup: this.preferredServerForm,
      defaultServerFormGroup: this.defaultServerForm
    });
  }

  ngOnDestroy() {
    this.$destroyObs.next();
  }

  addServer() {
    const numberOfForms = Object.keys(this.preferredServerForm.controls).length;

    if (numberOfForms < 5) {
      let newServerFormDetails = {
        key: "server" + numberOfForms,
        label: "Discord Server",
        value: ""
      };
      let newServerForm = new FormControl(newServerFormDetails.value,
          [
              Validators.required,
              inList(this.listOfServerNames)
          ]);
      this.listOfAutoCompleteOptions.push(newServerForm.valueChanges
          .pipe(
              takeUntil(this.$destroyObs),
              startWith( ""),
              map((value: any) => this.filterServerNames(value))
          )
      );
      this.preferredServerForm?.addControl(newServerFormDetails.key, newServerForm);
      this.serverForm.push(newServerFormDetails);
      this.emitFormGroup();
    }
  }

  removeServer() {
    const numberOfForms = Object.keys(this.preferredServerForm.controls).length;
    this.preferredServerForm.removeControl("server" + (numberOfForms - 1));
    this.serverForm.pop();
    this.defaultServerForm.get("defaultServer")?.setValidators([
      Validators.required,
      inList(Object.values(this.preferredServerForm.controls).map(control => control.value))
    ]);
    this.defaultServerForm.get("defaultServer")?.updateValueAndValidity();
    this.emitFormGroup();
  }

}
