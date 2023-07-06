import { DestroyRef, Inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, filter, map, Observable, of, switchMap, tap } from 'rxjs';
import {
  GroupModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { DebounceHelper, LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectGroups, selectGroupsLoadStatus } from '../state/user.selectors';
import { addGroup, deleteGroup, loadGroups, updateGroup } from '../state/user.actions';
import { Store } from '@ngrx/store';
import { AdminSseService, EventType } from '../../shared/services/admin-sse.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Injectable({
  providedIn: 'root',
})
export class GroupService {

  private selectedGroup: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public selectedGroup$: Observable<string | null> = this.selectedGroup.asObservable();

  public constructor(
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private store$: Store,
    private adminSnackbarService: AdminSnackbarService,
    private sseService: AdminSseService,
    private destroyRef: DestroyRef,
  ) {}

  public listenForGroupChanges() {
    this.sseService.listenForEvents$<GroupModel>('Group')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event.eventType === EventType.ENTITY_CREATED && event.details.object) {
          this.updateGroupState(event.details.object.name, 'add', event.details.object);
        }
        if (event.eventType === EventType.ENTITY_UPDATED && event.details.object) {
          this.updateGroupState(event.details.object.name, 'update', event.details.object);
        }
        if (event.eventType === EventType.ENTITY_DELETED) {
          this.updateGroupState(event.details.id, 'remove');
        }
      });
  }

  public getGroups$(): Observable<GroupModel[]> {
    return this.store$.select(selectGroupsLoadStatus)
      .pipe(
        tap(loadStatus => {
          if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
            this.store$.dispatch(loadGroups());
          }
        }),
        filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
        switchMap(() => this.store$.select(selectGroups)),
      );
  }

  public getGroupByName$(name: string): Observable<GroupModel | null> {
    return this.getGroups$()
      .pipe(map(groups => groups.find(u => u.name === name) || null));
  }

  public selectGroup(selectedName: string | null) {
    this.selectedGroup.next(selectedName);
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
              this.updateGroupState(createdGroup.name, 'add', createdGroup);
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
            this.updateGroupState(updatedGroup.name, 'update', updatedGroup);
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
            this.updateGroupState(groupName, 'remove');
            if (this.selectedGroup.value === groupName) {
              this.selectedGroup.next(null);
            }
          }
        }),
      );
  }

  private updateGroupState(
    name: string,
    type: 'add' | 'update' | 'remove',
    group?: GroupModel | null,
  ) {
    // Add a small timeout to prevent most duplicate updates to prevent many state updates
    // For data integrity, it should not matter if we update the state twice
    DebounceHelper.debounce(`group-${type}-${name}`, () => {
      if (type === 'add' && group) {
        this.store$.dispatch(addGroup({ group }));
      }
      if (type === 'update' && group) {
        this.store$.dispatch(updateGroup({ group }));
      }
      if (type === 'remove') {
        this.store$.dispatch(deleteGroup({ groupName: name }));
      }
    }, 50);
  }

}
