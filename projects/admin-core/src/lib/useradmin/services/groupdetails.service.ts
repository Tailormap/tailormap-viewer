import { Inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, Subject } from 'rxjs';
import { GroupModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel } from '@tailormap-admin/admin-api';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';


@Injectable({
  providedIn: 'root',
})
export class GroupdetailsService implements OnDestroy {

  private selectedGroup: BehaviorSubject<GroupModel|null> = new BehaviorSubject<GroupModel |null>(null);
  public selectedGroup$: Observable<GroupModel|null> = this.selectedGroup.asObservable();
  private groupList: BehaviorSubject<GroupModel[]> = new BehaviorSubject<GroupModel[]>([]);
  public groupList$: Observable<GroupModel[]> = this.groupList.asObservable();
  private destroyed = new Subject();

  public constructor(@Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
                     private snackBar: MatSnackBar) {
    this.getGroups();
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public getGroups() {
    this.adminApiService.getGroups$()
      .pipe(
        catchError(response => {
          this.showErrorMessage($localize`Error while getting groups. ${response.error?.message}`);
          return of(null);
        }),
      )
      .subscribe(groups => {
        if (groups) {
          this.groupList.next(groups);
        }
      });
  }

  public selectGroup(selectedName: string) {
    this.adminApiService.getGroup$(selectedName)
      .pipe(
        catchError(response => {
          this.showErrorMessage($localize`Error while getting group ${selectedName}. ${response.error?.message}`);
          return of(null);
        }),
      )
      .subscribe(group => {
        if (group) {
          this.selectedGroup.next(group);
        }
      });
  }

  public addOrUpdateGroup(add: boolean, group: GroupModel) {
    if (add) {
      this.adminApiService.createGroup$({ group })
        .pipe(
          catchError((response) => {
            this.showErrorMessage($localize`Error while creating group ${group.name}. ${response.error?.message}`);
            return of(null);
          }),
        )
        .subscribe(createdGroup => {
          if (createdGroup) {
            this.getGroups();
          }
        });
    } else {
      this.adminApiService.updateGroup$({ name: group.name, group })
        .pipe(
          catchError((response) => {
            this.showErrorMessage($localize`Error while updating group ${group.name}. ${response.error?.message}`);
            return of(null);
          }),
        )
        .subscribe(createdGroup => {
          if (createdGroup) {
            this.getGroups();
          }
        });
    }
  }

  public deleteGroup(group: GroupModel) {
    this.adminApiService.deleteGroup$(group.name).pipe(
      catchError((response) => {
        this.showErrorMessage($localize`Error while deleting group ${group.name}. ${response.error?.message}`);
        return of(null);
      }))
      .subscribe(() => {
        this.getGroups();
      });
  }

  private showErrorMessage(message: string) {
    SnackBarMessageComponent.open$(this.snackBar, {
      message, duration: 3000, showCloseButton: true,
    });
  }
}
