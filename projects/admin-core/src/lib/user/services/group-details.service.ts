import { Inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, Subject, tap } from 'rxjs';
import { GroupModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel } from '@tailormap-admin/admin-api';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';


@Injectable({
  providedIn: 'root',
})
export class GroupDetailsService implements OnDestroy {

  private selectedGroup: BehaviorSubject<GroupModel|null> = new BehaviorSubject<GroupModel |null>(null);
  public selectedGroup$: Observable<GroupModel|null> = this.selectedGroup.asObservable();

  private groupList: BehaviorSubject<GroupModel[]> = new BehaviorSubject<GroupModel[]>([]);
  private groupList$: Observable<GroupModel[]> = this.groupList.asObservable();
  private groupListFetched = false;

  private destroyed = new Subject();

  public constructor(
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private adminSnackbarService: AdminSnackbarService,
  ) {
    this.getGroups();
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public getGroups$(): Observable<GroupModel[]> {
    if (!this.groupListFetched) {
      this.getGroups();
    }
    return this.groupList$;
  }

  public getGroups() {
    this.adminApiService.getGroups$()
      .pipe(
        catchError(response => {
          this.adminSnackbarService.showMessage($localize`Error while getting groups. ${response.error?.message}`);
          return of(null);
        }),
      )
      .subscribe(groups => {
        if (groups) {
          this.groupList.next(groups);
        }
      });
  }

  public selectGroup(selectedName: string | null) {
    if (selectedName === null) {
      this.selectedGroup.next(null);
      return;
    }
    this.adminApiService.getGroup$(selectedName)
      .pipe(
        catchError(response => {
          this.adminSnackbarService.showMessage($localize`Error while getting group ${selectedName}. ${response.error?.message}`);
          return of(null);
        }),
      )
      .subscribe(group => {
        if (group) {
          this.selectedGroup.next(group);
        }
      });
  }

  public addOrUpdateGroup$(add: boolean, group: GroupModel) {
    if (add) {
      return this.adminApiService.createGroup$({ group })
        .pipe(
          catchError((response) => {
            this.adminSnackbarService.showMessage($localize`Error while creating group ${group.name}. ${response.error?.message}`);
            return of(null);
          }),
          tap(createdGroup => {
            if (createdGroup) {
              this.groupList.next([ ...this.groupList.value, createdGroup ]);
            }
          }),
        );
    }
    return this.adminApiService.updateGroup$({ name: group.name, group })
      .pipe(
        catchError((response) => {
          this.adminSnackbarService.showMessage($localize`Error while updating group ${group.name}. ${response.error?.message}`);
          return of(null);
        }),
        tap(updatedGroup => {
          if (updatedGroup) {
            this.groupList.next(this.groupList.value.map(g => g.name === updatedGroup.name ? updatedGroup : g));
          }
        }),
      );
  }

  public deleteGroup$(groupName: string) {
    return this.adminApiService.deleteGroup$(groupName)
      .pipe(
        catchError((response) => {
          this.adminSnackbarService.showMessage($localize`Error while deleting group ${groupName}. ${response.error?.message}`);
          return of(null);
        }),
        tap(response => {
          if (response) {
            this.groupList.next(this.groupList.value.filter(g => g.name !== groupName));
            if (this.selectedGroup.value?.name === groupName) {
              this.selectedGroup.next(null);
            }
          }
        }),
      );
  }

}
