import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  ApplicationModel, AppTreeLevelNodeModel, AppTreeNodeModel, TailormapAdminApiV1Service,
} from '@tailormap-admin/admin-api';
import { catchError, concatMap, distinctUntilChanged, filter, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { DebounceHelper, LoadingStateEnum } from '@tailormap-viewer/shared';
import {
  addApplicationRootNodes, addApplication, deleteApplication, loadApplications,
  updateApplication,
} from '../state/application.actions';
import { selectApplicationList, selectApplicationsLoadStatus, selectDraftApplication } from '../state/application.selectors';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { AdminSseService, EventType } from '../../shared/services/admin-sse.service';

type ApplicationCreateModel = Omit<ApplicationModel, 'id'>;
type ApplicationEditModel = Partial<ApplicationCreateModel>;

@Injectable({
  providedIn: 'root',
})
export class ApplicationService implements OnDestroy {

  public static ROOT_NODE_TITLE = $localize `:@@admin-core.application.application-layers:Application layers`;
  public static ROOT_BASE_NODE_TITLE = $localize `:@@admin-core.application.base-maps:Basemaps`;
  public static ROOT_TERRAIN_NODE_TITLE = $localize `:@@admin-core.application.terrain-layers:Terrain layers`;

  private destroyed = new Subject<null>();

  public constructor(
    private store$: Store,
    private adminApiService: TailormapAdminApiV1Service,
    private adminSnackbarService: AdminSnackbarService,
    private sseService: AdminSseService,
  ) {
    this.store$.select(selectDraftApplication)
      .pipe(
        takeUntil(this.destroyed),
        distinctUntilChanged((a, b) => {
          return a?.id === b?.id;
        }),
      )
      .subscribe(application => {
        this.ensureApplicationHasRootNodes(application);
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public listenForApplicationChanges() {
    this.sseService.listenForEvents$<ApplicationModel>('Application')
      .pipe(takeUntil(this.destroyed))
      .subscribe(event => {
        if (event.eventType === EventType.ENTITY_CREATED && event.details.object) {
          this.updateApplicationState(event.details.object.id, 'add', event.details.object);
        }
        if (event.eventType === EventType.ENTITY_UPDATED && event.details.object) {
          this.updateApplicationState(event.details.object.id, 'update', event.details.object);
        }
        if (event.eventType === EventType.ENTITY_DELETED) {
          this.updateApplicationState(event.details.id, 'remove');
        }
      });
  }

  public getApplications$() {
    return this.store$.select(selectApplicationsLoadStatus)
      .pipe(
        tap(loadStatus => {
          if (loadStatus === LoadingStateEnum.INITIAL) {
            this.store$.dispatch(loadApplications());
          }
        }),
        filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
        switchMap(() => this.store$.select(selectApplicationList)),
      );
  }

  public createApplication$(application: ApplicationCreateModel) {
    return this.adminApiService.createApplication$({ application })
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.application.error-creating-application:Error while creating application.`);
          return of(null);
        }),
        map(createApplication => {
          if (createApplication) {
            this.updateApplicationState(createApplication.id, 'add', createApplication);
            return createApplication;
          }
          return null;
        }),
      );
  }

  public saveDraftApplication$() {
    return this.store$.select(selectDraftApplication)
      .pipe(
        takeUntil(this.destroyed),
        concatMap(application => {
          if (application) {
            // Save specific properties only.
            // By default, the API adds properties like _links etc., we don't want to patch those
            const draftApplication: ApplicationModel = {
              id: application.id,
              name: application.name,
              title: application.title,
              adminComments: application.adminComments,
              previewText: application.previewText,
              crs: application.crs,
              initialExtent: application.initialExtent,
              maxExtent: application.maxExtent,
              contentRoot: application.contentRoot,
              settings: application.settings,
              components: application.components,
              styling: application.styling,
              authorizationRules: application.authorizationRules,
            };
            return this.updateApplication$(draftApplication.id, draftApplication);
          }
          return of(null);
        }),
      );
  }

  public updateApplication$(id: string, application: ApplicationEditModel) {
    return this.adminApiService.updateApplication$({ id, application })
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.application.error-updating-application:Error while updating application.`);
          return of(null);
        }),
        map(updatedApplication => {
          if (updatedApplication) {
            this.updateApplicationState(updatedApplication.id, 'update', updatedApplication);
            return updatedApplication;
          }
          return null;
        }),
      );
  }

  public deleteApplication$(id: string) {
    return this.adminApiService.deleteApplication$(id)
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.application.error-deleting-application:Error while deleting application.`);
          return of(null);
        }),
        map(success => {
          if (success) {
            this.updateApplicationState(id, 'remove');
            return success;
          }
          return null;
        }),
      );
  }

  private ensureApplicationHasRootNodes(application?: ApplicationModel | null) {
    if (!application) {
      return;
    }
    if ((application.contentRoot?.layerNodes || []).length === 0) {
      this.addNodeToTree('layer', [this.createRootNode(ApplicationService.ROOT_NODE_TITLE)]);
    }
    if ((application.contentRoot?.baseLayerNodes || []).length === 0) {
      this.addNodeToTree('baseLayer', [this.createRootNode(ApplicationService.ROOT_BASE_NODE_TITLE)]);
    }
    if ((application.contentRoot?.terrainLayerNodes || []).length === 0) {
      this.addNodeToTree('terrainLayer', [this.createRootNode(ApplicationService.ROOT_TERRAIN_NODE_TITLE)]);
    }
  }

  private addNodeToTree(tree: 'layer' | 'baseLayer' | 'terrainLayer', nodes: AppTreeNodeModel[]) {
    this.store$.dispatch(addApplicationRootNodes({ tree, treeNodes: nodes }));
  }

  private createRootNode(title: string): AppTreeLevelNodeModel {
    return {
      id: 'root',
      title,
      root: true,
      objectType: 'AppTreeLevelNode',
      childrenIds: [],
    };
  }

  private updateApplicationState(
    id: string,
    type: 'add' | 'update' | 'remove',
    application?: ApplicationModel | null,
  ) {
    // Add a small timeout to prevent most duplicate updates to prevent many state updates
    // For data integrity, it should not matter if we update the state twice
    DebounceHelper.debounce(`application-${type}-${id}`, () => {
      if (type === 'add' && application) {
        this.store$.dispatch(addApplication({ application }));
      }
      if (type === 'update' && application) {
        this.store$.dispatch(updateApplication({ application }));
      }
      if (type === 'remove') {
        this.store$.dispatch(deleteApplication({ applicationId: id }));
      }
    }, 50);
  }

}
