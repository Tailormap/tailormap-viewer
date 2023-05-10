import { Inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  ApplicationModel, AppTreeLevelNodeModel, AppTreeNodeModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, concatMap, distinctUntilChanged, map, of, Subject, takeUntil } from 'rxjs';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';
import {
  addApplicationRootNodes,
  addApplications, deleteApplication, loadApplicationServices, loadApplicationServicesSuccess, updateApplication,
} from '../state/application.actions';
import { selectDraftApplication } from '../state/application.selectors';
import { CatalogService } from '../../catalog/services/catalog.service';
import { ApplicationModelHelper } from '../helpers/application-model.helper';

type ApplicationCreateModel = Omit<ApplicationModel, 'id'>;
type ApplicationEditModel = Partial<ApplicationCreateModel>;

@Injectable({
  providedIn: 'root',
})
export class ApplicationService implements OnDestroy {

  public static ROOT_NODE_TITLE = $localize `Application layers`;
  public static ROOT_BACKGROUND_NODE_TITLE = $localize `Background layers`;

  private destroyed = new Subject<null>();

  public constructor(
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private snackBar: MatSnackBar,
    private catalogService: CatalogService,
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
        this.loadServicesForApplication(application);
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public createApplication$(application: ApplicationCreateModel) {
    return this.adminApiService.createApplication$({ application })
      .pipe(
        catchError(() => {
          this.showErrorMessage($localize `Error while creating application.`);
          return of(null);
        }),
        map(createApplication => {
          if (createApplication) {
            this.store$.dispatch(addApplications({ applications: [createApplication] }));
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
          this.showErrorMessage($localize `Error while updating application.`);
          return of(null);
        }),
        map(updatedApplication => {
          if (updatedApplication) {
            this.store$.dispatch(updateApplication({ application: updatedApplication }));
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
          this.showErrorMessage($localize `Error while deleting application.`);
          return of(null);
        }),
        map(success => {
          if (success) {
            this.store$.dispatch(deleteApplication({ applicationId: id }));
            return success;
          }
          return null;
        }),
      );
  }

  private showErrorMessage(message: string) {
    SnackBarMessageComponent.open$(this.snackBar, {
      message,
      duration: 3000,
      showCloseButton: true,
    });
  }

  private loadServicesForApplication(application?: ApplicationModel | null) {
    if (!application) {
      return;
    }
    const serviceIds = [
      ...(application.contentRoot?.layerNodes || []),
      ...(application.contentRoot?.baseLayerNodes || []),
    ]
      .filter(ApplicationModelHelper.isLayerTreeNode)
      .map(node => node.serviceId);
    const applicationServiceIds = Array.from(new Set(serviceIds));
    const serviceRequests$ = this.catalogService.getServices$(applicationServiceIds, this.destroyed);
    if (serviceRequests$) {
      this.store$.dispatch(loadApplicationServices());
      serviceRequests$.subscribe(() => {
        this.store$.dispatch(loadApplicationServicesSuccess());
      });
    }
  }

  private ensureApplicationHasRootNodes(application?: ApplicationModel | null) {
    if (!application) {
      return;
    }
    if ((application.contentRoot?.layerNodes || []).length === 0) {
      this.addNodeToTree('layer', [this.createRootNode(ApplicationService.ROOT_NODE_TITLE)]);
    }
    if ((application.contentRoot?.baseLayerNodes || []).length === 0) {
      this.addNodeToTree('baseLayer', [this.createRootNode(ApplicationService.ROOT_BACKGROUND_NODE_TITLE)]);
    }
  }

  private addNodeToTree(tree: 'layer' | 'baseLayer', nodes: AppTreeNodeModel[]) {
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

}
