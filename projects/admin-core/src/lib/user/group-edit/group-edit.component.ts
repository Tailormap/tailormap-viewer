import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { GroupModel } from '@tailormap-admin/admin-api';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupDetailsService } from '../services/group-details.service';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

@Component({
  selector: 'tm-admin-group-edit',
  templateUrl: './group-edit.component.html',
  styleUrls: ['./group-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupEditComponent implements OnInit, OnDestroy {

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  private destroyed = new Subject();
  public group$: Observable<GroupModel | null> = of(null);
  public updatedGroup: GroupModel | null = null;

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupDetailsService,
    private confirmDelete: ConfirmDialogService,
    private router: Router,
    private adminSnackbarService: AdminSnackbarService,
  ) { }

  public ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroyed),
        map(params => params.get('groupName')),
        distinctUntilChanged(),
        filter((name): name is string => !!name),
      )
      .subscribe(name => this.groupService.selectGroup(name));
    this.group$ = this.groupService.selectedGroup$;
  }

  public ngOnDestroy(): void {
    this.clearSelectedGroup();
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateGroup(updatedGroup: GroupModel) {
    this.updatedGroup = updatedGroup;
  }

  public delete(group: GroupModel) {
    this.confirmDelete.confirm$(
      `Delete group ${group.name}`,
      `Are you sure you want to delete the group with name ${group.name}? This action cannot be undone.`,
      true,
    )
      .pipe(
        take(1),
        filter(answer => answer),
        switchMap(() => this.groupService.deleteGroup$(group.name)),
      )
      .subscribe(() => {
        this.adminSnackbarService.showMessage($localize `Group ${group.name} removed`);
        this.router.navigateByUrl('/groups');
      });
  }

  public save() {
    if (!this.updatedGroup) {
      return;
    }
    this.savingSubject.next(true);
    this.groupService.addOrUpdateGroup$(false, this.updatedGroup)
      .pipe(take(1))
      .subscribe(updatedGroup => {
        if (updatedGroup) {
          this.adminSnackbarService.showMessage($localize `Group updated`);
        }
        this.savingSubject.next(false);
      });
  }

  public clearSelectedGroup() {
    this.groupService.selectGroup(null);
  }

}
