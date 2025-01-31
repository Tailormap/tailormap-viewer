import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { GroupModel } from '@tailormap-admin/admin-api';
import { Router } from '@angular/router';
import { GroupService } from '../services/group.service';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

@Component({
  selector: 'tm-admin-group-create',
  templateUrl: './group-create.component.html',
  styleUrls: ['./group-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class GroupCreateComponent implements OnDestroy {

  private savingSubject = new BehaviorSubject(false);
  private destroyed = new Subject();

  public saving$ = this.savingSubject.asObservable();
  public group: Omit<GroupModel, 'id'> | null = null;

  constructor(
    private groupDetailsService: GroupService,
    private router: Router,
    private adminSnackbarService: AdminSnackbarService,
  ) { }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateGroup($event: Omit<GroupModel, 'id'> | null) {
    this.group = $event;
  }

  public save() {
    if (!this.group) {
      return;
    }
    this.savingSubject.next(true);
    this.groupDetailsService.addOrUpdateGroup$(true, this.group)
      .pipe(takeUntil(this.destroyed))
      .subscribe(createGroup => {
        if (createGroup) {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.groups.group-created:Group ${createGroup.name} created`);
          this.router.navigateByUrl('/admin/groups/group/' + createGroup.name);
        }
        this.savingSubject.next(false);
      });
  }
}
