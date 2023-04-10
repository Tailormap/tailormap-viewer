import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  AppContentModel,
  ApplicationModel, AppTreeNodeModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, of } from 'rxjs';
import { SnackBarMessageComponent, Subset } from '@tailormap-viewer/shared';
import { addApplications, deleteApplication, updateApplication } from '../state/application.actions';

type ApplicationEditModel = Omit<ApplicationModel, 'id'>;

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {

  public constructor(
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private snackBar: MatSnackBar,
  ) { }

  public createApplication$(application: ApplicationEditModel) {
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

  public updateApplicationTree$(id: string, applicationTree: AppTreeNodeModel[], treeKey: keyof AppContentModel) {
    const patchModel: Subset<ApplicationModel> = {
      contentRoot: {
        [treeKey]: applicationTree,
      },
    };
    return this.adminApiService.updateApplication$({ id, application: patchModel })
      .pipe(
        catchError(() => {
          this.showErrorMessage($localize `Error while updating application tree.`);
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

}
