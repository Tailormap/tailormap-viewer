import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, debounceTime, map, Observable, of, Subject, takeUntil } from 'rxjs';
import { AdditionalPropertyModel, GroupModel, OIDCConfigurationModel } from '@tailormap-admin/admin-api';
import { FormHelper } from '../../helpers/form.helper';
import { AdminFieldLocation, AdminFieldModel, AdminFieldRegistrationService } from '../../shared/services/admin-field-registration.service';
import { GroupService } from '../services/group.service';
import { OIDCConfigurationService } from '../../oidc/services/oidc-configuration.service';

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
    aliasForGroup: new FormControl<string>('', { nonNullable: false }),
    notes: new FormControl<string>('', { nonNullable: false }),
    systemGroup: new FormControl<boolean>(false, { nonNullable: true }),
  });

  public registeredFields$: Observable<AdminFieldModel[]> = of([]);

  public groups$: Observable<GroupModel[]>;
  public oidcConfigurations$: Observable<Array<OIDCConfigurationModel & { lastSeen: Date | null }>> = of([]);

  @Input()
  public set group(group: GroupModel | null) {
    this._group = group;
    this.groupForm.patchValue({
      name: group ? group.name : '',
      description: group ? group.description : '',
      aliasForGroup: group ? group.aliasForGroup : '',
      notes: group ? group.notes : null,
      systemGroup: group ? group.systemGroup : false,
    });
    this.additionalProperties = group?.additionalProperties || [];
    if (group) {
      this.groupForm.get('name')?.disable();
    } else {
      this.groupForm.get('name')?.enable();
    }
    this.groupSubject.next(group);
  }
  public get group(): GroupModel | null {
    return this._group;
  }

  @Output()
  public groupUpdated = new EventEmitter<GroupModel | null>();

  private destroyed = new Subject();
  private _group: GroupModel | null = null;
  private groupSubject = new BehaviorSubject<GroupModel | null>(null);
  public additionalProperties: AdditionalPropertyModel[] = [];

  constructor(
    private adminFieldRegistryService: AdminFieldRegistrationService,
    private groupDetailsService: GroupService,
    private oidcConfigurationService: OIDCConfigurationService,
  ) {
    this.groups$ = this.groupDetailsService.getGroups$();
  }

  public ngOnInit(): void {
    this.registeredFields$ = this.adminFieldRegistryService.getRegisteredFields$(AdminFieldLocation.GROUP);
    this.groupForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
      )
      .subscribe(() => {
        this.readForm();
      });

    this.groupSubject.asObservable().pipe(takeUntil(this.destroyed)).subscribe(group => console.log('group set', group));

    this.oidcConfigurations$ =
      combineLatest([ this.groupSubject.asObservable(), this.oidcConfigurationService.getOIDCConfigurations$()]).pipe(
        takeUntil(this.destroyed),
        map(([group, oidcConfigurations]) => {
          if (group == null) {
            return [];
          }
          const oidcClientIdsProperty = group?.additionalProperties?.find(value => value.key === 'oidcClientIds');
          const oidcClientIds = oidcClientIdsProperty && Array.isArray(oidcClientIdsProperty.value) ? oidcClientIdsProperty.value as string[] : [];
          const oidcLastSeenProperty = group?.additionalProperties?.find(value => value.key === 'oidcLastSeen');
          const oidcLastSeen = oidcLastSeenProperty && typeof oidcLastSeenProperty.value === 'object' ? oidcLastSeenProperty.value as { [key: string]: string } : {};

          return oidcConfigurations.filter(oidcConfiguration => {
            return oidcClientIds.includes(oidcConfiguration.clientId);
          }).map(oidcConfiguration => {
            return {
              ...oidcConfiguration,
              lastSeen: oidcLastSeen[oidcConfiguration.clientId] ? new Date(oidcLastSeen[oidcConfiguration.clientId]) : null,
            };
          });
        }),
      );
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
      aliasForGroup: this.groupForm.get('aliasForGroup')?.value || null,
      notes: this.groupForm.get('notes')?.value || null,
      systemGroup: this.groupForm.get('systemGroup')?.value || false,
      additionalProperties: this.additionalProperties,
    });
  }

  public attributesChanged($event: AdditionalPropertyModel[]) {
    this.additionalProperties = $event;
    this.readForm();
  }

  protected readonly JSON = JSON;
}
