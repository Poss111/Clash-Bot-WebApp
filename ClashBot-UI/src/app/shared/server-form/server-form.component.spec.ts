import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ServerFormComponent} from "./server-form.component";
import {mockSixDiscordGuilds} from "../shared-test-mocks.spec";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA} from "@angular/core";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {TestScheduler} from "rxjs/testing";

describe("ServerFormComponent", () => {
  let component: ServerFormComponent;
  let fixture: ComponentFixture<ServerFormComponent>;
  let testScheduler: TestScheduler;

  beforeEach(async () => {
    jest.resetAllMocks();
    testScheduler = new TestScheduler((a, b) => expect(a).toBe(b));
    await TestBed.configureTestingModule({
      declarations: [ ServerFormComponent ],
      imports: [
          ReactiveFormsModule,
          MatAutocompleteModule
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerFormComponent);
    component = fixture.componentInstance;
  });

  describe("On Init", () => {
    test("ngOnInit - (No selected servers) - On init should setup an observable that always does not include the selected Server name.", () => {
        const mockGuilds = mockSixDiscordGuilds();
        const guildMap: Map<string, DiscordGuild> = new Map<string, DiscordGuild>();
        mockGuilds.forEach(server => guildMap.set(server.id, server));

        component.serverNames = guildMap;
        expect(component.listOfAutoCompleteOptions).toHaveLength(0);
        expect(component.defaultServerForm.value).toEqual({});
        expect(component.preferredServerForm.value).toEqual({});
        fixture.detectChanges();
        expect(component.listOfAutoCompleteOptions).toHaveLength(1);
        expect(component.defaultServerForm.value).toEqual({defaultServer:""});
        expect(component.preferredServerForm.value).toEqual({server0:""});
    });

    test("ngOnInit - (All 5 servers passed) - On init should setup all the form controls for the servers and default server.", () => {
      const mockGuilds = mockSixDiscordGuilds();
      const guildMap: Map<string, DiscordGuild> = new Map<string, DiscordGuild>();
      mockGuilds.forEach(server => guildMap.set(server.id, server));

      component.serverNames = guildMap;
      component.selectedServerNames = mockGuilds.slice(0,5).map((server) => server.name);
      component.defaultServerName = mockGuilds[0].name;
      expect(component.listOfAutoCompleteOptions).toHaveLength(0);
      expect(component.defaultServerForm.value).toEqual({});
      expect(component.preferredServerForm.value).toEqual({});
      fixture.detectChanges();
      expect(component.listOfAutoCompleteOptions).toHaveLength(5);
      expect(component.defaultServerForm.value).toEqual({defaultServer: mockGuilds[0].name});
      expect(component.preferredServerForm.value).toEqual({
          server0: mockGuilds[0].name,
          server1: mockGuilds[1].name,
          server2: mockGuilds[2].name,
          server3: mockGuilds[3].name,
          server4: mockGuilds[4].name
      });
    });
  });

  describe("Add Server", () => {
      test("addServer - (Add Server) - If there are less than 5 servers, then a new formgroup should be added with the length of the list.", (done) => {
          const mockGuilds = mockSixDiscordGuilds();
          component.preferredServerForm = new FormGroup({
              server0: new FormControl(mockGuilds[0].name, [Validators.required])})
          expect(component.listOfAutoCompleteOptions).toHaveLength(0);
          component.formGroupChange.subscribe((form) => {
              expect(Object.keys(form.serverFormGroup.controls))
                  .toHaveLength(2);
              expect(form.defaultServerFormGroup).toBeTruthy();
              done();
          });
          component.addServer();
          expect(Object.keys(component.preferredServerForm.controls))
              .toHaveLength(2);
          expect(component.listOfAutoCompleteOptions).toHaveLength(1);
      });

      test("addServer - (Add Server only if less than 5) - If there are 5 servers, then a new formgroup should not be added.", () => {
          const mockGuilds = mockSixDiscordGuilds();
          component.preferredServerForm = new FormGroup({
              server0: new FormControl(mockGuilds[0].name, [Validators.required]),
              server1: new FormControl(mockGuilds[1].name, [Validators.required]),
              server2: new FormControl(mockGuilds[2].name, [Validators.required]),
              server3: new FormControl(mockGuilds[3].name, [Validators.required]),
              server4: new FormControl(mockGuilds[4].name, [Validators.required])
          });
          expect(component.listOfAutoCompleteOptions).toHaveLength(0);
          component.addServer();
          expect(Object.keys(component.preferredServerForm.controls))
              .toHaveLength(5);
          expect(component.listOfAutoCompleteOptions).toHaveLength(0);
      })
  });

  describe("Remove Server", () => {
    test("removeServer - (Should remove a server from the list) - If there is a list then it should remove a server from the list and emit that the group has been updated.", (done) => {
        const mockGuilds = mockSixDiscordGuilds();
        component.preferredServerForm = new FormGroup({
            server0: new FormControl(mockGuilds[0].name, [Validators.required]),
            server1: new FormControl(mockGuilds[1].name, [Validators.required]),
            server2: new FormControl(mockGuilds[2].name, [Validators.required]),
            server3: new FormControl(mockGuilds[3].name, [Validators.required]),
            server4: new FormControl(mockGuilds[4].name, [Validators.required])
        });
        component.serverForm = [
            {
                key: "server0",
                label: "Discord Server",
                value: ""
            },
            {
                key: "server1",
                label: "Discord Server",
                value: ""
            },
            {
                key: "server2",
                label: "Discord Server",
                value: ""
            },
            {
                key: "server3",
                label: "Discord Server",
                value: ""
            },
            {
                key: "server4",
                label: "Discord Server",
                value: ""
            }];
        expect(component.listOfAutoCompleteOptions).toHaveLength(0);
        component.formGroupChange.subscribe((form) => {
            expect(Object.keys(form.serverFormGroup.controls))
                .toHaveLength(4);
            expect(form.defaultServerFormGroup).toBeTruthy();
            done();
        });
        component.removeServer();
        expect(Object.keys(component.preferredServerForm.controls))
            .toHaveLength(4);
        expect(component.serverForm)
            .toHaveLength(4);
    });
  });

  describe("Validate No Duplicates", () => {
    test("validateNoDuplicates - (Changes has a single set of duplicates) - If a duplicate exists then set Errors should be set for the matching form control", () => {
        const changes = {
            server0: "Goon Squad",
            server1: "Clash Bot",
            server2: "Goon Squad"
        };
        component.preferredServerForm = new FormGroup({
            server0: new FormControl("Goon Squad", [Validators.required]),
            server1: new FormControl("Clash Bot", [Validators.required]),
            server2: new FormControl("Goon Squad", [Validators.required])
        });
        component.validateNoDuplicates(changes);
        expect(component.preferredServerForm.get("server0")?.getError("duplicate")).toBeTruthy();
        expect(component.preferredServerForm.get("server1")?.getError("duplicate")).toBeFalsy();
        expect(component.preferredServerForm.get("server2")?.getError("duplicate")).toBeTruthy();
    });

    test("validateNoDuplicates - (Changes has a multiple types of errors) - If another error exists, it should overwrite it with a duplicate error.", () => {
        const changes = {
            server0: "Goon Squad",
            server1: "Clash Bot",
            server2: "Goon Squad"
        };
        component.preferredServerForm = new FormGroup({
            server0: new FormControl("Goon Squad", [Validators.required]),
            server1: new FormControl("Clash Bot", [Validators.required]),
            server2: new FormControl("Goon Squad", [Validators.required])
        });
        component.preferredServerForm.get("server0")?.setErrors({notInList: true});
        component.validateNoDuplicates(changes);
        expect(component.preferredServerForm.get("server0")?.getError("duplicate")).toBeTruthy();
        expect(component.preferredServerForm.get("server0")?.getError("notinList")).toBeFalsy();
        expect(component.preferredServerForm.get("server1")?.getError("duplicate")).toBeFalsy();
        expect(component.preferredServerForm.get("server2")?.getError("duplicate")).toBeTruthy();
    });

    test("validateNoDuplicates - (Changes has multiple sets of duplicates) - If a duplicate exists then set Errors should be set for the matching form control", () => {
        const changes = {
            server0: "Goon Squad",
            server1: "Clash Bot",
            server2: "Goon Squad",
            server3: "Goon Squad",
            server4: "Goon Squad"
        };
        component.preferredServerForm = new FormGroup({
            server0: new FormControl("Goon Squad", [Validators.required]),
            server1: new FormControl("Clash Bot", [Validators.required]),
            server2: new FormControl("Goon Squad", [Validators.required]),
            server3: new FormControl("Goon Squad", [Validators.required]),
            server4: new FormControl("Goon Squad", [Validators.required]),
        });
        component.validateNoDuplicates(changes);
        expect(component.preferredServerForm.get("server0")?.getError("duplicate")).toBeTruthy();
        expect(component.preferredServerForm.get("server1")?.getError("duplicate")).toBeFalsy();
        expect(component.preferredServerForm.get("server2")?.getError("duplicate")).toBeTruthy();
        expect(component.preferredServerForm.get("server3")?.getError("duplicate")).toBeTruthy();
        expect(component.preferredServerForm.get("server4")?.getError("duplicate")).toBeTruthy();
    });
  });

  describe("Filter Server Names", () => {
      test("filterServerNames - (Should filter based on includes) - should return all names that match the given characters, case insensitive", () => {
        component.listOfServerNames = ["Clash Bot", "LoL-ClashBotSupport", "Goon Squad"];
        const filteredList = component.filterServerNames("clas");
        expect(filteredList).toHaveLength(2);
        expect(filteredList[0]).toEqual("Clash Bot");
        expect(filteredList[1]).toEqual("LoL-ClashBotSupport");
      })
  })

  describe("Reset State", function () {
    test("reset - (When invoked, it should reset the selected options) - if the state was empty, then it should remain empty.", () => {
        const mockGuilds = mockSixDiscordGuilds();
        const guildMap: Map<string, DiscordGuild> = new Map<string, DiscordGuild>();
        mockGuilds.forEach(server => guildMap.set(server.id, server));

        component.serverNames = guildMap;
        expect(component.listOfAutoCompleteOptions).toHaveLength(0);
        expect(component.defaultServerForm.value).toEqual({});
        expect(component.preferredServerForm.value).toEqual({});
        component.ngOnInit();
        expect(component.listOfAutoCompleteOptions).toHaveLength(1);
        expect(component.defaultServerForm.value).toEqual({defaultServer:""});
        expect(component.preferredServerForm.value).toEqual({server0:""});

        component.preferredServerForm.get("server0")?.setValue(mockGuilds[0].name);
        component.defaultServerForm.get("defaultServer")?.setValue(mockGuilds[0].name);
        component.addServer();

        component.reset();
        expect(component.serverForm).toHaveLength(1);
        expect(component.listOfAutoCompleteOptions).toHaveLength(1);
        expect(component.defaultServerForm.value).toEqual({defaultServer:""});
        expect(component.preferredServerForm.value).toEqual({server0:""});
    });

      test("reset - (When invoked and there are selected options, it should reset the selected options) - if the state was not empty, then it should reset to the selected values.", () => {
          const mockGuilds = mockSixDiscordGuilds();
          const guildMap: Map<string, DiscordGuild> = new Map<string, DiscordGuild>();
          mockGuilds.forEach(server => guildMap.set(server.id, server));

          component.serverNames = guildMap;
          component.selectedServerNames = [
              mockGuilds[0].name,
          ];
          component.defaultServerName = mockGuilds[0].name;
          expect(component.listOfAutoCompleteOptions).toHaveLength(0);
          expect(component.defaultServerForm.value).toEqual({});
          expect(component.preferredServerForm.value).toEqual({});
          component.ngOnInit();
          expect(component.listOfAutoCompleteOptions).toHaveLength(1);
          expect(component.defaultServerForm.value).toEqual({defaultServer: mockGuilds[0].name});
          expect(component.preferredServerForm.value).toEqual({server0: mockGuilds[0].name});

          component.addServer();
          component.preferredServerForm.get("server1")?.setValue(mockGuilds[0].name);
          expect(component.listOfAutoCompleteOptions).toHaveLength(2);
          expect(component.serverForm).toHaveLength(2);

          component.reset();
          expect(component.serverForm).toHaveLength(1);
          expect(component.listOfAutoCompleteOptions).toHaveLength(1);
          expect(component.defaultServerForm.value).toEqual({defaultServer: mockGuilds[0].name});
          expect(component.preferredServerForm.value).toEqual({server0: mockGuilds[0].name});
      });

      test("reset - (When invoked and there was a server option removed, it should reset the selected options) - if the state was not empty, then it should reset to the selected values.", () => {
          const mockGuilds = mockSixDiscordGuilds();
          const guildMap: Map<string, DiscordGuild> = new Map<string, DiscordGuild>();
          mockGuilds.forEach(server => guildMap.set(server.id, server));

          component.serverNames = guildMap;
          component.selectedServerNames = [
              mockGuilds[0].name,
              mockGuilds[1].name,
          ];
          component.defaultServerName = mockGuilds[1].name;
          expect(component.listOfAutoCompleteOptions).toHaveLength(0);
          expect(component.defaultServerForm.value).toEqual({});
          expect(component.preferredServerForm.value).toEqual({});
          component.ngOnInit();
          expect(component.listOfAutoCompleteOptions).toHaveLength(2);
          expect(component.defaultServerForm.value).toEqual({defaultServer: mockGuilds[1].name});
          expect(component.preferredServerForm.value).toEqual({
              server0: mockGuilds[0].name,
              server1: mockGuilds[1].name,
          });

          component.removeServer();
          component.preferredServerForm.get("server1")?.setValue(mockGuilds[0].name);
          expect(component.listOfAutoCompleteOptions).toHaveLength(1);
          expect(component.serverForm).toHaveLength(1);

          component.reset();
          expect(component.serverForm).toHaveLength(2);
          expect(component.listOfAutoCompleteOptions).toHaveLength(2);
          expect(component.defaultServerForm.value).toEqual({defaultServer: mockGuilds[1].name});
          expect(component.preferredServerForm.value).toEqual({
              server0: mockGuilds[0].name,
              server1: mockGuilds[1].name,
          });
      });
  });
});
