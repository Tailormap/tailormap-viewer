import { Injectable, OnDestroy, inject, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  OIDCClientSecretExpirationInfo,
  OIDCConfigurationModel, TailormapAdminApiV1Service,
} from '@tailormap-admin/admin-api';
import { catchError, concatMap, filter, map, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { DebounceHelper, LoadingStateEnum } from '@tailormap-viewer/shared';
import {
  addOIDCConfiguration, deleteOIDCConfiguration, loadOIDCConfigurationsFailed, loadOIDCConfigurationsStart,
  loadOIDCConfigurationsSuccess, updateOIDCConfiguration,
} from '../state/oidc-configuration.actions';

type OIDCConfigurationErrorResponse = { error: string };
const isOIDCConfigurationErrorResponse = (
  res: OIDCConfigurationModel[] | OIDCConfigurationErrorResponse,
): res is OIDCConfigurationErrorResponse => typeof (res as OIDCConfigurationErrorResponse).error !== 'undefined';
import {
  selectOIDCConfigurationList, selectOIDCConfigurationsLoadStatus, selectDraftOIDCConfiguration,
  selectExpiringClientSecretConfigurations,
} from '../state/oidc-configuration.selectors';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { AdminSseService, EventType } from '../../shared/services/admin-sse.service';
import { DateTime } from 'luxon';

type OIDCConfigurationCreateModel = Omit<OIDCConfigurationModel, 'id'>;
type OIDCConfigurationEditModel = Partial<OIDCConfigurationCreateModel>;

@Injectable({
  providedIn: 'root',
})
export class OIDCConfigurationService implements OnDestroy {
  private store$ = inject(Store);
  private adminApiService = inject(TailormapAdminApiV1Service);
  private adminSnackbarService = inject(AdminSnackbarService);
  private sseService = inject(AdminSseService);

  public static DAYS_UNTIL_EXPIRY_WARNING = 30;

  private destroyed = new Subject<null>();

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public listenForOIDCConfigurationChanges() {
    this.sseService.listenForEvents$<OIDCConfigurationModel>('OIDCConfiguration')
      .pipe(takeUntil(this.destroyed))
      .subscribe(event => {
        if (event.eventType === EventType.ENTITY_CREATED && event.details.object) {
          this.updateOIDCConfigurationState(event.details.object.id, 'add', event.details.object);
        }
        if (event.eventType === EventType.ENTITY_UPDATED && event.details.object) {
          this.updateOIDCConfigurationState(event.details.object.id, 'update', event.details.object);
        }
        if (event.eventType === EventType.ENTITY_DELETED) {
          this.updateOIDCConfigurationState(parseInt(event.details.id, 10), 'remove');
        }
      });
  }

  public getOIDCConfigurations$() {
    return this.store$.select(selectOIDCConfigurationsLoadStatus)
      .pipe(
        tap(loadStatus => {
          if (loadStatus === LoadingStateEnum.INITIAL) {
            this.loadOIDCConfigurations();
          }
        }),
        filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
        switchMap(() => this.store$.select(selectOIDCConfigurationList)),
      );
  }

  public loadOIDCConfigurations(): void {
    this.store$.select(selectOIDCConfigurationsLoadStatus)
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.LOADED || loadStatus === LoadingStateEnum.LOADING) {
          return;
        }
        this.store$.dispatch(loadOIDCConfigurationsStart());
        this.adminApiService.getOIDCConfigurations$()
          .pipe(
            catchError(() => of({ error: $localize `:@@admin-core.oidc.error-loading-configurations:Error while loading list of OIDC configurations` })),
          )
          .subscribe(response => {
            if (isOIDCConfigurationErrorResponse(response)) {
              this.store$.dispatch(loadOIDCConfigurationsFailed({ error: response.error }));
              return;
            }
            this.store$.dispatch(loadOIDCConfigurationsSuccess({ oidcConfigurations: response }));
          });
      });
  }

  public static getDaysUntilExpirationForConfig(oidcConfiguration: OIDCConfigurationModel): number | null {
    if (!oidcConfiguration.clientSecretExpiry) {
      return null;
    }
    return OIDCConfigurationService.getDaysUntilExpiration(DateTime.fromISO(oidcConfiguration.clientSecretExpiry));
  }

  public static getDaysUntilExpiration(expirationDate: DateTime): number {
    return Math.max(0, Math.ceil(expirationDate.diffNow('days').days));
  }

  public static clientSecretExpirationDaysToCategory(expirationDays: number) {
    if (expirationDays <= 0) {
      return 'expired';
    } else if (expirationDays <= OIDCConfigurationService.DAYS_UNTIL_EXPIRY_WARNING) {
      return 'warning';
    } else {
      return 'valid';
    }
  }

  public getExpiringClientSecretConfigurations(): Signal<OIDCClientSecretExpirationInfo[]> {
    return this.store$.selectSignal(selectExpiringClientSecretConfigurations);
  }

  public createOIDCConfiguration$(oidcConfiguration: OIDCConfigurationCreateModel) {
    return this.adminApiService.createOIDCConfiguration$({ oidcConfiguration })
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.oidc.error-creating-configuration:Error while creating OIDC configuration.`);
          return of(null);
        }),
        map(createOIDCConfiguration => {
          if (createOIDCConfiguration) {
            this.updateOIDCConfigurationState(createOIDCConfiguration.id, 'add', createOIDCConfiguration);
            return createOIDCConfiguration;
          }
          return null;
        }),
      );
  }

  public saveDraftOIDCConfiguration$() {
    return this.store$.select(selectDraftOIDCConfiguration)
      .pipe(
        takeUntil(this.destroyed),
        concatMap(oidcConfiguration => {
          if (oidcConfiguration) {
            // Save specific properties only.
            // By default, the API adds properties like _links etc., we don't want to patch those
            const draftOIDCConfiguration: OIDCConfigurationModel = {
              id: oidcConfiguration.id,
              name: oidcConfiguration.name,
              clientId: oidcConfiguration.clientId,
              clientSecret: oidcConfiguration.clientSecret,
              clientSecretExpiry: oidcConfiguration.clientSecretExpiry,
              issuerUrl: oidcConfiguration.issuerUrl,
              userNameAttribute: oidcConfiguration.userNameAttribute,
              defaultAuthorities: oidcConfiguration.defaultAuthorities,
              rolesClaimFilterRegex: oidcConfiguration.rolesClaimFilterRegex,
              image: oidcConfiguration.image,
           };
            return this.updateOIDCConfiguration$(draftOIDCConfiguration.id, draftOIDCConfiguration);
          }
          return of(null);
        }),
      );
  }

  public updateOIDCConfiguration$(id: number, oidcConfiguration: OIDCConfigurationEditModel) {
    return this.adminApiService.updateOIDCConfiguration$({ id, oidcConfiguration })
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.oidc.error-updating-configuration:Error while updating OIDC configuration.`);
          return of(null);
        }),
        map(updatedOIDCConfiguration => {
          if (updatedOIDCConfiguration) {
            this.updateOIDCConfigurationState(updatedOIDCConfiguration.id, 'update', updatedOIDCConfiguration);
            return updatedOIDCConfiguration;
          }
          return null;
        }),
      );
  }

  public deleteOIDCConfiguration$(id: number) {
    return this.adminApiService.deleteOIDCConfiguration$(id)
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.oidc.error-deleting-configuration:Error while deleting OIDC configuration.`);
          return of(null);
        }),
        map(success => {
          if (success) {
            this.updateOIDCConfigurationState(id, 'remove');
            return success;
          }
          return null;
        }),
      );
  }

  private updateOIDCConfigurationState(
    id: number,
    type: 'add' | 'update' | 'remove',
    oidcConfiguration?: OIDCConfigurationModel | null,
  ) {
    // Add a small timeout to prevent most duplicate updates to prevent many state updates
    // For data integrity, it should not matter if we update the state twice
    DebounceHelper.debounce(`oidcConfiguration-${type}-${id}`, () => {
      if (type === 'add' && oidcConfiguration) {
        this.store$.dispatch(addOIDCConfiguration({ oidcConfiguration }));
      }
      if (type === 'update' && oidcConfiguration) {
        this.store$.dispatch(updateOIDCConfiguration({ oidcConfiguration }));
      }
      if (type === 'remove') {
        this.store$.dispatch(deleteOIDCConfiguration({ oidcConfigurationId: id }));
      }
    }, 50);
  }

}
