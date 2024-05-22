import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { AdditionalPropertyModel, GroupModel } from '@tailormap-admin/admin-api';
import { FormHelper } from '../../helpers/form.helper';
import { AdminFieldLocation, AdminFieldModel, AdminFieldRegistrationService } from '../../shared/services/admin-field-registration.service';

@Component({
  selector: 'tm-admin-group-form',
  templateUrl: './group-form.component.html',
  styleUrls: ['./group-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupFormComponent implements OnInit, OnDestroy {

  public groupForm = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [ Validators.required, Validators.pattern(FormHelper.NAME_REGEX) ],
    }),
    description: new FormControl<string>('', { nonNullable: false }),
    notes: new FormControl<string>('', { nonNullable: false }),
    systemGroup: new FormControl<boolean>(false, { nonNullable: true }),
  });

  public registeredFields: AdminFieldModel[] = [];

  @Input()
  public set group(group: GroupModel | null) {
    this._group = group;
    this.groupForm.patchValue({
      name: group ? group.name : '',
      description: group ? group.description : '',
      notes: group ? group.notes : null,
      systemGroup: group ? group.systemGroup : false,
    });
    this.additionalProperties = group?.additionalProperties || [];
    if (group) {
      this.groupForm.get('name')?.disable();
    } else {
      this.groupForm.get('name')?.enable();
    }
  }
  public get group(): GroupModel | null {
    return this._group;
  }

  @Output()
  public groupUpdated = new EventEmitter<GroupModel | null>();

  private destroyed = new Subject();
  private _group: GroupModel | null = null;
  public additionalProperties: AdditionalPropertyModel[] = [];

  constructor(
    private adminFieldRegistryService: AdminFieldRegistrationService,
  ) {
  }

  public ngOnInit(): void {
    this.registeredFields = this.adminFieldRegistryService.getRegisteredFields(AdminFieldLocation.GROUP);
    this.groupForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
      )
      .subscribe(() => {
        this.readForm();
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private readForm() {
    if (!this.groupForm.valid) {
      this.groupUpdated.emit(null);
      return;
    }
    this.groupUpdated.emit({
      name: this.groupForm.get('name')?.value || '',
      description: this.groupForm.get('description')?.value || null,
      notes: this.groupForm.get('notes')?.value || null,
      systemGroup: this.groupForm.get('systemGroup')?.value || false,
      additionalProperties: this.additionalProperties,
    });
  }

  public attributesChanged($event: AdditionalPropertyModel[]) {
    this.additionalProperties = $event;
    this.readForm();
  }

}
