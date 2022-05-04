import {ComponentFixture, TestBed} from '@angular/core/testing';

import {GuildFilterListComponent} from './guild-filter-list.component';
import {FilterType} from "../../../../interfaces/filter-type";
import {MatChipsModule} from "@angular/material/chips";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

function mockTeamFilters() {
    return [
        {
            value: 'Feli',
            type: FilterType.SERVER,
            state: true,
            id: '0'
        },
        {
            value: 'Goon Squad',
            type: FilterType.SERVER,
            state: true,
            id: '1'
        },
        {
            value: 'Navid',
            type: FilterType.SERVER,
            state: true,
            id: '2'
        }
    ];
}

describe('GuildFilterListComponent', () => {
    let component: GuildFilterListComponent;
    let fixture: ComponentFixture<GuildFilterListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GuildFilterListComponent],
            imports: [
                MatChipsModule,
                FormsModule,
                ReactiveFormsModule
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GuildFilterListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    test('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('On Init', () => {
        test('If no default guild given, the form control should remain empty.', () => {
            component.teamFilters = mockTeamFilters();
            component.defaultSelection = undefined;

            expect(component.formControl.value).toBeFalsy();

            component.ngOnInit();

            expect(component.formControl.value).toBeFalsy();
        })

        test('If there is a default guild given, it should update the form control to it.', () => {
            component.teamFilters = mockTeamFilters();
            component.defaultSelection = 'Goon Squad';

            expect(component.formControl.value).toBeFalsy();

            component.ngOnInit();

            expect(component.formControl.value).toEqual('Goon Squad');
        })
    })

    describe('Filter for Team', () => {
        test('If a Server is selected, it should emit an event with the selected Team while deselecting all other chips.',  (done) => {

            component.teamFilters = mockTeamFilters();

            let mockMatChip: any = {
                selectViaInteraction: jest.fn().mockImplementation()
            };
            const expectedServer = 'Goon Squad';
            component.formControl.setValue(expectedServer);

            component.selectedTeamEvent.subscribe((event) => {
                expect(event).toEqual(expectedServer);
                expect(mockMatChip.selectViaInteraction).toHaveBeenCalledTimes(1);
                done();
            })
            component.filterTeam(mockMatChip);
        })
    })
});
