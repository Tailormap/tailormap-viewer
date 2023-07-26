import { Inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  OIDCConfigurationModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { catchError, concatMap, filter, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import {
  addOIDCConfiguration, deleteOIDCConfiguration, loadOIDCConfigurations,
  updateOIDCConfiguration,
} from '../state/oidc-configuration.actions';
import { selectOIDCConfigurationList, selectOIDCConfigurationsLoadStatus, selectDraftOIDCConfiguration } from '../state/oidc-configuration.selectors';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { AdminSseService, EventType } from '../../shared/services/admin-sse.service';
import { DebounceHelper } from '../../helpers/debounce.helper';

type OIDCConfigurationCreateModel = Omit<OIDCConfigurationModel, 'id'>;
type OIDCConfigurationEditModel = Partial<OIDCConfigurationCreateModel>;

@Injectable({
  providedIn: 'root',
})
export class OIDCConfigurationService implements OnDestroy {

  public static ROOT_NODE_TITLE = $localize `OIDCConfiguration layers`;
  public static ROOT_BACKGROUND_NODE_TITLE = $localize `Background layers`;

  private destroyed = new Subject<null>();

  public constructor(
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private adminSnackbarService: AdminSnackbarService,
    private sseService: AdminSseService,
  ) {
  }

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
            this.store$.dispatch(loadOIDCConfigurations());
          }
        }),
        filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
        switchMap(() => this.store$.select(selectOIDCConfigurationList)),
      );
  }

  public createOIDCConfiguration$(oidcConfiguration: OIDCConfigurationCreateModel) {
    return this.adminApiService.createOIDCConfiguration$({ oidcConfiguration })
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `Error while creating oidcConfiguration.`);
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
              issuerUrl: oidcConfiguration.issuerUrl,
              userNameAttribute: oidcConfiguration.userNameAttribute,
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
          this.adminSnackbarService.showMessage($localize `Error while updating oidcConfiguration.`);
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
          this.adminSnackbarService.showMessage($localize `Error while deleting oidcConfiguration.`);
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
