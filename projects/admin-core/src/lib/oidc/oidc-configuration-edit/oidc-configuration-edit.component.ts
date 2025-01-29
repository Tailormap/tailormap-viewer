import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import {
  BehaviorSubject, combineLatest, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, takeUntil,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectOIDCConfigurationsLoadStatus, selectDraftOIDCConfiguration, selectDraftOIDCConfigurationUpdated } from '../state/oidc-configuration.selectors';
import { GroupModel, OIDCConfigurationModel } from '@tailormap-admin/admin-api';
import { clearSelectedOIDCConfiguration, setSelectedOIDCConfiguration } from '../state/oidc-configuration.actions';
import { ConfirmDialogService, LoadingStateEnum } from '@tailormap-viewer/shared';
import { OIDCConfigurationService } from '../services/oidc-configuration.service';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { GroupService } from '../../user/services/group.service';

@Component({
  selector: 'tm-admin-oidc-configuration-edit',
  templateUrl: './oidc-configuration-edit.component.html',
  styleUrls: ['./oidc-configuration-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class OIDCConfigurationEditComponent implements OnInit, OnDestroy {

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  private destroyed = new Subject();
  public oidcConfiguration$: Observable<OIDCConfigurationModel | null | undefined> = of(null);
  public draftOIDCConfigurationPristine$: Observable<boolean> = of(false);

  public groups$: Observable<Array<GroupModel & { lastSeen: Date | null }>> = of([]);

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private oidcConfigurationService: OIDCConfigurationService,
    private confirmDelete: ConfirmDialogService,
    private router: Router,
    private adminSnackbarService: AdminSnackbarService,
    private groupService: GroupService,
  ) {
  }

  public ngOnInit(): void {
    this.store$.select(selectOIDCConfigurationsLoadStatus).pipe(
      filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
      switchMap(() => this.route.paramMap),
      takeUntil(this.destroyed),
      map(params => params.get('oidcConfigurationId')),
      distinctUntilChanged(),
      map(appId => appId ? parseInt(appId, 10) : null),
      filter((appId): appId is number => !!appId),
    ).subscribe(oidcConfigurationId => {
      this.store$.dispatch(setSelectedOIDCConfiguration({ oidcConfigurationId }));
    });
    this.oidcConfiguration$ = this.store$.select(selectDraftOIDCConfiguration);
    this.draftOIDCConfigurationPristine$ = this.store$.select(selectDraftOIDCConfigurationUpdated).pipe(map(updated => !updated));

    this.groups$ =
      combineLatest( [ this.oidcConfiguration$, this.groupService.getGroups$() ] ).pipe(
        takeUntil(this.destroyed),
        map(([ oidcConfiguration, groups ]) => {
          if (oidcConfiguration == null) {
            return [];
          }

          return groups.filter(group => {
            const oidcClientIdsProperty = group?.additionalProperties?.find(value => value.key === 'oidcClientIds');
            const oidcClientIds = oidcClientIdsProperty && Array.isArray(oidcClientIdsProperty.value) ? oidcClientIdsProperty.value as string[] : [];

            return oidcClientIds.includes(oidcConfiguration.clientId);
          }).map(group => {
            const oidcLastSeenProperty = group?.additionalProperties?.find(value => value.key === 'oidcLastSeen');
            const oidcLastSeen = oidcLastSeenProperty && typeof oidcLastSeenProperty.value === 'object' ? oidcLastSeenProperty.value as { [key: string]: string } : {};

            return {
              ...group,
              lastSeen: oidcLastSeen[oidcConfiguration.clientId] ? new Date(oidcLastSeen[oidcConfiguration.clientId]) : null,
            };
          });
        }),
      );
  }

  public ngOnDestroy(): void {
    this.store$.dispatch(clearSelectedOIDCConfiguration());
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public save() {
    this.savingSubject.next(true);
    this.oidcConfigurationService.saveDraftOIDCConfiguration$()
      .pipe(take(1))
      .subscribe(() => {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.oidc.configuration-updated:OIDC configuration updated`);
        this.savingSubject.next(false);
      });
  }

  public delete(oidcConfiguration: OIDCConfigurationModel) {
    const title = oidcConfiguration.name;
    this.confirmDelete.confirm$(
      $localize `:@@admin-core.oidc.configuration-delete-confirm:Delete OIDC configuration ${title}`,
      $localize `:@@admin-core.oidc.configuration-delete-confirm-message:Are you sure you want to delete OIDC configuration ${title}? This action cannot be undone.`,
      true,
    )
      .pipe(
        take(1),
        filter(answer => answer),
        switchMap(() => this.oidcConfigurationService.deleteOIDCConfiguration$(oidcConfiguration.id)),
      )
      .subscribe(() => {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.oidc.configuration-removed:OIDC configuration ${title} removed`);
        this.router.navigateByUrl('/admin/settings/oidc-configurations');
      });
  }

}
